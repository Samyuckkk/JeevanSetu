const incidentModel = require("../models/incident.model");
const citizenModel = require("../models/citizen.model");
const storageService = require("../services/storage.service");
const { v4: uuid } = require("uuid");
const { getIO } = require('../socket');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function runGeminiImageJsonPrompt(prompt, file) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 400,
    }
  });

  const imagePart = {
    inlineData: {
      data: file.buffer.toString('base64'),
      mimeType: file.mimetype || "image/jpeg"
    }
  };

  const result = await model.generateContent([prompt, imagePart]);
  let responseText = result.response.text();
  responseText = responseText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
  return JSON.parse(responseText);
}

async function reportIncident(req, res) {
  try {
    const { aidType, lat, lng, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    if (!aidType) {
      return res.status(400).json({ message: "Aid type is required" });
    }

    if (!lat || !lng) {
      return res.status(400).json({ message: "Location is required" });
    }

    let isHighSeverityTrauma = false;
    let traumaSeverityAssessment = "No AI analysis performed.";

    try {
      const imageValidation = await runGeminiImageJsonPrompt(
        [
          "You are validating whether an uploaded photo is suitable for emergency incident reporting.",
          "Decide whether this image shows a real emergency, injury, accident scene, medical distress, fire, disaster, road collision, or another situation that warrants ambulance/help dispatch.",
          "Reject clearly irrelevant uploads such as household objects, fans, furniture, pets, selfies, landscapes, memes, documents, food, or ordinary non-emergency scenes.",
          "Respond with a JSON object containing exactly these keys:",
          "isValidIncidentImage (boolean), confidence (string: high|medium|low), reason (string, 1-2 short sentences).",
        ].join(" "),
        req.file,
      );

      if (imageValidation.isValidIncidentImage !== true) {
        return res.status(400).json({
          message: imageValidation.reason || "The uploaded image does not appear to show a valid emergency incident.",
          imageValidation,
        });
      }

      const severityContent = await runGeminiImageJsonPrompt(
        [
          "Analyze this validated emergency incident image.",
          "Does it appear to be a high-severity trauma case such as a major crash, severe visible wound, heavy bleeding, unconscious casualty, major fire injury, or another immediately life-threatening scene?",
          "Respond with a JSON object containing exactly these keys:",
          "isHighSeverity (boolean), assessment (string explaining in 1-2 short sentences why).",
        ].join(" "),
        req.file,
      );

      isHighSeverityTrauma = severityContent.isHighSeverity === true;
      traumaSeverityAssessment = severityContent.assessment || "Analysis complete.";
    } catch (aiErr) {
      console.error("Gemini processing failed:", aiErr);
      return res.status(502).json({
        message: "Image validation service is unavailable right now. Please try again with a clear incident photo.",
      });
    }

    const uploadResult = await storageService.uploadFile(
      req.file.buffer,
      uuid(),
    );

    if (!uploadResult || !uploadResult.url) {
      return res.status(500).json({
        message: "Image upload failed",
      });
    }

    const incident = await incidentModel.create({
      reportedBy: req.user.id,
      image: uploadResult.url,
      aidType,
      location: {
        lat: Number(lat),
        lng: Number(lng),
      },
      description,
      isHighSeverityTrauma,
      traumaSeverityAssessment
    });

    const user = await citizenModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Citizen account not found" });
    }

    user.totalRewardPoints += 500;

    user.rewardHistory.push({
      points: 500,
      reason: "Incident reported",
    });

    await user.save();

    try {
      getIO().to('ambulance').emit('incoming_incident', incident);
    } catch (err) {
      console.log('Socket mapping failed or no ambulances attached', err);
    }

    res.status(201).json({
      message: "Incident reported successfully",
      incident,
      totalRewardPoints: user.totalRewardPoints,
      rewardHistory: user.rewardHistory,
    });
  } catch (err) {
    console.error("REPORT INCIDENT ERROR:", err);
    res.status(500).json({
      message: err.message,
    });
  }
}

async function getCitizenHistory(req, res) {
  try {
    const [citizen, reports] = await Promise.all([
      citizenModel.findById(req.user.id).select('name totalRewardPoints rewardHistory'),
      incidentModel
        .find({ reportedBy: req.user.id })
        .sort({ createdAt: -1 })
        .populate('assignedAmbulance', 'vehicleNumber type')
        .populate('assignedHospital', 'name status')
        .populate('selectedHospital', 'name status'),
    ])

    if (!citizen) {
      return res.status(404).json({ message: 'Citizen not found' })
    }

    res.status(200).json({
      totalRewardPoints: citizen.totalRewardPoints,
      rewardHistory: citizen.rewardHistory || [],
      reports,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { reportIncident, getCitizenHistory };
