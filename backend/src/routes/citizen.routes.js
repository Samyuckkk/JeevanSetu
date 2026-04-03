const express = require('express')
const router = express.Router()

const incidentController = require('../controller/incident.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const multer = require('multer')
const upload = multer({
    storage: multer.memoryStorage(),
})

router.post(
    '/report',
    authMiddleware,
    upload.single('image'),
    incidentController.reportIncident
)
router.get('/history', authMiddleware, incidentController.getCitizenHistory)

module.exports = router 
