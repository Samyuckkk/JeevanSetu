// create server

const express = require('express')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/auth.routes')
const citizenRoutes = require('./routes/citizen.routes')
const ambulanceRoutes = require('./routes/ambulance.routes')
const cors = require('cors')

const app = express()

app.use(cors({
    origin: "http://localhost:5174",
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
    res.send('Hellooooooooooo')
})

app.use('/api/auth', authRoutes)
app.use('/api/citizen', citizenRoutes)
app.use('/api/ambulance', ambulanceRoutes)

module.exports = app