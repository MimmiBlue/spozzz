import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../App'
import { spots } from '../lib/supabase'
import SpotCard from '../components/SpotCard'

const CATS = ['Alle', 'Restaurant', 'Cafe', 'Bar', 'Natur', 'Beach', 'Stay', 'Culture']
const EMOJI = { Cafe:'☕', Restaurant:'🍝', Bar:'🍸', Beach:'🏖', Natur:'🌿', Stay:'🏔', Culture:'🎭', 'Local Eating':'🍜' }

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { openMenu } = useOutletContext()
  const [cat, setCat]         = useState('Alle')
  const [nearby, setNearby]   = useState([])
  const [frRec, setFrRec]     = useState([])
  const [latest, setLatest]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const catParam = cat === 'Alle' ? null : cat
    const [nearRes, frRes, latRes] = await Promise.all([
      spots.getNearby(user.id, catParam),
      spots.getFriendsSpots(user.id, catParam),
      spots.getFriendsSpots(user.id, null) // section 3 unfiltered
    ])
    setNearby(nearRes.data || [])
    setFrRec(frRes.data || [])
    setLatest(latRes.data || [])
    setLoading(false)
  }, [user, cat])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:'var(--wh)', flexShrink:0 }}>
        <div style={{ padding:'14px 18px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <h1 className="playfair" style={{ fontSize:25, fontWeight:400 }}>
              Hallo, <em style={{ fontStyle:'italic', color:'var(--ac)' }}>
                {user?.email?.split('@')[0] || 'Maja'}
              </em> 👋
            </h1>
            <p style={{ fontSize:13, color:'var(--i2)', marginTop:2 }}>Was entdeckst du heute?</p>
          </div>
          <button onClick={openMenu} style={{ background:'none', border:'none', cursor:'pointer', padding:4, marginTop:2 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
        {/* Category chips */}
        <div className="cats-bar">
          {CATS.map(c => (
            <button key={c} className={`chip ${cat===c?'active':''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex:1, overflowY:'auto', paddingBottom:80 }}>
        {/* SECTION 1: All Next to You */}
        <div className="sec-head">
          <h3>All next to you</h3>
          <button className="sec-head-ico" onClick={() => navigate('/map')}>
            <svg viewBox="0 0 24 24" strokeWidth="1.8"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          </button>
        </div>
        <div className="hscroll">
          {nearby.length ? nearby.map(s => (
            <div key={s.id} className="hcard" onClick={() => navigate(`/spot/${s.id}`)}>
              <div className="hcard-img">
                {s.photo_url ? <img src={s.photo_url} alt={s.name}/> : EMOJI[s.category] || '📍'}
                <div className="hcard-overlay">
                  <div className="hcard-cat">{s.category}</div>
                  <div className="hcard-name">{[s.city, s.name].filter(Boolean).join(' | ')}</div>
                </div>
              </div>
            </div>
          )) : (
            <div style={{ padding:'6px 2px', fontSize:13, color:'var(--i2)', minWidth:200 }}>
              {loading ? 'Wird geladen...' : 'Noch keine Spots in dieser Kategorie.'}
            </div>
          )}
        </div>

        {/* SECTION 2: Friends Recommendations */}
        <div className="sec-head">
          <h3>All friends recommendations</h3>
          <button className="sec-head-ico">
            <svg viewBox="0 0 24 24" strokeWidth="1.8"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          </button>
        </div>
        <div className="hscroll">
          {frRec.length ? frRec.map(s => (
            <div key={s.id} className="hcard" onClick={() => navigate(`/spot/${s.id}`)}>
              <div className="hcard-img">
                {s.photo_url ? <img src={s.photo_url} alt={s.name}/> : EMOJI[s.category] || '📍'}
                <div className="hcard-overlay">
                  <div className="hcard-cat">{s.profiles?.username}'s {s.category}</div>
                  <div className="hcard-name">{[s.city, s.name].filter(Boolean).join(' | ')}</div>
                </div>
              </div>
            </div>
          )) : (
            <div style={{ padding:'6px 2px', fontSize:13, color:'var(--i2)', minWidth:220 }}>
              {loading ? 'Wird geladen...' : 'Folge Freunden, um ihre Empfehlungen zu sehen.'}
            </div>
          )}
        </div>

        {/* SECTION 3: Friends Newest (not filtered) */}
        <div className="sec-head">
          <h3>Friends newest spots</h3>
          <button className="sec-head-ico">
            <svg viewBox="0 0 24 24" strokeWidth="1.8"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          </button>
        </div>
        {latest.length ? latest.map(s => (
          <SpotCard key={s.id} spot={s} onUpdate={load}/>
        )) : (
          <div className="empty-state">
            <span className="empty-state-ico">👥</span>
            {loading ? 'Wird geladen...' : 'Folge Freunden, um ihre neuesten Spots zu sehen.'}
          </div>
        )}
      </div>
    </div>
  )
}
