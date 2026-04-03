import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Ambulance, Lock, Hash, ShieldAlert } from 'lucide-react'
import AuthLayout from '../../components/AuthLayout'

export default function AmbulanceAuth({ mode }) {
  const isLogin = mode === 'login'
  const [formData, setFormData] = useState({ vehicleNumber: '', password: '', type: 'normal' })

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Ambulance Submit:', mode, formData)
    // Add real API call here
  }

  return (
    <AuthLayout 
      title={`Ambulance ${isLogin ? 'Login' : 'Registration'}`}
      subtitle={isLogin ? 'On standby for emergencies.' : 'Enroll your fleet to save lives.'}
      imageNode={<Ambulance className="w-16 h-16 text-white" />}
      bgClass="animated-bg-ambulance"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Hash className="w-5 h-5" />
          </div>
          <input
            type="text"
            name="vehicleNumber"
            placeholder="Vehicle Number (e.g. MH-12-AB-1234)"
            className="input-glass w-full py-3 pl-10 pr-4 rounded-xl text-gray-900 placeholder-gray-500 font-medium uppercase"
            value={formData.vehicleNumber}
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
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <select
                  name="type"
                  className="input-glass w-full py-3 pl-10 pr-4 rounded-xl text-gray-900 font-medium appearance-none cursor-pointer"
                  value={formData.type}
                  onChange={handleChange}
                  required={!isLogin}
                >
                  <option value="normal">Normal (Basic Life Support)</option>
                  <option value="emergency">Emergency (Advanced Life Support/ICU)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-rose-600/30 transition-all mt-4"
        >
          {isLogin ? 'Sign In' : 'Register Vehicle'}
        </motion.button>
      </form>

      <div className="mt-8 text-center text-sm font-medium text-gray-600">
        {isLogin ? "Not registered yet? " : "Already serving? "}
        <Link 
          to={isLogin ? "/ambulance/register" : "/ambulance/login"} 
          className="text-rose-600 hover:text-rose-800 font-bold hover:underline"
        >
          {isLogin ? 'Register now' : 'Login instead'}
        </Link>
      </div>
    </AuthLayout>
  )
}
