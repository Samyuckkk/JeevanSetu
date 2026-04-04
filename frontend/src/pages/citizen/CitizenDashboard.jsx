import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Camera, MapPin, Loader2, CheckCircle2, Siren, ShieldAlert, Award, Mic, Languages } from 'lucide-react'

const speechLanguages = [
  { value: 'auto', label: 'Auto detect' },
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'mr-IN', label: 'Marathi' },
  { value: 'bn-IN', label: 'Bengali' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'te-IN', label: 'Telugu' },
  { value: 'kn-IN', label: 'Kannada' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'gu-IN', label: 'Gujarati' },
  { value: 'pa-IN', label: 'Punjabi' },
]

export default function CitizenDashboard() {
  const { user, loading: authLoading, API_URL, logout } = useAuth()
  const [imageFile, setImageFile] = useState(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [points, setPoints] = useState(user?.totalRewardPoints || 0)
  const [reportHistory, setReportHistory] = useState([])
  const [rewardHistory, setRewardHistory] = useState([])
  const [speechLanguage, setSpeechLanguage] = useState('auto')
  const [voiceStatus, setVoiceStatus] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isTranslatingVoice, setIsTranslatingVoice] = useState(false)
  
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (typeof user?.totalRewardPoints === 'number') {
      setPoints(user.totalRewardPoints)
    }
  }, [user])

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await axios.get(`${API_URL}/citizen/history`)
        setPoints(typeof response.data?.totalRewardPoints === 'number' ? response.data.totalRewardPoints : 0)
        setRewardHistory(Array.isArray(response.data?.rewardHistory) ? response.data.rewardHistory : [])
        setReportHistory(Array.isArray(response.data?.reports) ? response.data.reports : [])
      } catch (err) {
        console.error('Failed to load citizen history', err)
      }
    }

    loadHistory()
  }, [API_URL])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.()
    }
  }, [])

  const handleVoiceCapture = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError('Voice capture is not supported in this browser. Please type the details instead.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop?.()
      return
    }

    setError('')
    setSuccess('')
    setVoiceStatus('Listening...')

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = speechLanguage === 'auto' ? (navigator.language || 'en-IN') : speechLanguage
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      setVoiceStatus('')
      setError(event.error === 'not-allowed'
        ? 'Microphone permission was denied. Please allow microphone access and try again.'
        : 'Voice capture failed. Please try again or type the details manually.')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onresult = async (event) => {
      const spokenText = event.results?.[0]?.[0]?.transcript?.trim()

      if (!spokenText) {
        setVoiceStatus('')
        setError('No speech was detected. Please try again.')
        return
      }

      try {
        setIsTranslatingVoice(true)
        if (speechLanguage.startsWith('en')) {
          setDescription((prev) => prev ? `${prev}\n${spokenText}` : spokenText)
          setVoiceStatus('Captured your spoken details in English.')
          return
        }

        setVoiceStatus('Translating to English...')

        const response = await axios.post(`${API_URL}/citizen/translate-description`, {
          text: spokenText,
          sourceLanguage: speechLanguage,
        })

        const translatedText = response.data?.translatedText?.trim() || spokenText
        setDescription((prev) => prev ? `${prev}\n${translatedText}` : translatedText)
        setVoiceStatus(`Translated from ${response.data?.detectedLanguage || 'your language'} to English.`)
      } catch (err) {
        const fallbackText = err.response?.data?.fallbackText?.trim() || spokenText
        setDescription((prev) => prev ? `${prev}\n${fallbackText}` : fallbackText)
        setVoiceStatus(err.response?.status === 429
          ? 'Translation quota reached, so the captured transcript was added as-is.'
          : 'Translation was unavailable, so the captured transcript was added as-is.')
        setError(err.response?.data?.message || 'Voice translation failed, but the captured transcript was kept.')
      } finally {
        setIsTranslatingVoice(false)
      }
    }

    recognition.start()
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
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      })
      
      const { latitude, longitude } = pos.coords

      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('aidType', aidType)
      formData.append('lat', latitude)
      formData.append('lng', longitude)
      formData.append('description', description)

      const res = await axios.post(`${API_URL}/citizen/report`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const nextTotalPoints = typeof res.data?.totalRewardPoints === 'number'
        ? res.data.totalRewardPoints
        : points + 500
      const nextRewardHistory = Array.isArray(res.data?.rewardHistory)
        ? res.data.rewardHistory
        : [...rewardHistory, { points: 500, reason: 'Incident reported', createdAt: new Date().toISOString() }]

      setPoints(nextTotalPoints)
      setRewardHistory(nextRewardHistory)
      setReportHistory((prev) => (res.data?.incident ? [res.data.incident, ...prev] : prev))
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

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 p-6" />
  }

  if (!user || user.role !== 'citizen') return <Navigate to="/citizen/login" />

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 p-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-soft">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{user.name}</h1>
              <p className="text-xs font-semibold text-slate-500">Citizen Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
              <Award className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-emerald-700 text-sm">
                {points} Points
              </span>
            </div>
            <button onClick={logout} className="text-sm border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl font-bold transition-all shadow-sm hover:shadow-soft">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="glass-panel-light p-6 md:p-8 rounded-[2rem] shadow-soft border border-white"
        >
          <div className="flex items-center gap-3 mb-8">
            <Siren className="w-6 h-6 text-rose-500" />
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dispatch Emergency Interface</h2>
          </div>
          
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-semibold">{error}</motion.div>}
          {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> {success}</motion.div>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               
               <div className="space-y-4">
                  <div 
                    className={`h-64 rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer overflow-hidden ${imageFile ? 'border-transparent shadow-lg' : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                    onClick={() => fileInputRef.current.click()}
                  >
                    {imageFile ? (
                      <div className="relative w-full h-full">
                        <img src={URL.createObjectURL(imageFile)} alt="Incident Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="bg-white/90 text-slate-900 px-4 py-2 rounded-xl font-bold text-sm shadow-xl backdrop-blur-sm">Change Image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                            <Camera className="w-8 h-8 text-blue-500" />
                        </div>
                        <p className="text-slate-600 font-semibold">Tap to capture incident</p>
                        <p className="text-slate-400 text-xs mt-1">Camera Only</p>
                      </div>
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

                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <Languages className="h-4 w-4 text-blue-500" />
                        Optional operational details
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500"
                          value={speechLanguage}
                          onChange={(event) => setSpeechLanguage(event.target.value)}
                        >
                          {speechLanguages.map((language) => (
                            <option key={language.value} value={language.value}>
                              {language.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleVoiceCapture}
                          disabled={loading || isTranslatingVoice}
                          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${isListening ? 'bg-rose-600 text-white' : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {isTranslatingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                          {isListening ? 'Stop Recording' : isTranslatingVoice ? 'Translating...' : 'Speak Details'}
                        </button>
                      </div>
                    </div>

                    <textarea 
                      placeholder="Add operational details (optional)..."
                      className="h-28 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm font-medium transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    {voiceStatus && (
                      <p className="mt-3 text-xs font-semibold text-blue-600">{voiceStatus}</p>
                    )}
                  </div>
               </div>

               <div className="flex flex-col justify-center space-y-4">
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100/50 mb-2">
                    <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4"/> Live GPS Tracking Active
                    </h3>
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                      Submitting an alert will strictly use your current location to dispatch aid immediately. Do not move from the incident spot if possible.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleReport('normal')}
                        disabled={loading}
                        className="group relative overflow-hidden h-24 bg-white border-2 border-blue-500 text-blue-700 hover:bg-blue-50 focus:bg-blue-100 font-extrabold text-lg rounded-2xl transition-all disabled:opacity-50 shadow-sm"
                      >
                        <span className="relative z-10 flex flex-col items-center justify-center gap-1">
                          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                              <>
                                <span>NORMAL</span>
                                <span className="text-xs text-blue-500 font-bold">ASSIST</span>
                              </>
                          )}
                        </span>
                      </motion.button>

                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleReport('emergency')}
                        disabled={loading}
                        className="group relative overflow-hidden h-24 border-2 border-transparent bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-lg rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-red-500/30"
                      >
                        <span className="relative z-10 flex flex-col items-center justify-center gap-1">
                          {loading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : (
                              <>
                                <span>CRITICAL</span>
                                <span className="text-[10px] text-red-100 font-black tracking-wider bg-black/10 px-2 py-0.5 rounded uppercase">Emergency</span>
                              </>
                          )}
                        </span>
                        {!loading && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </motion.button>
                  </div>
               </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.section 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              className="glass-panel-light p-6 rounded-[2rem] shadow-soft border border-white"
            >
              <h2 className="text-lg font-bold mb-4 text-slate-800 flex items-center justify-between">
                  Report History
                  <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">{reportHistory.length} Total</span>
              </h2>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {reportHistory.length === 0 && (
                  <p className="text-sm text-slate-400 font-medium p-4 text-center bg-slate-50 rounded-xl">No reports submitted yet.</p>
                )}
                {reportHistory.map((report) => (
                  <div key={report._id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${report.aidType === 'emergency' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                        {report.aidType}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{report.description || 'No operational description.'}</p>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-100">
                          {report.status}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 max-w-[120px] truncate">
                            {report.assignedHospital?.name || report.selectedHospital?.name || 'Awaiting assignment'}
                        </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
              className="glass-panel-light p-6 rounded-[2rem] shadow-soft border border-white flex flex-col"
            >
              <h2 className="text-lg font-bold mb-4 text-slate-800 flex items-center justify-between">
                  Reward Ledger
              </h2>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {rewardHistory.length === 0 && (
                  <p className="text-sm text-slate-400 font-medium p-4 text-center bg-slate-50 rounded-xl">No rewards earned yet.</p>
                )}
                {rewardHistory
                  .slice()
                  .reverse()
                  .map((reward, index) => (
                    <div key={`${reward.createdAt}-${index}`} className="rounded-xl border border-emerald-100/50 bg-emerald-50/30 p-3 flex items-center justify-between hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <Award className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{reward.reason || 'Reward granted'}</p>
                            <p className="text-[10px] font-semibold text-slate-400">{reward.createdAt ? new Date(reward.createdAt).toLocaleDateString() : ''}</p>
                          </div>
                      </div>
                      <span className="font-extrabold text-emerald-600 tabular-nums">
                        +{reward.points || 0}
                      </span>
                    </div>
                  ))}
              </div>
            </motion.section>
        </div>
      </div>
    </div>
  )
}
