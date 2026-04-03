import React, { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default marker icons broken by webpack/vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeLabel(letter, color) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:#fff;font-weight:bold;font-size:13px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${letter}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

export default function LeafletMap({ origin, destination, strokeColor = '#dc2626', originLabel = 'A', destLabel = 'H', height = '420px' }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const routeLayerRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!containerRef.current) return
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, { zoomControl: true }).setView(
        origin ? [origin.lat, origin.lng] : [18.5204, 73.8567],
        13,
      )
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current)
    }
    return () => {}
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    // Clear old route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove()
      routeLayerRef.current = null
    }

    if (!origin) return

    const originMarker = L.marker([origin.lat, origin.lng], { icon: makeLabel(originLabel, '#dc2626') }).addTo(map)
    markersRef.current.push(originMarker)

    if (!destination) {
      map.setView([origin.lat, origin.lng], 13)
      return
    }

    const destMarker = L.marker([destination.lat, destination.lng], { icon: makeLabel(destLabel, '#059669') }).addTo(map)
    markersRef.current.push(destMarker)

    // Fetch route from OSRM (free, no key needed)
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.code !== 'Ok' || !data.routes?.[0]) return
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
        routeLayerRef.current = L.polyline(coords, { color: strokeColor, weight: 5, opacity: 0.85 }).addTo(map)
        const bounds = L.latLngBounds([
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ])
        map.fitBounds(bounds, { padding: [40, 40] })
      })
      .catch(() => {
        // fallback: just draw straight line
        routeLayerRef.current = L.polyline(
          [[origin.lat, origin.lng], [destination.lat, destination.lng]],
          { color: strokeColor, weight: 4, dashArray: '8 6', opacity: 0.7 },
        ).addTo(map)
        map.fitBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]], { padding: [40, 40] })
      })
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, strokeColor])

  // Invalidate size when container becomes visible
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 200)
    return () => clearTimeout(t)
  })

  return <div ref={containerRef} style={{ width: '100%', height, borderRadius: '1rem' }} />
}
