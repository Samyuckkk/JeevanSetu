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

module.exports = router 