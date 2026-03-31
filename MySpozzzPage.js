// MySpozzzPage.js
import React, { useState, useEffect } from 'react'
import { useAuth, useToast } from '../App'
import { spots as spotsApi, profiles, auth } from '../lib/supabase'

export default function MySpozzzPage() {
  const { user, profile, setProfile } = useAuth()
  const showToast = useToast()
  const [mySpots, setMySpots] = useState([])
  const [query, setQuery]     = useState('')
  const [loading, setLoading] = useState(true)
  const [editSpot, setEditSpot] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [tab, setTab]          = useState('spots') // 'spots' | 'settings'
  const [settings, setSettings] = useState({ username:'', bio:'', website:'' })

  useEffect(() => {
    if (profile) setSettings({ username: profile.username||'', bio: profile.bio||'', website: profile.website||'' })
  }, [profile])

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await spotsApi.getMySpots(user.id)
    setMySpots(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [user])

  const handleDelete = async () => {
    await spotsApi.delete(deleteId)
    setDeleteId(null)
    showToast('Spozzz gelöscht')
    load()
  }

  const handleSaveSettings = async () => {
    await profiles.update(user.id, settings)
    setProfile(prev => ({ ...prev, ...settings }))
    showToast('Einstellungen gespeichert ✓')
  }

  const filtered = query
    ? mySpots.filter(s => [s.name, s.country, s.city, s.category].join(' ').toLowerCase().includes(query.toLowerCase()))
    : mySpots

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:'var(--wh)', flexShrink:0 }}>
        <div style={{ padding:'9px 17px', fontSize:11, fontWeight:600, letterSpacing:'.08em', color:'var(--ink)', borderBottom:'.5px solid var(--br)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>MY SPOTS: {mySpots.length}</span>
        </div>
        {/* Profile banner */}
        <div style={{ height:80, background:'linear-gradient(135deg,#C4733F,#E8A87C)', position:'relative', flexShrink:0 }}>
          <div style={{ position:'absolute', bottom:-22, left:17, width:46, height:46, borderRadius:'50%', background:'var(--wh)', border:'3px solid var(--wh)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:700, color:'var(--ac)' }}>
            {profile?.username?.[0]?.toUpperCase() || 'M'}
          </div>
        </div>
        <div style={{ padding:'28px 17px 12px', borderBottom:'.5px solid var(--br)' }}>
          <div style={{ fontSize:16, fontWeight:600 }}>{profile?.username || 'maja_on_tour'}</div>
          {profile?.bio && <p style={{ fontSize:13, color:'var(--i2)', marginTop:2, fontStyle:'italic' }}>{profile.bio}</p>}
          {profile?.website && <a href={`https://${profile.website}`} style={{ fontSize:12, color:'var(--ac)', display:'block', marginTop:2 }}>{profile.website}</a>}
          <div style={{ display:'flex', gap:18, marginTop:8 }}>
            <div><strong style={{ display:'block', fontSize:16 }}>{mySpots.length}</strong><span style={{ fontSize:11, color:'var(--i2)' }}>SPOZZZ</span></div>
          </div>
        </div>
        <div className="tabs">
          <button className={`tab ${tab==='spots'?'active':''}`} onClick={() => setTab('spots')}>Meine Spozzz</button>
          <button className={`tab ${tab==='settings'?'active':''}`} onClick={() => setTab('settings')}>Einstellungen</button>
        </div>
      </div>

      {/* SPOTS TAB */}
      {tab === 'spots' && (
        <>
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input placeholder="Suchen..." value={query} onChange={e=>setQuery(e.target.value)}/>
          </div>
          <div style={{ flex:1, overflowY:'auto', paddingBottom:80 }}>
            {loading ? (
              <div className="empty-state"><span className="empty-state-ico">⏳</span>Wird geladen...</div>
            ) : filtered.length ? filtered.map(s => (
              <div key={s.id} className="mysp-card">
                <div className="mysp-img">
                  {s.photo_url ? <img src={s.photo_url} alt={s.name}/> : <span>{catEmoji(s.category)}</span>}
                </div>
                <div className="mysp-btn-row">
                  <button className="mysp-btn del" onClick={() => setDeleteId(s.id)}>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                    DELETE
                  </button>
                  <button className="mysp-btn edt" onClick={() => setEditSpot(s)}>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    EDIT
                  </button>
                </div>
                <div className="mysp-info">
                  <div className="mysp-location">{[s.country, s.city, s.name].filter(Boolean).join(' | ')}</div>
                  <div className="mysp-cat">{s.category}</div>
                </div>
              </div>
            )) : (
              <div className="empty-state"><span className="empty-state-ico">📍</span>Noch keine Spozzz.</div>
            )}
          </div>
        </>
      )}

      {/* SETTINGS TAB */}
      {tab === 'settings' && (
        <div style={{ flex:1, overflowY:'auto', paddingBottom:80 }}>
          <div style={{ padding:'14px 17px 4px', fontSize:11, fontWeight:600, letterSpacing:'.06em', color:'var(--i2)' }}>PROFIL</div>
          {[['Benutzername','username','text'],['Bio','bio','text'],['Website','website','url']].map(([label,key,type]) => (
            <div key={key} style={{ padding:'4px 17px 12px' }}>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--i2)', display:'block', marginBottom:4 }}>{label}</label>
              <input className="input" type={type} value={settings[key]} onChange={e=>setSettings(p=>({...p,[key]:e.target.value}))}/>
            </div>
          ))}
          <div style={{ padding:'0 17px' }}>
            <button className="btn-primary" onClick={handleSaveSettings}>Speichern</button>
          </div>
          <div style={{ padding:'20px 17px 4px', fontSize:11, fontWeight:600, letterSpacing:'.06em', color:'var(--i2)' }}>KONTO</div>
          <div style={{ padding:'0 17px' }}>
            <button className="btn-ghost" style={{ width:'100%', marginBottom:8 }} onClick={async () => { await auth.signOut() }}>Abmelden</button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <div className="overlay overlay-center" onClick={() => setDeleteId(null)}>
          <div className="dialog" onClick={e=>e.stopPropagation()}>
            <h3>Spozzz löschen?</h3>
            <p>Dieser Spozzz wird unwiderruflich gelöscht.</p>
            <div className="dialog-btns">
              <button className="btn-cancel" onClick={() => setDeleteId(null)}>Abbrechen</button>
              <button className="btn-danger" onClick={handleDelete}>Löschen</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SHEET */}
      {editSpot && <EditSheet spot={editSpot} onClose={() => setEditSpot(null)} onSaved={() => { setEditSpot(null); load(); showToast('Gespeichert ✓') }}/>}
    </div>
  )
}

function EditSheet({ spot, onClose, onSaved }) {
  const [form, setForm] = useState({ name: spot.name, country: spot.country||'', city: spot.city||'', category: spot.category, description: spot.description||'', visibility: spot.visibility, website: spot.website||'' })
  const CATS = ['Bar','Beach','Cafe','Culture','Local Eating','Nature','Restaurant','Sports','Stay','Walk']

  const handleSave = async () => {
    await spotsApi.update(spot.id, form)
    onSaved()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div className="sheet-title">Spozzz bearbeiten</div>
        <div style={{ padding:'12px 0 0' }}>
          {[['Name','name','text'],['Land','country','text'],['Stadt','city','text'],['Website','website','url'],['Beschreibung','description','textarea']].map(([label,key,type]) => (
            <div key={key} style={{ padding:'4px 17px 10px' }}>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--i2)', display:'block', marginBottom:4 }}>{label}</label>
              {type === 'textarea'
                ? <textarea className="input" style={{ height:60, resize:'none' }} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/>
                : <input className="input" type={type} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/>
              }
            </div>
          ))}
          <div style={{ padding:'4px 17px 10px' }}>
            <label style={{ fontSize:11, fontWeight:600, color:'var(--i2)', display:'block', marginBottom:4 }}>Kategorie</label>
            <select className="input" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ padding:'4px 17px 10px' }}>
            <label style={{ fontSize:11, fontWeight:600, color:'var(--i2)', display:'block', marginBottom:6 }}>Sichtbarkeit</label>
            <div style={{ display:'flex', gap:6 }}>
              {[['public','Öffentlich'],['friends','Freunde'],['private','Nur ich']].map(([val,label]) => (
                <button key={val} onClick={() => setForm(p=>({...p,visibility:val}))} style={{ flex:1, padding:'7px 3px', borderRadius:10, border:'.5px solid var(--br)', fontSize:12, fontWeight:500, cursor:'pointer', background:form.visibility===val?'var(--ac)':'var(--wh)', color:form.visibility===val?'white':'var(--i2)', fontFamily:'DM Sans,sans-serif' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding:'0 17px 8px' }}>
            <button className="btn-primary" style={{ background:'var(--gn)' }} onClick={handleSave}>Speichern ✦</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function catEmoji(cat) {
  return { Cafe:'☕', Restaurant:'🍝', Bar:'🍸', Beach:'🏖', Natur:'🌿', Stay:'🏔', Culture:'🎭' }[cat] || '📍'
}
