const mongoose = require('mongoose')

const citizenSchema = new mongoose.Schema({
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

    totalRewardPoints: {
        type: Number,
        default: 0
    },

    rewardHistory: [
        {
            points: Number,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]

},
{
    timestamps: true
}
)

const userModel = mongoose.model('citizen', citizenSchema)

module.exports = userModel