import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useToast } from '../App'
import { spots as spotsApi } from '../lib/supabase'

const CATS = ['Bar','Beach','Cafe','Culture','Local Eating','Nature','Restaurant','Sports','Stay','Walk']

export default function AddSpotPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const showToast = useToast()
  const [form, setForm] = useState({
    name:'', country:'', city:'', category:'Cafe',
    description:'', visibility:'public', status:'visited', website:''
  })
  const [photo,   setPhoto]   = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [geoCoords, setGeoCoords] = useState({ lat: null, lng: null })

  // ✅ Capture user's location when page loads
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { showToast('Bitte Name eingeben'); return }
    setLoading(true)
    try {
      let photo_url = null
      if (photo) {
        const { url, error } = await spotsApi.uploadPhoto(photo, user.id)
        if (error) throw error
        photo_url = url
      }
      // ✅ Save lat/lng with the spot
      await spotsApi.create({
        ...form,
        photo_url,
        author_id: user.id,
        lat: geoCoords.lat,
        lng: geoCoords.lng,
      })
      showToast('Spozzz gespeichert ✓')
      navigate('/my-spozzz')
    } catch (err) {
      showToast('Fehler beim Speichern: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'13px 17px', display:'flex', alignItems:'center', gap:10, borderBottom:'.5px solid var(--br)', flexShrink:0, background:'var(--wh)' }}>
        <button onClick={() => navigate(-1)} style={{ width:32, height:32, borderRadius:'50%', background:'var(--s)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:19 }}>Spozzz hinzufügen</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ flex:1, overflowY:'auto', paddingBottom:80 }}>
        {/* Photo upload */}
        <label style={{ display:'block', margin:'12px 14px', height:120, background:'var(--s2)', borderRadius:13, border:'1.5px dashed rgba(26,22,18,.18)', cursor:'pointer', overflow:'hidden', position:'relative' }}>
          <input type="file" accept="image/*" onChange={handlePhoto} style={{ display:'none' }}/>
          {preview
            ? <img src={preview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:6 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--i2)" strokeWidth="1.5"><rect x="3" y="8" width="18" height="13" rx="2"/><circle cx="12" cy="14" r="3"/><path d="M8 8V6a4 4 0 018 0v2"/></svg>
                <span style={{ fontSize:12, color:'var(--i2)' }}>Foto aufnehmen oder hochladen</span>
              </div>
          }
        </label>

        {/* Location hint */}
        {geoCoords.lat && (
          <div style={{ margin:'0 14px 6px', fontSize:11, color:'var(--gn)', display:'flex', alignItems:'center', gap:4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--gn)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Standort erfasst — Distanz wird automatisch berechnet
          </div>
        )}

        {/* Text fields */}
        {[
          ['Name *','name','text',true],
          ['Land','country','text',false],
          ['Stadt','city','text',false],
          ['Website (optional)','website','url',false]
        ].map(([label,key,type,req]) => (
          <div key={key} style={{ padding:'4px 14px 10px' }}>
            <label style={{ fontSize:11, fontWeight:600, color:'var(--i2)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:4 }}>{label}</label>
            <input className="input" type={type} required={req} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={label.replace(' *','')}/>
          </div>
        ))}

        {/* Category */}
        <div style={{ padding:'4px 14px 10px' }}>
          <label style={{ fontSize:11, fontWeight:600, color:'var(--i2)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:4 }}>Kategorie</label>
          <select className="input" value={form.category} onChange={e=>set('category',e.target.value)}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Visibility */}
        <div style={{ padding:'4px 14px 10px' }}>
          <label style={{ fontSize:11, fontWeight:600, color:'var(--i2)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6 }}>Sichtbarkeit</label>
          <div style={{ display:'flex', gap:6 }}>
            {[['public','Öffentlich'],['friends','Freunde'],['private','Nur ich']].map(([val,label]) => (
              <button key={val} type="button" onClick={() => set('visibility',val)}
                style={{ flex:1, padding:'8px 3px', borderRadius:10, border:'.5px solid var(--br)', fontSize:12, fontWeight:500, cursor:'pointer',
                  background:form.visibility===val?'var(--ac)':'var(--wh)', color:form.visibility===val?'white':'var(--i2)', fontFamily:'DM Sans,sans-serif' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div style={{ padding:'4px 14px 10px' }}>
          <label style={{ fontSize:11, fontWeight:600, color:'var(--i2)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6 }}>Status</label>
          <div style={{ display:'flex', gap:6 }}>
            {[['visited','Bereits besucht'],['want_to_go','Möchte hin']].map(([val,label]) => (
              <button key={val} type="button" onClick={() => set('status',val)}
                style={{ flex:1, padding:'8px 3px', borderRadius:10, border:'.5px solid var(--br)', fontSize:12, fontWeight:500, cursor:'pointer',
                  background:form.status===val?'var(--ac)':'var(--wh)', color:form.status===val?'white':'var(--i2)', fontFamily:'DM Sans,sans-serif' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ padding:'4px 14px 10px' }}>
          <label style={{ fontSize:11, fontWeight:600, color:'var(--i2)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:4 }}>Beschreibung</label>
          <textarea className="input" style={{ height:70, resize:'none' }} value={form.description}
            onChange={e=>set('description',e.target.value)} placeholder="Was macht diesen Ort besonders?"/>
        </div>

        {/* Submit */}
        <div style={{ padding:'4px 14px 16px' }}>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Wird gespeichert...' : 'Spozzz speichern ✦'}
          </button>
        </div>
      </form>
    </div>
  )
}
