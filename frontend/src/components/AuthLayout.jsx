import React from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartPulse, ArrowLeft } from 'lucide-react'

export default function AuthLayout({ children, title, subtitle, imageNode, bgClass = 'animated-bg' }) {
  return (
    <div className={`min-h-screen w-full flex ${bgClass} relative overflow-hidden`}>
      <div className="container mx-auto flex w-full max-w-7xl relative z-10 p-4 md:p-8">

        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.8, 0.25, 1] }}
            className="w-full max-w-md"
          >
            <div className="glass-panel p-8 md:p-10 rounded-[2rem] relative">
              <Link to="/" className="absolute top-8 left-8 text-slate-400 hover:text-slate-800 transition-colors bg-slate-50/50 p-2 rounded-xl backdrop-blur-sm shadow-sm group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
              
              <div className="text-center mb-10 mt-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.25rem] bg-white shadow-sm border border-slate-100 mb-6 text-emerald-600">
                  <HeartPulse className="w-8 h-8" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{title}</h2>
                <p className="text-slate-500 font-medium mt-3 leading-relaxed">{subtitle}</p>
              </div>

              {children}
            </div>
          </motion.div>
        </div>

        <div className="hidden lg:flex w-1/2 items-center justify-center p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: [0.25, 0.8, 0.25, 1] }}
              className="flex flex-col items-center justify-center text-white text-center p-12"
            >
              <div className="mb-10">
                {imageNode}
              </div>

              <h3 className="text-3xl font-bold mb-4 tracking-tight text-white/90">Precision & Care</h3>
              <p className="text-white/60 font-medium text-lg leading-relaxed max-w-md">
                Securely access the platform. Maintain operational readiness and track critical data instantly.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
