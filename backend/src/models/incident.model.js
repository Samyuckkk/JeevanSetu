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
    }

}, { timestamps: true })

const incidentModel = mongoose.model('incident', incidentSchema)

module.exports = incidentModel