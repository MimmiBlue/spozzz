// DetailPage.js
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useToast } from '../App'
import { spots as spotsApi, likes, saves } from '../lib/supabase'

export default function DetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const [spot, setSpot]     = useState(null)
  const [liked, setLiked]   = useState(false)
  const [saved, setSaved]   = useState(false)
  const [lCount, setLCount] = useState(0)
  const [sCount, setSCount] = useState(0)

  useEffect(() => {
    spotsApi.getById(id).then(({ data }) => {
      if (data) {
        setSpot(data)
        setLiked(data.user_liked || false)
        setSaved(data.user_saved || false)
        setLCount(data.like_count || 0)
        setSCount(data.save_count || 0)
      }
    })
  }, [id])

  const handleLike = async () => {
    setLiked(l => !l); setLCount(c => liked ? c-1 : c+1)
    await likes.toggle(user.id, id)
  }
  const handleSave = async () => {
    setSaved(s => !s); setSCount(c => saved ? c-1 : c+1)
    await saves.toggle(user.id, id)
    showToast(!saved ? 'Gespeichert ✓' : 'Aus Saved entfernt')
  }

  const openMaps = () => {
    if (!spot) return
    const q = encodeURIComponent([spot.name, spot.city, spot.country].filter(Boolean).join(' '))
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank')
  }

  const catEmoji = { Cafe:'☕', Restaurant:'🍝', Bar:'🍸', Beach:'🏖', Natur:'🌿', Stay:'🏔', Culture:'🎭' }

  if (!spot) return <div className="empty-state" style={{height:'100vh'}}><span className="empty-state-ico">⏳</span>Wird geladen...</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <div style={{ flex:1, overflowY:'auto', paddingBottom:80 }}>
        {/* Hero */}
        <div className="det-hero">
          {spot.photo_url ? <img src={spot.photo_url} alt={spot.name}/> : catEmoji[spot.category] || '📍'}
          <button className="det-back" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="det-badge">{spot.category}</div>
        </div>

        {/* Body */}
        <div className="det-body">
          <div className="det-loc">{[spot.country, spot.city].filter(Boolean).join(' | ')} · {spot.distance || '–'}</div>
          <h2 className="det-name">{spot.name}</h2>
          {spot.description && <p className="det-txt">{spot.description}</p>}
          <div className="det-author">
            <div className="avatar" style={{ width:28, height:28, background:'var(--s2)', fontSize:11 }}>
              {spot.profiles?.avatar_url ? <img src={spot.profiles.avatar_url} alt=""/> : spot.profiles?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>@{spot.profiles?.username}</div>
              <div style={{ fontSize:11, color:'var(--i2)' }}>{spot.visibility === 'public' ? 'Öffentlich' : spot.visibility === 'friends' ? 'Freunde' : 'Privat'}</div>
            </div>
          </div>
        </div>

        {/* Static map */}
        <div className="smap" onClick={openMaps}>
          <svg width="100%" height="100%" viewBox="0 0 341 130" preserveAspectRatio="xMidYMid slice">
            <rect width="341" height="130" fill="#E8E2D6"/>
            <rect x="0" y="50" width="341" height="10" fill="rgba(255,255,255,.65)"/>
            <rect x="80" y="0" width="10" height="130" fill="rgba(255,255,255,.62)"/>
            <rect x="190" y="0" width="10" height="130" fill="rgba(255,255,255,.62)"/>
            <rect x="4" y="26" width="70" height="19" rx="2" fill="rgba(26,22,18,.08)"/>
            <rect x="4" y="61" width="70" height="22" rx="2" fill="rgba(26,22,18,.08)"/>
            <rect x="96" y="26" width="88" height="19" rx="2" fill="rgba(26,22,18,.08)"/>
            <rect x="96" y="61" width="88" height="22" rx="2" fill="rgba(26,22,18,.08)"/>
            <circle cx="170" cy="63" r="12" fill="rgba(196,115,63,.12)" stroke="rgba(196,115,63,.3)" strokeWidth="1.5">
              <animate attributeName="r" values="8;19;8" dur="2.4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite"/>
            </circle>
            <circle cx="170" cy="63" r="7" fill="#C4733F" stroke="white" strokeWidth="2.5"/>
          </svg>
          <div className="smap-open">In Google Maps →</div>
          <div className="smap-lbl">📍 {[spot.city, spot.country].filter(Boolean).join(', ')}</div>
        </div>

        {/* Actions */}
        <div className="det-actions">
          <button className={`det-btn ${liked?'lk':''}`} onClick={handleLike}>
            <svg viewBox="0 0 24 24" fill={liked?'#e74c3c':'none'} stroke={liked?'none':'currentColor'} strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            {lCount}
          </button>
          <button className={`det-btn ${saved?'sv':''}`} onClick={handleSave}>
            <svg viewBox="0 0 24 24" fill={saved?'var(--ac)':'none'} stroke={saved?'none':'currentColor'} strokeWidth="1.8">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
            {sCount}
          </button>
          {spot.website && (
            <button className="det-btn" onClick={() => window.open(`https://${spot.website}`, '_blank')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
              Website
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
