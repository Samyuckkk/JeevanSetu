const express = require('express')
const router = express.Router()

const {
    updateLocation,
    acceptIncident,
    predictAllocation,
    getPendingIncidents,
    getActiveIncident,
    selectHospital,
    streamVitals,
    markArrival,
    completeIncident
} = require('../controller/ambulance.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.get('/incidents/pending', authMiddleware, getPendingIncidents)
router.get('/incidents/active', authMiddleware, getActiveIncident)
router.post('/location', authMiddleware, updateLocation)
router.post('/accept-incident', authMiddleware, acceptIncident)
router.post('/predict-allocation', authMiddleware, predictAllocation)
router.post('/select-hospital', authMiddleware, selectHospital)
router.post('/stream-vitals', authMiddleware, streamVitals)
router.post('/mark-arrival', authMiddleware, markArrival)
router.post('/complete-incident', authMiddleware, completeIncident)

module.exports = router
