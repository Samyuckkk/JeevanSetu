import React from 'react'
import { Ambulance, Building2, MapPin } from 'lucide-react'

export default function RouteFallback({
  ambulanceLocation,
  hospitalLocation,
  ambulanceLabel = 'Ambulance',
  hospitalLabel = 'Hospital',
  note = 'Live route fallback view',
}) {
  const hasAmbulance = Boolean(ambulanceLocation?.lat && ambulanceLocation?.lng)
  const hasHospital = Boolean(hospitalLocation?.lat && hospitalLocation?.lng)

  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-800">
            <Ambulance className="h-4 w-4 text-rose-600" />
            <p className="text-sm font-bold">{ambulanceLabel}</p>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {hasAmbulance ? `${ambulanceLocation.lat}, ${ambulanceLocation.lng}` : 'Location unavailable'}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-800">
            <Building2 className="h-4 w-4 text-emerald-700" />
            <p className="text-sm font-bold">{hospitalLabel}</p>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {hasHospital ? `${hospitalLocation.lat}, ${hospitalLocation.lng}` : 'Location unavailable'}
          </p>
        </div>
      </div>

      <div className="relative my-6 flex-1 overflow-hidden rounded-3xl border border-slate-100 bg-white/40">
        <div className="absolute left-[12%] top-[22%] z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-rose-500 shadow-lg">
          <Ambulance className="h-6 w-6 text-white" />
        </div>
        <div className="absolute right-[12%] top-[62%] z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-emerald-600 shadow-lg">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M20,28 C34,36 42,44 50,54 C58,63 66,70 80,76"
            fill="none"
            stroke="#0f766e"
            strokeWidth="4"
            strokeDasharray="8 6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-800">
          <MapPin className="h-4 w-4" />
          {note}
        </p>
        <p className="mt-2 text-sm font-medium text-amber-700">
          Google routing is unavailable right now, so this panel shows the live ambulance-to-hospital path using streamed coordinates.
        </p>
      </div>
    </div>
  )
}
