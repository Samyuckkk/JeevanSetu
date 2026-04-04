const mongoose = require('mongoose');
const hospitalModel = require('./src/models/hospital.model');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/hackathon')
  .then(async () => {
    const pw = await bcrypt.hash('password123', 10);
    const existing = await hospitalModel.findOne({ email: "trauma1@hospital.com" });
    if (!existing) {
      await hospitalModel.create({
        name: "Global Level 1 Trauma Center",
        email: "trauma1@hospital.com",
        password: pw,
        location: { lat: 18.5204, lng: 73.8567 }, // Pune center
        traumaLevel: 1,
        inventory: {
          icuBeds: 20,
          ventilators: 15,
          generalBeds: 100,
          specialists: ["cardiac", "neuro", "trauma"]
        },
        status: "active"
      });
      console.log("Seeded successfully");
    } else {
      console.log("Hospital already exists");
    }
    process.exit(0);
  });
