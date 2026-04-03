const express = require('express')
const router = express.Router()

const { updateInventory, getDashboardCases } = require('../controller/hospital.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.get('/dashboard-cases', authMiddleware, getDashboardCases)
router.put('/inventory', authMiddleware, updateInventory)

module.exports = router
