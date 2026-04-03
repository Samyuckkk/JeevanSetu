const mongoose = require('mongoose')

const ambulanceSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, unique: true },

  password: { type: String, required: true },

  type: {
      type: String,
      enum: ['normal', 'emergency'],
      required: true
  },

  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'offline'
  },

  location: {
    lat: Number,
    lng: Number
  },

  lastLocationUpdate: {
    type: Date
  },

}, { timestamps: true })

module.exports = mongoose.model('ambulance', ambulanceSchema)