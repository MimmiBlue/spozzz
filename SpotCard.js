import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useToast } from '../App'
import { likes, saves, follows } from '../lib/supabase'
import { useGeolocation, distanceKm, formatDist } from '../lib/useGeolocation'

const CAT_EMOJI = { Cafe:'☕', Restaurant:'🍝', Bar:'🍸', Beach:'🏖', Natur:'🌿', Stay:'🏔', Culture:'🎭', 'Local Eating':'🍜', Walk:'🚶', Sports:'⚽', Nature:'🌿' }

export default function SpotCard({ spot, onUpdate }) {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const showToast = useToast()
  const geo       = useGeolocation()

  const [liked,     setLiked]     = useState(spot.user_liked  || false)
  const [saved,     setSaved]     = useState(spot.user_saved  || false)
  const [likeCount, setLikeCount] = useState(spot.like_count  || 0)
  const [saveCount, setSaveCount] = useState(spot.save_count  || 0)
  const [following, setFollowing] = useState(spot.author_followed || false)
  const [hovered,   setHovered]   = useState(false)

  // ✅ Compute real distance from user's location
  const distLabel = (() => {
    if (!geo.lat || !spot.lat || !spot.lng) return null
    const km = distanceKm(geo.lat, geo.lng, spot.lat, spot.lng)
    return formatDist(km)
  })()

  const locStr = [spot.country, spot.city, spot.name].filter(Boolean).join(' | ')

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!user) return
    const newVal = !liked
    setLiked(newVal)
    setLikeCount(c => newVal ? c + 1 : Math.max(0, c - 1))
    await likes.toggle(user.id, spot.id)
  }

  const handleSave = async (e) => {
    e.stopPropagation()
    if (!user) return
    const newVal = !saved
    setSaved(newVal)
    setSaveCount(c => newVal ? c + 1 : Math.max(0, c - 1))
    await saves.toggle(user.id, spot.id)
    showToast(newVal ? 'Gespeichert ✓' : 'Aus Saved entfernt')
    if (onUpdate) onUpdate()
  }

  const handleFollow = async (e) => {
    e.stopPropagation()
    if (!user || spot.author_id === user.id) return
    const newVal = !following
    setFollowing(newVal)
    await follows.toggle(user.id, spot.author_id)
    showToast(newVal ? `Du folgst jetzt @${spot.profiles?.username}` : 'Entfolgt')
  }

  const isOwn = user?.id === spot.author_id

  return (
    <div className="vcard" onClick={() => navigate(`/spot/${spot.id}`)}>
      {/* Location header: Country | City | Name */}
      <div className="vcard-loc">{locStr}</div>

      {/* Photo or emoji */}
      <div className="vcard-img">
        {spot.photo_url
          ? <img src={spot.photo_url} alt={spot.name}/>
          : <span>{CAT_EMOJI[spot.category] || '📍'}</span>
        }
        <button className="vcard-menu" onClick={e => e.stopPropagation()}>⋮</button>
      </div>

      {/* Body: author + follow button */}
      <div className="vcard-body">
        <div className="vcard-author-row">
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <div
              className="vcard-who"
              style={{ cursor:'pointer' }}
              onClick={e => { e.stopPropagation(); if (spot.profiles?.id) navigate(`/user/${spot.profiles.id}`) }}
            >
              {spot.profiles?.username}'s {spot.category}
            </div>
            {/* ✅ Distance label */}
            {distLabel && (
              <div style={{ fontSize:11, color:'var(--ac)', fontWeight:500 }}>📍 {distLabel}</div>
            )}
          </div>
          {!isOwn && (
            <button
              className={`follow-btn ${hovered && following ? 'unfollow' : following ? 'following' : 'follow'}`}
              onClick={handleFollow}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              {following ? (hovered ? 'Unfollow' : 'Followed ✓') : '+ Follow'}
            </button>
          )}
        </div>
        {spot.description && <div className="vcard-desc">{spot.description}</div>}
      </div>

      {/* Actions: like + save with real counters */}
      <div className="vcard-acts" onClick={e => e.stopPropagation()}>
        <button className={`vcard-act ${liked ? 'lk' : ''}`} onClick={handleLike}>
          <svg viewBox="0 0 24 24"
            fill={liked ? '#e74c3c' : 'none'}
            stroke={liked ? 'none' : 'currentColor'}
            strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          {likeCount}
        </button>
        <button className={`vcard-act ${saved ? 'sv' : ''}`} onClick={handleSave}>
          <svg viewBox="0 0 24 24"
            fill={saved ? 'var(--ac)' : 'none'}
            stroke={saved ? 'none' : 'currentColor'}
            strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          {saveCount}
        </button>
      </div>

      {/* Recommended badge */}
      {spot.recommended && (
        <div className="vcard-rec">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Recommended</span>
        </div>
      )}
    </div>
  )
}
