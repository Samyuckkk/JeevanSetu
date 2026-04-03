const hospitalModel = require('../models/hospital.model')

async function updateInventory(req, res) {
    try {
        const { inventory } = req.body
        const hospital = await hospitalModel.findByIdAndUpdate(
            req.user.id,
            { inventory },
            { new: true }
        )
        if (!hospital) return res.status(404).json({ message: "Hospital not found" })
        
        res.status(200).json({ message: "Inventory updated", hospital })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

module.exports = { updateInventory }
