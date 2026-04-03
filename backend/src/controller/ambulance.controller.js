const ambulanceModel = require('../models/ambulance.model')

async function updateLocation(req, res) {
    try {
        const { ambulanceId, lat, lng } = req.body

        const ambulance = await ambulanceModel.findByIdAndUpdate(
            ambulanceId,
            {
                location: { lat, lng },
                lastLocationUpdate: new Date()
            },
            { new: true }
        )

        res.status(200).json({
            message: "Location updated",
            ambulance
        })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

module.exports = { updateLocation }