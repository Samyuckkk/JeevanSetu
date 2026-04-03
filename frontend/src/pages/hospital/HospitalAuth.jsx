import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Mail, Lock, MapPin, Activity, Map, Navigation, HeartPulse } from 'lucide-react'
import AuthLayout from '../../components/AuthLayout'

export default function HospitalAuth({ mode }) {
  const isLogin = mode === 'login'
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    lat: '',
    lng: '',
    icuBeds: 0,
    ventilators: 0,
    generalBeds: 0,
    specialists: ''
  })
  const [gettingLocation, setGettingLocation] = useState(false)
  const [locError, setLocError] = useState('')

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleGetLocation = () => {
    setGettingLocation(true)
    setLocError('')
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          }))
          setGettingLocation(false)
        },
        (error) => {
          setLocError('Could not get location. Ensure permissions are granted.')
          setGettingLocation(false)
        }
      )
    } else {
      setLocError('Geolocation not supported by your browser')
      setGettingLocation(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    let submitData = { ...formData }
    if (!isLogin) {
      // transform specialists comma separated to array
      submitData.specialists = submitData.specialists.split(',').map(s => s.trim()).filter(s => s)
      // group inventory
      submitData.inventory = {
        icuBeds: Number(formData.icuBeds),
        ventilators: Number(formData.ventilators),
        generalBeds: Number(formData.generalBeds),
        specialists: submitData.specialists
      }
      submitData.location = { lat: Number(formData.lat), lng: Number(formData.lng) }
      delete submitData.icuBeds
      delete submitData.ventilators
      delete submitData.generalBeds
    }
    
    console.log('Hospital Submit:', mode, submitData)
    // Add real API call here
  }

  return (
    <AuthLayout 
      title={`Hospital ${isLogin ? 'Login' : 'Registration'}`}
      subtitle={isLogin ? 'Access your dashboard.' : 'Partner with us as a primary care provider.'}
      imageNode={<Building2 className="w-16 h-16 text-white" />}
      bgClass="animated-bg-hospital"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        
        <AnimatePresence>
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 pt-1"
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Activity className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Hospital Name"
                  className="input-glass w-full py-3 pl-10 pr-4 rounded-xl text-gray-900 placeholder-gray-500 font-medium"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Mail className="w-5 h-5" />
          </div>
          <input
            type="email"
            name="email"
            placeholder="Official Email"
            className="input-glass w-full py-3 pl-10 pr-4 rounded-xl text-gray-900 placeholder-gray-500 font-medium"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Lock className="w-5 h-5" />
          </div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input-glass w-full py-3 pl-10 pr-4 rounded-xl text-gray-900 placeholder-gray-500 font-medium"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <AnimatePresence>
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 pt-4 border-t border-gray-200 mt-4 overflow-hidden"
            >
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location Details
              </h3>
              
              <div className="flex gap-2 isolate">
                <input
                  type="number"
                  step="any"
                  name="lat"
                  placeholder="Latitude"
                  className="input-glass w-1/2 py-2 px-3 rounded-lg text-gray-900 placeholder-gray-500 text-sm"
                  value={formData.lat}
                  onChange={handleChange}
                  required={!isLogin}
                />
                <input
                  type="number"
                  step="any"
                  name="lng"
                  placeholder="Longitude"
                  className="input-glass w-1/2 py-2 px-3 rounded-lg text-gray-900 placeholder-gray-500 text-sm"
                  value={formData.lng}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
              
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="w-full flex justify-center items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Navigation className="w-4 h-4" />
                {gettingLocation ? 'Fetching...' : 'Use Current Location'}
              </button>
              {locError && <p className="text-red-500 text-xs text-center">{locError}</p>}

              <h3 className="font-bold text-gray-700 flex items-center gap-2 mt-6">
                <HeartPulse className="w-4 h-4" /> Capacity & Inventory
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">ICU Beds</label>
                  <input type="number" min="0" name="icuBeds" value={formData.icuBeds} onChange={handleChange} className="input-glass w-full py-2 px-3 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ventilators</label>
                  <input type="number" min="0" name="ventilators" value={formData.ventilators} onChange={handleChange} className="input-glass w-full py-2 px-3 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Gen. Beds</label>
                  <input type="number" min="0" name="generalBeds" value={formData.generalBeds} onChange={handleChange} className="input-glass w-full py-2 px-3 rounded-lg text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Specialists (comma separated)</label>
                <input 
                  type="text" 
                  name="specialists" 
                  placeholder="e.g. cardiac, neuro"
                  value={formData.specialists} 
                  onChange={handleChange} 
                  className="input-glass w-full py-2 px-3 rounded-lg text-sm placeholder-gray-400" 
                />
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition-all mt-6"
        >
          {isLogin ? 'Sign In' : 'Register Hospital'}
        </motion.button>
      </form>

      <div className="mt-6 text-center text-sm font-medium text-gray-600">
        {isLogin ? "Not partnered yet? " : "Already partnered with us? "}
        <Link 
          to={isLogin ? "/hospital/register" : "/hospital/login"} 
          className="text-emerald-600 hover:text-emerald-800 font-bold hover:underline"
        >
          {isLogin ? 'Register now' : 'Login instead'}
        </Link>
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05); 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.15); 
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.25); 
        }
      `}</style>
    </AuthLayout>
  )
}
