import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import { Ambulance, MapPin, Activity, Stethoscope, ChevronRight, CheckCircle2 } from 'lucide-react'

export default function AmbulanceDashboard() {
  const { user, API_URL, logout } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [activeIncident, setActiveIncident] = useState(null)
  const [vitals, setVitals] = useState({
    heartRate: 80,
    systolicBP: 120,
    diastolicBP: 80,
    spo2: 98,
    temperature: 98.6,
    symptoms: ''
  })
  const [allocatedHospital, setAllocatedHospital] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!user || user.role !== 'ambulance') return <Navigate to="/ambulance/login" />

  useEffect(() => {
    const socket = io('http://localhost:3000', { withCredentials: true })
    
    socket.emit('join', 'ambulance')

    socket.on('incoming_incident', (incident) => {
      setIncidents(prev => [incident, ...prev])
    })

    socket.on('incident_taken', ({ incidentId }) => {
      setIncidents(prev => prev.filter(i => i._id !== incidentId))
      if (activeIncident && activeIncident._id === incidentId && activeIncident.status === 'pending') {
      }
    })

    return () => socket.disconnect()
  }, [activeIncident])

  const handleAccept = async (incident) => {
    try {
      setLoading(true)
      const res = await axios.post(`${API_URL}/ambulance/accept-incident`, { incidentId: incident._id })
      setActiveIncident(res.data.incident)
      setIncidents([])
    } catch(err) {
      alert("Failed to accept or already taken.")
    } finally {
      setLoading(false)
    }
  }

  const handleVitalsSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const res = await axios.post(`${API_URL}/ambulance/predict-allocation`, {
        incidentId: activeIncident._id,
        vitals: { ...vitals, heartRate: Number(vitals.heartRate), systolicBP: Number(vitals.systolicBP), diastolicBP: Number(vitals.diastolicBP), spo2: Number(vitals.spo2), temperature: Number(vitals.temperature) }
      })
      setActiveIncident(res.data.incident)
      setAllocatedHospital(res.data.allocatedHospital)
    } catch (err) {
      alert("Failed predicting allocation.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-rose-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-rose-100">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 p-2 rounded-lg">
              <Ambulance className="text-rose-600 w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Unit: {user.vehicleNumber}</h1>
          </div>
          <button onClick={logout} className="text-sm bg-rose-100 text-rose-700 hover:bg-rose-200 px-4 py-2 rounded-lg font-bold">End Shift (Logout)</button>
        </header>

        {!activeIncident && (
          <section className="bg-white p-6 rounded-xl shadow-sm border border-rose-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="text-rose-500"/> Dispatch Radar
            </h2>
            
            {incidents.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                <div className="animate-ping w-4 h-4 bg-rose-400 rounded-full mb-4"></div>
                <p className="text-gray-500 font-medium">Scanning for emergencies in your sector...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map(inc => (
                  <div key={inc._id} className={`p-4 rounded-xl border-l-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between bg-white ${inc.aidType === 'emergency' ? 'border-red-500 bg-red-50' : 'border-blue-500'}`}>
                    <img src={inc.image} alt="Incident" className="w-24 h-24 object-cover rounded-lg shadow-sm" />
                    <div className="flex-1 w-full">
                       <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 ${inc.aidType === 'emergency' ? 'bg-red-200 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                         {inc.aidType}
                       </span>
                       <p className="text-gray-600 font-medium text-sm line-clamp-2">{inc.description || "No specific details provided."}</p>
                       <p className="text-gray-500 text-xs mt-2 flex items-center gap-1"><MapPin className="w-3 h-3"/> Location: {inc.location?.lat.toFixed(4)}, {inc.location?.lng.toFixed(4)}</p>
                    </div>
                    <button 
                      onClick={() => handleAccept(inc)}
                      disabled={loading}
                      className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-md"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeIncident && !allocatedHospital && (
          <section className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 ring-2 ring-emerald-500 ring-opacity-20 flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-emerald-800">
                <CheckCircle2 /> Incident Accepted
              </h2>
              <p className="text-gray-600 font-medium mb-6">You are en route! Gather patient symptoms upon pickup to process hospital allocation.</p>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                 <img src={activeIncident.image} className="w-full h-32 object-cover rounded-lg mb-4" alt="Reference"/>
                 <p className="text-sm font-bold text-gray-700">Coordinates: {activeIncident.location?.lat}, {activeIncident.location?.lng}</p>
              </div>
            </div>

            <form onSubmit={handleVitalsSubmit} className="flex-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Stethoscope className="text-rose-500"/> Input Patient Vitals</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Heart Rate (bpm)</label>
                  <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2" value={vitals.heartRate} onChange={e=>setVitals({...vitals, heartRate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">SpO2 (%)</label>
                  <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2" value={vitals.spo2} onChange={e=>setVitals({...vitals, spo2: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Systolic BP</label>
                  <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2" value={vitals.systolicBP} onChange={e=>setVitals({...vitals, systolicBP: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Diastolic BP</label>
                  <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2" value={vitals.diastolicBP} onChange={e=>setVitals({...vitals, diastolicBP: e.target.value})} />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-1">Observed Symptoms / Keywords</label>
                <textarea className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-400 focus:outline-none" rows="3" placeholder="e.g. chest pain, suspected stroke, severe bleeding trauma" value={vitals.symptoms} onChange={e=>setVitals({...vitals, symptoms: e.target.value})} />
              </div>

              <button disabled={loading} type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
                Predict & Allocate Hospital <ChevronRight className="w-5 h-5"/>
              </button>
            </form>
          </section>
        )}

        {allocatedHospital && (
          <section className="bg-emerald-600 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
             
             <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/cubes.png)'}}></div>

             <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4 inline-block">Allocation Complete</span>
                  <h2 className="text-4xl font-extrabold mb-2">{allocatedHospital.name}</h2>
                  <p className="text-emerald-100 font-medium text-lg mb-6"><MapPin className="inline w-5 h-5"/> {allocatedHospital.location?.lat}, {allocatedHospital.location?.lng}</p>
                  
                  <div className="bg-black/20 p-4 rounded-xl">
                    <p className="text-sm font-bold text-emerald-200 mb-1">ML Assessment Summary:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Specialists needed: {activeIncident.mlPrediction?.specialists_Needed.join(', ') || 'General'}</li>
                      <li>• ICU Beds reserved: {activeIncident.mlPrediction?.icuBeds_Required}</li>
                    </ul>
                  </div>
                </div>
                
                <div className="w-full md:w-1/3">
                   <button onClick={() => { setActiveIncident(null); setAllocatedHospital(null); setVitals({heartRate:80, systolicBP:120, diastolicBP:80, spo2:98, temperature:98.6, symptoms:'' })}} className="w-full py-4 bg-white text-emerald-700 font-bold rounded-2xl shadow-xl hover:bg-emerald-50 transition-colors">
                     Complete Mission
                   </button>
                </div>
             </div>
          </section>
        )}

      </div>
    </div>
  )
}
