const incidentModel = require("../models/incident.model");
const citizenModel = require("../models/citizen.model");
const storageService = require("../services/storage.service");
const { v4: uuid } = require("uuid");

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

    const incident = await incidentModel.create({
      reportedBy: req.user.id,
      image: uploadResult.url,
      aidType,
      location: {
        lat: Number(lat),
        lng: Number(lng),
      },
      description,
    });

    const user = await citizenModel.findById(req.user.id);

    user.totalRewardPoints += 500;

    user.rewardHistory.push({
      points: 500,
      reason: "Incident reported",
    });

    await user.save();

    res.status(201).json({
      message: "Incident reported successfully",
      incident,
    });
  } catch (err) {
    console.error("REPORT INCIDENT ERROR:", err);
    res.status(500).json({
      message: err.message,
    });
  }
}

module.exports = { reportIncident };
