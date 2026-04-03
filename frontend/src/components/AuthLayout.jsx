import React from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartPulse, ArrowLeft } from 'lucide-react'

export default function AuthLayout({ children, title, subtitle, imageNode, bgClass = 'animated-bg' }) {
  return (
    <div className={`min-h-screen w-full flex ${bgClass} relative overflow-hidden`}>
      {/* Background glowing orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-black/10 blur-[100px] pointer-events-none" />

      <div className="container mx-auto flex w-full max-w-7xl relative z-10 p-4 md:p-8">
        
        {/* Left Side: The Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="glass-panel p-8 md:p-10 rounded-3xl relative">
              <Link to="/" className="absolute top-8 left-8 text-gray-500 hover:text-gray-900 transition-colors bg-white/50 p-2 rounded-full backdrop-blur-sm shadow-sm group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
              
              <div className="text-center mb-8 mt-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4 text-blue-600">
                  <HeartPulse className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
                <p className="text-gray-500 font-medium mt-2">{subtitle}</p>
              </div>

              {children}
            </div>
          </motion.div>
        </div>

        {/* Right Side: Visual/Graphics */}
        <div className="hidden lg:flex w-1/2 items-center justify-center p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={title}
              initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: -15 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full h-full max-h-[700px] glass-panel-dark rounded-[2.5rem] relative overflow-hidden flex flex-col items-center justify-center text-white text-center p-12 border-white/20"
            >
              {/* Internal glowing decoration */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
              
              <div className="z-10 bg-white/10 p-8 rounded-full backdrop-blur-xl border border-white/20 mb-8 shadow-2xl">
                {imageNode}
              </div>
              
              <h3 className="z-10 text-3xl font-bold mb-4 drop-shadow-md">Faster Response, Saved Lives</h3>
              <p className="z-10 text-white/80 font-medium text-lg leading-relaxed max-w-md">
                Join our robust network dedicated to bridging the critical gap between emergencies and medical care.
              </p>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
