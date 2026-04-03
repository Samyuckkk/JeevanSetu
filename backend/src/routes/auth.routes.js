const express = require('express')
const authController = require('../controller/auth.controller')

const router = express.Router()

// citizen auth API
router.post('/citizen/register', authController.registerCitizen)
router.post('/citizen/login', authController.loginCitizen)
router.get('/citizen/logout', authController.logoutCitizen)

// ambulance auth API
router.post('/ambulance/register', authController.registerAmbulance)
router.post('/ambulance/login', authController.loginAmbulance)
router.post('/ambulance/logout', authController.logoutAmbulance)

// hospital auth API
router.post('/hospital/register', authController.registerHospital)
router.post('/hospital/login', authController.loginHospital)
router.post('/hospital/logout', authController.logoutHospital)

module.exports = router