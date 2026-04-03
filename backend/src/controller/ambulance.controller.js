const ambulanceModel = require('../models/ambulance.model')
const incidentModel = require('../models/incident.model')
const hospitalModel = require('../models/hospital.model')
const axios = require('axios')
const { getIO } = require('../socket')

// Distance helper
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2 - lat1) * (Math.PI / 180); 
  var dLon = (lon2 - lon1) * (Math.PI / 180); 
  var a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  var d = R * c; // Distance in km
  return d;
}

async function updateLocation(req, res) {
    try {
        const { lat, lng } = req.body
        const ambulance = await ambulanceModel.findByIdAndUpdate(
            req.user.id,
            {
                location: { lat, lng },
                lastLocationUpdate: new Date()
            },
            { new: true }
        )
        res.status(200).json({ message: "Location updated", ambulance })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

async function acceptIncident(req, res) {
    try {
        const { incidentId } = req.body
        const incident = await incidentModel.findById(incidentId)
        if (!incident || incident.status !== 'pending') {
            return res.status(400).json({ message: "Incident not available." })
        }

        incident.status = 'assigned'
        incident.assignedAmbulance = req.user.id
        await incident.save()

        // Inform other ambulances it's taken
        getIO().to('ambulance').emit('incident_taken', { incidentId })

        res.status(200).json({ message: "Incident Accepted", incident })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

async function predictAllocation(req, res) {
    try {
        const { incidentId, vitals } = req.body

        // 1. Hit local ML Service
        let mlPrediction;
        try {
            const response = await axios.post('http://127.0.0.1:8000/predict', vitals)
            mlPrediction = response.data
        } catch (mlErr) {
            console.error("ML Service fails, fallback to default", mlErr.message)
            mlPrediction = {
                icuBeds_Required: 0,
                ventilators_Required: 0,
                generalBeds_Required: 1,
                specialists_Needed: ['general']
            }
        }

        const incident = await incidentModel.findById(incidentId)
        if (!incident) return res.status(404).json({ message: "Incident not found" })

        // 2. Save vitals and ml prediction to incident
        incident.vitals = vitals
        incident.mlPrediction = mlPrediction
        
        // 3. Find Hospital logic
        const allHospitals = await hospitalModel.find({ status: { $ne: 'offline' } })

        // Filter hospitals that meet criteria
        let capableHospitals = allHospitals.filter(h => {
             const inv = h.inventory || {}
             const meetsIcu = (inv.icuBeds || 0) >= mlPrediction.icuBeds_Required
             const meetsVent = (inv.ventilators || 0) >= mlPrediction.ventilators_Required
             const meetsGen = (inv.generalBeds || 0) >= mlPrediction.generalBeds_Required
             
             // Check specialists if not just 'general'
             let meetsSpec = true
             if (mlPrediction.specialists_Needed && !mlPrediction.specialists_Needed.includes('general')) {
                 const hSpec = inv.specialists || []
                 // just needs to match at least one specialized
                 meetsSpec = mlPrediction.specialists_Needed.some(reqSpec => 
                     hSpec.map(s => s.toLowerCase()).includes(reqSpec)
                 )
             }
             return meetsIcu && meetsVent && meetsGen && meetsSpec
        })

        if (capableHospitals.length === 0) {
            // fallback: any active hospital
            capableHospitals = allHospitals
        }

        // 4. Sort by distance (Haversine)
        capableHospitals.sort((a, b) => {
            const distA = getDistanceFromLatLonInKm(incident.location.lat, incident.location.lng, a.location.lat, a.location.lng)
            const distB = getDistanceFromLatLonInKm(incident.location.lat, incident.location.lng, b.location.lat, b.location.lng)
            return distA - distB
        })

        const selectedHospital = capableHospitals[0]

        incident.assignedHospital = selectedHospital._id
        await incident.save()

        // 5. Notify Hospital via Socket.io
        getIO().to(`hospital_${selectedHospital._id}`).emit('incoming_patient', {
            incident,
            eta: "10 mins" // Mock ETA
        })

        res.status(200).json({ 
            message: "Prediction and Allocation complete",
            incident,
            allocatedHospital: selectedHospital
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: err.message })
    }
}

module.exports = { updateLocation, acceptIncident, predictAllocation }