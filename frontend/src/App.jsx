import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import CitizenAuth from './pages/citizen/CitizenAuth'
import AmbulanceAuth from './pages/ambulance/AmbulanceAuth'
import HospitalAuth from './pages/hospital/HospitalAuth'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Citizen Routes */}
        <Route path="/citizen/login" element={<CitizenAuth mode="login" />} />
        <Route path="/citizen/register" element={<CitizenAuth mode="register" />} />
        
        {/* Ambulance Routes */}
        <Route path="/ambulance/login" element={<AmbulanceAuth mode="login" />} />
        <Route path="/ambulance/register" element={<AmbulanceAuth mode="register" />} />
        
        {/* Hospital Routes */}
        <Route path="/hospital/login" element={<HospitalAuth mode="login" />} />
        <Route path="/hospital/register" element={<HospitalAuth mode="register" />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
