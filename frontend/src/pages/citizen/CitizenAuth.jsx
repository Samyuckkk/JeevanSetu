import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react'
import AuthLayout from '../../components/AuthLayout'
import { useAuth } from '../../context/AuthContext'

export default function CitizenAuth({ mode }) {
  const isLogin = mode === 'login'
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        await login('citizen', { email: formData.email, password: formData.password })
      } else {
        await register('citizen', formData)
      }
      navigate('/citizen/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout 
      title={`Citizen ${isLogin ? 'Login' : 'Registration'}`}
      subtitle={isLogin ? 'Welcome back, hero.' : 'Join the community network.'}
      imageNode={<UserIcon className="w-16 h-16 text-white" />}
      bgClass="animated-bg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">
            {error}
          </div>
        )}

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
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
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
            placeholder="Email Address"
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

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex justify-center items-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {isLogin ? 'Sign In' : 'Create Account'}
        </motion.button>
      </form>

      <div className="mt-8 text-center text-sm font-medium text-gray-600">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <Link 
          to={isLogin ? "/citizen/register" : "/citizen/login"} 
          className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
        >
          {isLogin ? 'Register now' : 'Login instead'}
        </Link>
      </div>
    </AuthLayout>
  )
}
