import { useState, useEffect } from 'react'

// Returns { lat, lng, error, loading }
// Calculates distance in km from a given spot's coordinates
export function useGeolocation() {
  const [location, setLocation] = useState({ lat: null, lng: null, error: null, loading: true })

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: null, lng: null, error: 'Geolocation not supported', loading: false })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, error: null, loading: false }),
      (err) => setLocation({ lat: null, lng: null, error: err.message, loading: false }),
      { timeout: 8000, maximumAge: 300000 }
    )
  }, [])

  return location
}

// Haversine formula: distance between two lat/lng points in km
export function distanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null
  const R = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLng = deg2rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function deg2rad(deg) { return deg * (Math.PI / 180) }

// Format distance nicely: "0.3 km" or "350 m"
export function formatDist(km) {
  if (km == null) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}
