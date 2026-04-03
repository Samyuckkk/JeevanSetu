const express = require('express')
const router = express.Router()

const { updateInventory } = require('../controller/hospital.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.put('/inventory', authMiddleware, updateInventory)

module.exports = router
