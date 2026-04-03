const hospitalModel = require('../models/hospital.model')
const incidentModel = require('../models/incident.model')
const { buildIncidentRealtimePayload } = require('../services/incident.service')

async function updateInventory(req, res) {
  try {
    const { inventory } = req.body
    const hospital = await hospitalModel.findByIdAndUpdate(
      req.user.id,
      { inventory },
      { new: true },
    )

    if (!hospital) return res.status(404).json({ message: 'Hospital not found' })

    res.status(200).json({ message: 'Inventory updated', hospital })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

async function getDashboardCases(req, res) {
  try {
    const incidents = await incidentModel
      .find({
        assignedHospital: req.user.id,
      })
      .sort({ updatedAt: -1 })
      .populate('assignedAmbulance', 'vehicleNumber type status location')
      .populate('assignedHospital', 'name email location inventory status')
      .populate('selectedHospital', 'name email location inventory status')
      .populate('hospitalOptions.hospital', 'name email location inventory status')

    res.status(200).json({
      incidents: incidents.map((incident) => buildIncidentRealtimePayload(incident)),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getDashboardCases, updateInventory }
