const mongoose = require('mongoose')

const hospitalSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    location: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },

    inventory: {
        icuBeds: {
            type: Number,
            default: 0
        },
        ventilators: {
            type: Number,
            default: 0
        },
        generalBeds: {
            type: Number,
            default: 0
        },
        specialists: [
            {
                type: String // "cardiac", "neuro"
            }
        ]
    },

    status: {
        type: String,
        enum: ['active', 'full', 'offline'],
        default: 'active'
    },

    traumaLevel: {
        type: Number,
        enum: [1, 2, 3],
        default: 3
    }

}, { timestamps: true })

module.exports = mongoose.model('hospital', hospitalSchema)