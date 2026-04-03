const mongoose = require('mongoose')

const incidentSchema = new mongoose.Schema({

    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'citizen',
        required: true
    },

    image: {
        type: String, // store URL/path
        required: true
    },

    aidType: {
        type: String,
        enum: ['normal', 'emergency'],
        required: true
    },

    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },

    description: {
        type: String
    },

    status: {
        type: String,
        enum: ['pending', 'assigned', 'completed'],
        default: 'pending'
    },

    assignedAmbulance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ambulance',
        default: null
    },

    assignedHospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'hospital',
        default: null
    },

    vitals: {
        heartRate: Number,
        systolicBP: Number,
        diastolicBP: Number,
        spo2: Number,
        temperature: Number,
        symptoms: String
    },

    mlPrediction: {
        icuBeds_Required: Number,
        ventilators_Required: Number,
        generalBeds_Required: Number,
        specialists_Needed: [String]
    }

}, { timestamps: true })

const incidentModel = mongoose.model('incident', incidentSchema)

module.exports = incidentModel