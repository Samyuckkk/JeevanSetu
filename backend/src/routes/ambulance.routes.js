const express = require('express')
const router = express.Router()

const { updateLocation } = require('../controller/ambulance.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.post('/location', authMiddleware, updateLocation)

module.exports = router