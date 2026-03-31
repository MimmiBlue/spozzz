// SavedPage.js
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { saves } from '../lib/supabase'
import SpotCard from '../components/SpotCard'

export default function SavedPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems]   = useState([])
  const [query, setQuery]   = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await saves.getSavedSpots(user.id)
    setItems(data?.map(d => d.spots).filter(Boolean) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const filtered = query
    ? items.filter(s => [s.name, s.country, s.city, s.category, s.description].join(' ').toLowerCase().includes(query.toLowerCase()))
    : items

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <div className="page-head">
        <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:20 }}>SAVED SPOTS: {items.length}</h2>
        <button className="page-head-icon"><svg viewBox="0 0 24 24" strokeWidth="1.8"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg></button>
      </div>
      <div className="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input placeholder="Search for countries, cities, friends and keywords..." value={query} onChange={e=>setQuery(e.target.value)}/>
      </div>
      <div style={{ flex:1, overflowY:'auto', paddingBottom:80 }}>
        {loading ? (
          <div className="empty-state"><span className="empty-state-ico">⏳</span>Wird geladen...</div>
        ) : filtered.length ? (
          filtered.map(s => <SpotCard key={s.id} spot={{...s, user_saved:true}} onUpdate={load}/>)
        ) : (
          <div className="empty-state"><span className="empty-state-ico">🔖</span>{items.length ? 'Keine Ergebnisse' : 'Noch nichts gespeichert'}</div>
        )}
      </div>
    </div>
  )
}
