const incidentModel = require("../models/incident.model");
const citizenModel = require("../models/citizen.model");
const storageService = require("../services/storage.service");
const { v4: uuid } = require("uuid");
const { getIO } = require('../socket');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    const uploadResult = await storageService.uploadFile(
      req.file.buffer,
      uuid(),
    );

    if (!uploadResult || !uploadResult.url) {
      return res.status(500).json({
        message: "Image upload failed",
      });
    }

    let isHighSeverityTrauma = false;
    let traumaSeverityAssessment = "No AI analysis performed.";

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 300,
        }
      });
      
      const prompt = "Analyze this image of an incident. Does it appear to be a high-severity trauma case (e.g. major car accident, severe visible wound, uncontrollable bleeding)? Respond with a JSON object containing exactly two keys: 'isHighSeverity' (boolean) and 'assessment' (string explaining in 1-2 short sentences why).";
      
      const imagePart = {
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype || "image/jpeg"
        }
      };

      let responseText = result.response.text();
      responseText = responseText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const aiContent = JSON.parse(responseText);
      
      isHighSeverityTrauma = aiContent.isHighSeverity === true;
      traumaSeverityAssessment = aiContent.assessment || "Analysis complete.";
    } catch (aiErr) {
      console.error("Gemini processing failed:", aiErr);
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
