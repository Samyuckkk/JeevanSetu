import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import { Building2, Activity, MapPin, BellRing, Settings2, Save, Map as MapIcon, Loader2 } from 'lucide-react'
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api'

// Define Map options
const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '0.75rem' }

export default function HospitalDashboard() {
  const { user, API_URL, logout } = useAuth()
  
  // Local state initialized with user token payload from backend which must have these values, 
  // or fetch from separate profile endpoint
  const [inventory, setInventory] = useState({
    icuBeds: 10,
    ventilators: 5,
    generalBeds: 50,
    specialists: 'cardiac, neuro'
  })
  
  const [savingInv, setSavingInv] = useState(false)
  const [incomingPatients, setIncomingPatients] = useState([])
  const [activeRoute, setActiveRoute] = useState(null)
  
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: 'AIzaSyCR7LdvZDlkYsjANjULsrQXn7iOw46oH1Q' })

  // Assume user object has user.id, if not, we use what we have
  const hospitalId = user?.id || user?._id
  const hospitalLoc = user?.location || { lat: 18.5204, lng: 73.8567 } // default to Pune

  useEffect(() => {
    if(!hospitalId) return;
    const socket = io('http://localhost:3000', { withCredentials: true })
    
    // Join distinct hospital room
    socket.emit('join', `hospital_${hospitalId}`)

    socket.on('incoming_patient', (data) => {
      // data format: { incident: {...vitals, mlPrediction}, eta: '10 mins' }
      setIncomingPatients(prev => [data, ...prev])
      
      // Calculate Route between hospital and incident if google maps loaded
      if (window.google) {
         fetchDirections(data.incident.location, hospitalLoc)
      }
    })

    return () => socket.disconnect()
  }, [hospitalId, hospitalLoc])

  const fetchDirections = (origin, destination) => {
    if(!window.google) return;
    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(
      {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setActiveRoute(result)
        } else {
          console.error("Directions lookup failed:", status)
        }
      }
    )
  }

  const handleInventoryUpdate = async (e) => {
    e.preventDefault()
    setSavingInv(true)
    try {
      const payload = {
        icuBeds: Number(inventory.icuBeds),
        ventilators: Number(inventory.ventilators),
        generalBeds: Number(inventory.generalBeds),
        specialists: typeof inventory.specialists === 'string' ? inventory.specialists.split(',').map(s=>s.trim()) : inventory.specialists
      }
      await axios.put(`${API_URL}/hospital/inventory`, { inventory: payload })
      alert("Inventory synced securely.")
    } catch (err) {
      alert("Failed updating inventory.")
    } finally {
      setSavingInv(false)
    }
  }

  if (!user || user.role !== 'hospital') return <Navigate to="/hospital/login" />

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-emerald-700 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <h1 className="text-2xl font-bold">{user.name} Control Center</h1>
          </div>
          <button onClick={logout} className="text-sm border border-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-bold transition-colors">Logout</button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Inventory & Status */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Settings2 className="w-5 h-5 text-emerald-600"/> Real-time Inventory</h2>
            
            <form onSubmit={handleInventoryUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">Available ICU Beds</label>
                <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-semibold text-lg" value={inventory.icuBeds} onChange={e=>setInventory({...inventory, icuBeds: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">Available Ventilators</label>
                <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-semibold text-lg" value={inventory.ventilators} onChange={e=>setInventory({...inventory, ventilators: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">General Beds</label>
                <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-semibold text-lg" value={inventory.generalBeds} onChange={e=>setInventory({...inventory, generalBeds: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">On-Call Specialists</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-medium" value={inventory.specialists} onChange={e=>setInventory({...inventory, specialists: e.target.value})} />
                <p className="text-xs text-gray-400 mt-1">Comma separated</p>
              </div>

              <button type="submit" disabled={savingInv} className="w-full py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl flex items-center justify-center gap-2 mt-4 transition-colors">
                {savingInv ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5"/>} Save Inventory to ML Engine
              </button>
            </form>
          </section>
        </div>

        {/* Right Columns: Map & Incoming Flow */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 min-h-[400px] flex flex-col relative">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><MapIcon className="w-5 h-5 text-blue-500"/> Live Routing Feed</h2>
            <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden relative">
              
              {!isLoaded && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400"/></div>}
              
              {isLoaded && (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={hospitalLoc}
                  zoom={14}
                  options={{ disableDefaultUI: true }}
                >
                  <Marker position={hospitalLoc} label="H" />
                  {activeRoute && (
                    <DirectionsRenderer 
                       directions={activeRoute} 
                       options={{
                         polylineOptions: { strokeColor: '#059669', strokeWeight: 5 }
                       }}
                    />
                  )}
                </GoogleMap>
              )}

              {/* API Placeholder Warning Overlay based on string */}
              {/*<div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-xs font-bold px-3 py-1 rounded shadow-sm text-amber-700 border border-amber-200">
                Awaiting valid API Key... Replace 'PLACEHOLDER_API_KEY_HERE_REPLACE_ME' in Dashboard.jsx
              </div>*/}

            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BellRing className="w-5 h-5 text-rose-500 animate-pulse"/> Incoming Alerts</h2>
                <span className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-sm">{incomingPatients.length} En Route</span>
             </div>

             <div className="space-y-4">
               {incomingPatients.length === 0 && <p className="text-gray-500 italic">No incoming emergencies currently.</p>}
               {incomingPatients.map((req, idx) => (
                 <div key={idx} className="p-5 border border-rose-200 bg-rose-50 rounded-xl flex flex-col gap-3">
                   <div className="flex justify-between items-start">
                     <div>
                       <span className="bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Critical Impact</span>
                       <h3 className="font-bold text-gray-900 mt-2 text-lg">Patient inbound via Ambulance</h3>
                     </div>
                     <div className="bg-white border border-rose-100 px-4 py-2 rounded-lg text-center shadow-sm">
                       <p className="text-xs text-gray-500 font-bold uppercase">ML Predicted ETA</p>
                       <p className="font-black text-rose-600 text-xl">{req.eta}</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                     <div className="bg-white p-2 rounded border border-gray-100 text-center">
                       <p className="text-[10px] text-gray-500 uppercase font-bold">Predict ICU</p>
                       <p className="font-bold">{req.incident.mlPrediction?.icuBeds_Required > 0 ? 'YES' : 'NO'}</p>
                     </div>
                     <div className="bg-white p-2 rounded border border-gray-100 text-center">
                       <p className="text-[10px] text-gray-500 uppercase font-bold">SpO2</p>
                       <p className="font-bold text-rose-600">{req.incident.vitals?.spo2}%</p>
                     </div>
                     <div className="bg-white p-2 rounded border border-gray-100 text-center">
                       <p className="text-[10px] text-gray-500 uppercase font-bold">BP</p>
                       <p className="font-bold">{req.incident.vitals?.systolicBP}/{req.incident.vitals?.diastolicBP}</p>
                     </div>
                     <div className="bg-white p-2 rounded border border-gray-100 text-center">
                       <p className="text-[10px] text-gray-500 uppercase font-bold">Need</p>
                       <p className="font-bold capitalize truncate">{req.incident.mlPrediction?.specialists_Needed?.join(', ')}</p>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </section>

        </div>

      </div>
    </div>
  )
}
