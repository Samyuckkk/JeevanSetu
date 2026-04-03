import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeartPulse, Ambulance, Building2, User } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
}

export default function Home() {
  return (
    <div className="min-h-screen animated-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative backdrop shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#3b82f6]/20 blur-3xl pointer-events-none" />

      <motion.div 
        className="z-10 text-center mb-16"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <HeartPulse className="text-white w-14 h-14" />
          <h1 className="text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
            JeevanSetu
          </h1>
        </div>
        <p className="text-white/90 text-xl font-medium max-w-lg mx-auto leading-relaxed">
          The ultimate platform connecting citizens, ambulances, and hospitals for rapid emergency response.
        </p>
      </motion.div>

      <motion.div 
        className="z-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <RoleCard 
          icon={User}
          title="Citizen"
          description="Request emergency assistance and track ambulances in real-time."
          path="/citizen/login"
          color="blue"
        />
        <RoleCard 
          icon={Ambulance}
          title="Ambulance"
          description="Receive critical alerts and navigate to emergencies efficiently."
          path="/ambulance/login"
          color="rose"
        />
        <RoleCard 
          icon={Building2}
          title="Hospital"
          description="Manage inventory, incoming emergencies, and bed availability."
          path="/hospital/login"
          color="emerald"
        />
      </motion.div>
    </div>
  )
}

function RoleCard({ icon: Icon, title, description, path, color }) {
  const colorMap = {
    blue: "from-blue-500 to-blue-600 text-blue-500 hover:shadow-blue-500/25",
    rose: "from-rose-500 to-rose-600 text-rose-500 hover:shadow-rose-500/25",
    emerald: "from-emerald-500 to-emerald-600 text-emerald-500 hover:shadow-emerald-500/25"
  }

  const borderMap = {
    blue: "group-hover:border-blue-400/50",
    rose: "group-hover:border-rose-400/50",
    emerald: "group-hover:border-emerald-400/50"
  }

  return (
    <motion.div variants={itemVariants}>
      <Link to={path} className="block group">
        <div className={`glass-panel rounded-2xl p-8 h-full transition-all duration-300 transform group-hover:-translate-y-2 group-hover:bg-white/80 hover:shadow-2xl ${borderMap[color]}`}>
          <div className={`w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm`}>
            <Icon className={`w-8 h-8 ${colorMap[color].split(' ')[2]}`} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-600 leading-relaxed font-medium mb-8">
            {description}
          </p>
          <div className="flex items-center text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            Get Started 
            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
