const express = require('express')
const router = express.Router()

const { updateLocation, acceptIncident, predictAllocation } = require('../controller/ambulance.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.post('/location', authMiddleware, updateLocation)
router.post('/accept-incident', authMiddleware, acceptIncident)
router.post('/predict-allocation', authMiddleware, predictAllocation)

module.exports = router