import React, { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import { Camera, MapPin, Loader2, CheckCircle2 } from 'lucide-react'

export default function CitizenDashboard() {
  const { user, API_URL, logout } = useAuth()
  const [imageFile, setImageFile] = useState(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [points, setPoints] = useState(user?.totalRewardPoints || 0)
  
  const fileInputRef = useRef(null)

  if (!user || user.role !== 'citizen') return <Navigate to="/citizen/login" />

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const handleReport = async (aidType) => {
    if (!imageFile) {
      setError("Please capture an image of the incident first.")
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // 1. Get location
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      })
      
      const { latitude, longitude } = pos.coords

      // 2. Prepare Form Data
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('aidType', aidType)
      formData.append('lat', latitude)
      formData.append('lng', longitude)
      formData.append('description', description)

      // 3. Submit Alert
      // Note: We need the citizen AuthToken in cookies which axios handles automatically
      const res = await axios.post(`${API_URL}/citizen/report`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Update Points Locally for UX
      setPoints(points + 500)
      setSuccess("Emergency reported successfully! Help is on the way. (+500 Reward Points)")
      setImageFile(null)
      setDescription('')
      if(fileInputRef.current) fileInputRef.current.value = ''

    } catch (err) {
      console.error(err)
      if (err.code === 1) {
        setError("Location permission denied. Please enable GPS.")
      } else {
        setError(err.response?.data?.message || err.message || "Failed to report incident.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.name}</h1>
          <div className="flex items-center gap-4">
            <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full shadow-inner">
              ⭐ {points} Points
            </span>
            <button onClick={logout} className="text-sm bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg font-bold transition-colors">Logout</button>
          </div>
        </header>

        <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Report an Emergency</h2>
          
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium">{error}</div>}
          {success && <div className="mb-4 p-3 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> {success}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               
               {/* Image Capture Block */}
               <div className="space-y-4">
                  <div 
                    className={`h-64 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${imageFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                    onClick={() => fileInputRef.current.click()}
                  >
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} alt="Incident Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500 font-medium">Tap to open Camera / Gallery</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleImageChange}
                  />

                  <textarea 
                    placeholder="Add a brief description (optional)"
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 h-24"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
               </div>

               {/* Action Block */}
               <div className="flex flex-col justify-center space-y-4">
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-2">
                    <h3 className="text-sm font-bold text-amber-800 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4"/> GPS Required
                    </h3>
                    <p className="text-xs text-amber-700">Submitting an alert will strictly use your current location to dispatch aid.</p>
                  </div>

                  <button 
                    onClick={() => handleReport('normal')}
                    disabled={loading}
                    className="group relative overflow-hidden h-20 bg-blue-100 hover:bg-blue-600 focus:bg-blue-600 text-blue-800 hover:text-white font-bold text-xl rounded-xl transition-all disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Normal Assist'}
                    </span>
                  </button>

                  <button 
                    onClick={() => handleReport('emergency')}
                    disabled={loading}
                    className="group relative overflow-hidden h-20 bg-red-100 hover:bg-red-600 focus:bg-red-600 text-red-800 hover:text-white font-bold text-xl rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-red-100 hover:shadow-red-600/30"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'EMERGENCY ASSIST'}
                    </span>
                  </button>
               </div>
          </div>
        </section>
      </div>
    </div>
  )
}
