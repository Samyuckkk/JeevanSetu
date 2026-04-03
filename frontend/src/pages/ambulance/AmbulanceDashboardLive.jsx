import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import {
  Activity,
  AlertTriangle,
  Ambulance,
  CheckCircle2,
  ChevronRight,
  HeartPulse,
  MapPin,
  Navigation,
  Radio,
  Route,
  Stethoscope,
} from 'lucide-react'
import { DirectionsRenderer, GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api'

const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '1rem' }

const initialVitals = {
  heartRate: 86,
  systolicBP: 122,
  diastolicBP: 81,
  spo2: 98,
  temperature: 98.6,
  symptoms: '',
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function buildRandomVitals(currentVitals, severityLevel) {
  const trend = severityLevel === 'critical' ? -1 : severityLevel === 'watch' ? 0 : 1

  return {
    ...currentVitals,
    heartRate: clamp(Number(currentVitals.heartRate) + Math.round((Math.random() - (trend > 0 ? 0.5 : trend < 0 ? 0.3 : 0.45)) * 6), 48, 145),
    systolicBP: clamp(Number(currentVitals.systolicBP) + Math.round((Math.random() - (trend > 0 ? 0.5 : trend < 0 ? 0.3 : 0.45)) * 6), 86, 140),
    diastolicBP: clamp(Number(currentVitals.diastolicBP) + Math.round((Math.random() - (trend > 0 ? 0.5 : trend < 0 ? 0.3 : 0.45)) * 4), 56, 95),
    spo2: clamp(Number(currentVitals.spo2) + Math.round((Math.random() - (trend > 0 ? 0.5 : trend < 0 ? 0.3 : 0.45)) * 2), 90, 100),
    temperature: Number(clamp(Number(currentVitals.temperature) + (Math.random() - 0.48) * 0.2, 97.4, 101.5).toFixed(1)),
  }
}

function normalizeHospital(hospital, fallbackOptions = []) {
  if (!hospital) return null
  if (hospital.hospitalId) return hospital

  const matchedOption = fallbackOptions.find(
    (option) => option.hospitalId === hospital._id || option.hospitalId === hospital.id,
  )

  return {
    hospitalId: hospital._id || hospital.id,
    name: hospital.name,
    status: hospital.status,
    location: hospital.location,
    availableResources: hospital.inventory || matchedOption?.availableResources,
    distanceKm: matchedOption?.distanceKm,
    capabilityScore: matchedOption?.capabilityScore,
    matchesAllRequirements: matchedOption?.matchesAllRequirements,
    isBestMatch: matchedOption?.isBestMatch,
  }
}

export default function AmbulanceDashboardLive() {
  const { user, API_URL, logout } = useAuth()
  const [incidents, setIncidents] = useState([])
  const [activeIncident, setActiveIncident] = useState(null)
  const [vitals, setVitals] = useState(initialVitals)
  const [hospitalOptions, setHospitalOptions] = useState([])
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [bestHospital, setBestHospital] = useState(null)
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [routeAlert, setRouteAlert] = useState('')
  const [activeRoute, setActiveRoute] = useState(null)
  const [recentIncidents, setRecentIncidents] = useState([])
  const [ambulanceLocation, setAmbulanceLocation] = useState(user?.location || null)
  const [mapError, setMapError] = useState('')
  const vitalsRef = useRef(initialVitals)
  const activeIncidentRef = useRef(null)
  const ambulanceLocationRef = useRef(user?.location || null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCR7LdvZDlkYsjANjULsrQXn7iOw46oH1Q',
  })

  const mapOrigin = useMemo(
    () => activeIncident?.ambulanceLocation || ambulanceLocation || activeIncident?.location || { lat: 18.5204, lng: 73.8567 },
    [activeIncident, ambulanceLocation],
  )

  if (!user || user.role !== 'ambulance') return <Navigate to="/ambulance/login" />

  useEffect(() => {
    activeIncidentRef.current = activeIncident
  }, [activeIncident])

  useEffect(() => {
    vitalsRef.current = vitals
  }, [vitals])

  useEffect(() => {
    ambulanceLocationRef.current = ambulanceLocation
  }, [ambulanceLocation])

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [pendingRes, activeRes] = await Promise.all([
          axios.get(`${API_URL}/ambulance/incidents/pending`),
          axios.get(`${API_URL}/ambulance/incidents/active`),
        ])

        setIncidents(pendingRes.data.incidents || [])
        setRecentIncidents(activeRes.data.recentIncidents || [])

        if (activeRes.data.incident) {
          const currentIncident = activeRes.data.incident
          setActiveIncident(currentIncident)
          setVitals(currentIncident.vitals || initialVitals)
          setHospitalOptions(currentIncident.hospitalOptions || [])
          const normalizedAssignedHospital = normalizeHospital(
            currentIncident.assignedHospital || currentIncident.selectedHospital,
            currentIncident.hospitalOptions || [],
          )
          setSelectedHospital(normalizedAssignedHospital)
          setBestHospital((currentIncident.hospitalOptions || []).find((option) => option.isBestMatch) || normalizedAssignedHospital)
        }
      } catch (error) {
        console.error('Failed to load ambulance dashboard state', error)
      }
    }

    hydrate()
  }, [API_URL])

  useEffect(() => {
    if (!navigator.geolocation) return undefined

    const syncLocation = async (position) => {
      const location = {
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6)),
      }

      setAmbulanceLocation(location)

      try {
        await axios.post(`${API_URL}/ambulance/location`, {
          lat: location.lat,
          lng: location.lng,
          incidentId: activeIncidentRef.current?._id,
        })
      } catch (error) {
        console.error('Live location sync failed', error)
      }
    }

    navigator.geolocation.getCurrentPosition(syncLocation, () => {}, {
      enableHighAccuracy: true,
      timeout: 10000,
    })

    const watchId = navigator.geolocation.watchPosition(syncLocation, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000,
    })

    return () => navigator.geolocation.clearWatch(watchId)
  }, [API_URL])

  useEffect(() => {
    const socket = io('http://localhost:3000', { withCredentials: true })

    socket.emit('join', 'ambulance')
    socket.emit('join', `ambulance_${user.id}`)

    socket.on('incoming_incident', (incident) => {
      setIncidents((prev) => [incident, ...prev.filter((item) => item._id !== incident._id)])
    })

    socket.on('incident_taken', ({ incidentId }) => {
      setIncidents((prev) => prev.filter((incident) => incident._id !== incidentId))
    })

    socket.on('ambulance_case_update', ({ incident, rerouted, reason }) => {
      setActiveIncident(incident)
      setHospitalOptions(incident.hospitalOptions || [])
      setRecentIncidents((prev) => [
        incident,
        ...prev.filter((item) => item._id !== incident._id),
      ].slice(0, 10))
      const normalizedAssignedHospital = normalizeHospital(
        incident.assignedHospital || incident.selectedHospital,
        incident.hospitalOptions || [],
      )
      setSelectedHospital(normalizedAssignedHospital)
      setBestHospital((incident.hospitalOptions || []).find((option) => option.isBestMatch) || normalizedAssignedHospital)
      if (incident.vitals) {
        setVitals(incident.vitals)
      }
      if (rerouted && reason) {
        setRouteAlert(reason)
      }
    })

    return () => socket.disconnect()
  }, [user.id])

  useEffect(() => {
    if (!selectedHospital?.location) {
      setActiveRoute(null)
      setMapError('')
      return
    }

    if (!isLoaded || !window.google) return

    setMapError('')

    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(
      {
        origin: new window.google.maps.LatLng(mapOrigin.lat, mapOrigin.lng),
        destination: new window.google.maps.LatLng(
          selectedHospital.location.lat,
          selectedHospital.location.lng,
        ),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setActiveRoute(result)
          setMapError('')
        } else {
          setActiveRoute(null)
          setMapError(`Route unavailable: ${status}`)
        }
      },
    )
  }, [isLoaded, mapOrigin, selectedHospital])

  useEffect(() => {
    if (!activeIncident?._id || !selectedHospital?.hospitalId) {
      setStreaming(false)
      return undefined
    }

    setStreaming(true)

    const intervalId = window.setInterval(async () => {
      const nextVitals = buildRandomVitals(vitalsRef.current, activeIncidentRef.current?.severityLevel)
      setVitals(nextVitals)

      try {
        const response = await axios.post(`${API_URL}/ambulance/stream-vitals`, {
          incidentId: activeIncidentRef.current._id,
          vitals: nextVitals,
          ambulanceLocation: ambulanceLocationRef.current || mapOrigin,
        })

        setActiveIncident(response.data.incident)
        const nextSelectedHospital = normalizeHospital(
          response.data.selectedHospital || response.data.incident.assignedHospital,
          response.data.incident.hospitalOptions || [],
        )
        setSelectedHospital(nextSelectedHospital)
        if (response.data.rerouted && response.data.reason) {
          setRouteAlert(response.data.reason)
        }
      } catch (error) {
        console.error('Vitals streaming failed', error)
      }
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [API_URL, activeIncident?._id, mapOrigin, selectedHospital?.hospitalId])

  const handleAccept = async (incident) => {
    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/ambulance/accept-incident`, {
        incidentId: incident._id,
      })
      setActiveIncident(response.data.incident)
      setIncidents((prev) => prev.filter((item) => item._id !== incident._id))
      setRouteAlert('')
    } catch (error) {
      alert('Failed to accept the request. Another ambulance may have taken it.')
    } finally {
      setLoading(false)
    }
  }

  const handleVitalsSubmit = async (event) => {
    event.preventDefault()

    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/ambulance/predict-allocation`, {
        incidentId: activeIncident._id,
        vitals: {
          ...vitals,
          heartRate: Number(vitals.heartRate),
          systolicBP: Number(vitals.systolicBP),
          diastolicBP: Number(vitals.diastolicBP),
          spo2: Number(vitals.spo2),
          temperature: Number(vitals.temperature),
        },
      })

      setActiveIncident(response.data.incident)
      setHospitalOptions(response.data.availableHospitals || [])
      setBestHospital(response.data.bestHospital || null)
      setSelectedHospital(response.data.bestHospital || null)
      setRouteAlert('')
    } catch (error) {
      alert('Failed to rank hospitals for this patient.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectHospital = async (hospitalId) => {
    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/ambulance/select-hospital`, {
        incidentId: activeIncident._id,
        hospitalId,
      })
      setActiveIncident(response.data.incident)
      setSelectedHospital(response.data.selectedHospital)
      setRouteAlert('')
    } catch (error) {
      alert('Failed to switch hospital destination.')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkArrival = async () => {
    try {
      setLoading(true)
      await axios.post(`${API_URL}/ambulance/mark-arrival`, {
        incidentId: activeIncident._id,
      })
      setRouteAlert('Patient marked as arrived. Hospital dashboard now has the full inbound handoff.')
    } catch (error) {
      alert('Failed to mark arrival.')
    } finally {
      setLoading(false)
    }
  }

  const resetMission = () => {
    setActiveIncident(null)
    setVitals(initialVitals)
    setHospitalOptions([])
    setBestHospital(null)
    setSelectedHospital(null)
    setRouteAlert('')
    setStreaming(false)
  }

  return (
    <div className="min-h-screen bg-rose-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-100 p-3">
              <Ambulance className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Unit {user.vehicleNumber}</h1>
              <p className="text-sm font-medium text-gray-500">Dispatch, triage, routing and live hospital handoff</p>
            </div>
          </div>
          <button onClick={logout} className="rounded-xl bg-rose-100 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-200">
            End Shift
          </button>
        </header>

        {!activeIncident && (
          <section className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-500" />
              <h2 className="text-xl font-bold text-gray-900">Dispatch Radar</h2>
            </div>

            {incidents.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200">
                <div className="mb-4 h-4 w-4 animate-ping rounded-full bg-rose-400" />
                <p className="font-medium text-gray-500">No pending requests right now. The board will update live.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident._id} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 lg:flex-row lg:items-center">
                    <img src={incident.image} alt="Incident" className="h-28 w-full rounded-xl object-cover lg:w-40" />
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${incident.aidType === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {incident.aidType}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-500">
                          {incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString() : 'Live'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">{incident.description || 'No description provided.'}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {incident.location?.lat?.toFixed?.(4)}, {incident.location?.lng?.toFixed?.(4)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAccept(incident)}
                      disabled={loading}
                      className="rounded-xl bg-gray-900 px-6 py-3 font-bold text-white transition hover:bg-black"
                    >
                      Accept Request
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeIncident && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-6 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-bold uppercase tracking-wide">Active Case</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Incident accepted and ready for routing</h2>
                </div>
                <div className={`rounded-full px-4 py-2 text-sm font-bold ${activeIncident.severityLevel === 'critical' ? 'bg-red-100 text-red-700' : activeIncident.severityLevel === 'watch' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  Severity: {activeIncident.severityLevel || 'stable'}
                </div>
              </div>

              {routeAlert && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm font-semibold">{routeAlert}</p>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <img src={activeIncident.image} alt="Incident reference" className="mb-4 h-48 w-full rounded-xl object-cover" />
                  <p className="text-sm font-medium text-gray-700">{activeIncident.description || 'No extra incident description shared.'}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    Pickup at {activeIncident.location?.lat}, {activeIncident.location?.lng}
                  </div>
                </div>

                {!selectedHospital ? (
                  <form onSubmit={handleVitalsSubmit} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                      <Stethoscope className="h-5 w-5 text-rose-500" />
                      Initial Vitals and Symptoms
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="text-xs font-bold text-gray-500">
                        Heart Rate
                        <input type="number" className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900" value={vitals.heartRate} onChange={(event) => setVitals({ ...vitals, heartRate: event.target.value })} />
                      </label>
                      <label className="text-xs font-bold text-gray-500">
                        SpO2
                        <input type="number" className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900" value={vitals.spo2} onChange={(event) => setVitals({ ...vitals, spo2: event.target.value })} />
                      </label>
                      <label className="text-xs font-bold text-gray-500">
                        Systolic BP
                        <input type="number" className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900" value={vitals.systolicBP} onChange={(event) => setVitals({ ...vitals, systolicBP: event.target.value })} />
                      </label>
                      <label className="text-xs font-bold text-gray-500">
                        Diastolic BP
                        <input type="number" className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900" value={vitals.diastolicBP} onChange={(event) => setVitals({ ...vitals, diastolicBP: event.target.value })} />
                      </label>
                    </div>

                    <label className="mt-4 block text-xs font-bold text-gray-500">
                      Symptoms
                      <textarea className="mt-1 h-28 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900" value={vitals.symptoms} onChange={(event) => setVitals({ ...vitals, symptoms: event.target.value })} placeholder="chest pain, trauma, bleeding, stroke symptoms..." />
                    </label>

                    <button disabled={loading} type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 font-bold text-white transition hover:bg-rose-700">
                      Rank Hospitals <ChevronRight className="h-5 w-5" />
                    </button>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <div className="mb-3 flex items-center gap-2 text-emerald-700">
                      <Radio className="h-5 w-5" />
                      <span className="text-sm font-bold uppercase tracking-wide">Live streaming active</span>
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-900">{selectedHospital.name}</h3>
                    <p className="mt-1 flex items-center gap-2 text-sm font-medium text-emerald-700">
                      <MapPin className="h-4 w-4" />
                      {selectedHospital.location?.lat}, {selectedHospital.location?.lng}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white p-3 text-center">
                        <p className="text-[11px] font-bold uppercase text-gray-500">Heart Rate</p>
                        <p className="text-xl font-black text-gray-900">{Math.round(vitals.heartRate)}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 text-center">
                        <p className="text-[11px] font-bold uppercase text-gray-500">SpO2</p>
                        <p className={`text-xl font-black ${Number(vitals.spo2) < 92 ? 'text-red-600' : 'text-gray-900'}`}>{Math.round(vitals.spo2)}%</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 text-center">
                        <p className="text-[11px] font-bold uppercase text-gray-500">Blood Pressure</p>
                        <p className="text-xl font-black text-gray-900">{Math.round(vitals.systolicBP)}/{Math.round(vitals.diastolicBP)}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 text-center">
                        <p className="text-[11px] font-bold uppercase text-gray-500">Temp</p>
                        <p className="text-xl font-black text-gray-900">{Number(vitals.temperature).toFixed(1)}F</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-white p-4">
                      <p className="mb-1 text-xs font-bold uppercase text-gray-500">Hospital requirement summary</p>
                      <p className="text-sm font-semibold text-gray-700">
                        Specialists: {activeIncident.mlPrediction?.specialists_Needed?.join(', ') || 'general'}
                      </p>
                      <p className="text-sm font-semibold text-gray-700">
                        Beds: ICU {activeIncident.mlPrediction?.icuBeds_Required || 0}, Vent {activeIncident.mlPrediction?.ventilators_Required || 0}, General {activeIncident.mlPrediction?.generalBeds_Required || 0}
                      </p>
                      <p className="mt-2 text-sm text-gray-600">Symptoms: {vitals.symptoms || 'Not recorded'}</p>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button onClick={handleMarkArrival} disabled={loading} className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white transition hover:bg-emerald-800">
                        Mark Arrival
                      </button>
                      <button onClick={resetMission} className="flex-1 rounded-xl bg-white px-4 py-3 font-bold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100">
                        Clear Mission
                      </button>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-emerald-700">
                      Demo stream: {streaming ? 'Live vitals are updating every 3 seconds.' : 'Waiting for live vitals.'}
                    </p>
                  </div>
                )}
              </div>

              {hospitalOptions.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-rose-500" />
                    <h3 className="text-lg font-bold text-gray-900">Hospital ranking</h3>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {hospitalOptions.map((hospital) => (
                      <div key={hospital.hospitalId} className={`rounded-2xl border p-4 ${selectedHospital?.hospitalId === hospital.hospitalId ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">{hospital.name}</h4>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{hospital.distanceKm} km away</p>
                          </div>
                          {hospital.isBestMatch && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Best match</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          ICU {hospital.availableResources?.icuBeds || 0} | Vent {hospital.availableResources?.ventilators || 0} | General {hospital.availableResources?.generalBeds || 0}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          Specialists: {hospital.availableResources?.specialists?.join(', ') || 'general'}
                        </p>
                        <button
                          onClick={() => handleSelectHospital(hospital.hospitalId)}
                          disabled={loading}
                          className={`mt-4 w-full rounded-xl px-4 py-3 font-bold transition ${selectedHospital?.hospitalId === hospital.hospitalId ? 'bg-emerald-700 text-white' : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-100'}`}
                        >
                          {selectedHospital?.hospitalId === hospital.hospitalId ? 'Chosen Hospital' : 'Choose Hospital'}
                        </button>
                      </div>
                    ))}
                  </div>
                  {bestHospital && (
                    <p className="mt-3 text-sm font-semibold text-gray-600">
                      Best match currently: <span className="text-emerald-700">{bestHospital.name}</span>. All hospitals are ranked from registered account inventory.
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Route className="h-5 w-5 text-blue-500" />
                  <h2 className="text-xl font-bold text-gray-900">Live Route</h2>
                </div>
                <div className="h-[420px] overflow-hidden rounded-2xl bg-gray-100">
                  {loadError && (
                    <div className="flex h-full items-center justify-center p-6 text-center text-sm font-semibold text-red-600">
                      Failed to load Google Maps.
                    </div>
                  )}
                  {!loadError && !isLoaded && (
                    <div className="flex h-full items-center justify-center p-6 text-center text-sm font-semibold text-gray-500">
                      Loading live map...
                    </div>
                  )}
                  {isLoaded && (
                    <GoogleMap mapContainerStyle={mapContainerStyle} center={mapOrigin} zoom={12} options={{ disableDefaultUI: true }}>
                      <Marker position={mapOrigin} label="A" />
                      {selectedHospital?.location && <Marker position={selectedHospital.location} label="H" />}
                      {activeRoute && (
                        <DirectionsRenderer
                          directions={activeRoute}
                          options={{ polylineOptions: { strokeColor: '#dc2626', strokeWeight: 5 } }}
                        />
                      )}
                      {!activeRoute && selectedHospital?.location && (
                        <Polyline
                          path={[mapOrigin, selectedHospital.location]}
                          options={{ strokeColor: '#dc2626', strokeWeight: 4, strokeOpacity: 0.85 }}
                        />
                      )}
                    </GoogleMap>
                  )}
                </div>
                <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm font-bold text-gray-800">Current destination</p>
                  <p className="mt-1 text-sm text-gray-600">{selectedHospital ? `${selectedHospital.name} (${selectedHospital.status})` : 'No hospital selected yet'}</p>
                  {mapError && <p className="mt-2 text-xs font-semibold text-amber-700">{mapError}</p>}
                  <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <Navigation className="h-3.5 w-3.5" />
                    Route auto-updates when critical vitals trigger a reroute.
                  </p>
                </div>
              </div>

              {recentIncidents.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-bold text-gray-900">Mission log</h3>
                  </div>
                  <div className="space-y-3">
                    {recentIncidents.map((incident) => (
                      <div key={incident._id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-600">
                            {incident.status}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-600">
                            {incident.transportStatus}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-600">
                            {incident.arrivalStatus}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-gray-800">
                          {incident.description || 'No incident description'}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          Destination: {incident.assignedHospital?.name || incident.selectedHospital?.name || 'Not chosen'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
