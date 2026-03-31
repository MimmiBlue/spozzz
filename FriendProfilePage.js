import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useToast } from '../App'
import { profiles, follows, spots as spotsApi } from '../lib/supabase'
import SpotCard from '../components/SpotCard'

const CATS = ['Alle', 'Restaurant', 'Cafe', 'Bar', 'Natur', 'Beach', 'Stay', 'Culture']

export default function FriendProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()

  const [profile, setProfile]   = useState(null)
  const [stats, setStats]       = useState({ spots: 0, followers: 0 })
  const [following, setFollowing] = useState(false)
  const [hovered, setHovered]   = useState(false)
  const [userSpots, setUserSpots] = useState([])
  const [cat, setCat]           = useState('Alle')
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [profRes, statsRes, followingRes, spotsRes] = await Promise.all([
        profiles.get(id),
        profiles.getStats(id),
        follows.isFollowing(user.id, id),
        spotsApi.getUserSpots(id)
      ])
      setProfile(profRes.data)
      setStats(statsRes)
      setFollowing(followingRes)
      setUserSpots(spotsRes.data || [])
      setLoading(false)
    }
    load()
  }, [id, user.id])

  const handleFollow = async () => {
    const newFollowing = !following
    setFollowing(newFollowing)
    setStats(s => ({ ...s, followers: s.followers + (newFollowing ? 1 : -1) }))
    await follows.toggle(user.id, id)
    showToast(newFollowing ? `Du folgst jetzt @${profile?.username}` : `Entfolgt`)
  }

  const filtered = userSpots.filter(s => {
    const catMatch = cat === 'Alle' || s.category === cat
    const qMatch = !query || [s.name, s.country, s.city, s.category, s.description].join(' ').toLowerCase().includes(query.toLowerCase())
    return catMatch && qMatch
  })

  const initial = profile?.username?.[0]?.toUpperCase() || '?'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* Cover */}
      <div className="fp-cover" style={{ background:'linear-gradient(135deg,#C4733F,#E8A87C)' }}>
        <button className="fp-back" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="fp-avatar avatar" style={{ width:56, height:56, background:'rgba(254,252,248,.2)', border:'3px solid var(--wh)', fontSize:20, color:'white', bottom:-26, left:17, position:'absolute' }}>
          {profile?.avatar_url ? <img src={profile.avatar_url} alt=""/> : initial}
        </div>
      </div>

      {/* Info + follow button */}
      <div style={{ padding:'32px 17px 12px', borderBottom:'.5px solid var(--br)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
          <div>
            <h3 style={{ fontSize:16, fontWeight:600 }}>@{profile?.username}</h3>
            {profile?.bio && <p style={{ fontSize:13, color:'var(--i2)', marginTop:2, fontStyle:'italic' }}>{profile.bio}</p>}
            <div style={{ display:'flex', gap:18, marginTop:9 }}>
              <div><strong style={{ display:'block', fontSize:16 }}>{stats.spots}</strong><span style={{ fontSize:11, color:'var(--i2)' }}>Spozzz</span></div>
              <div><strong style={{ display:'block', fontSize:16 }}>{stats.followers}</strong><span style={{ fontSize:11, color:'var(--i2)' }}>Follower</span></div>
            </div>
          </div>
          {user.id !== id && (
            <button
              className={`follow-btn ${hovered && following ? 'unfollow' : following ? 'following' : 'follow'}`}
              onClick={handleFollow}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              style={{ marginTop:2 }}
            >
              {following ? (hovered ? 'Unfollow' : 'Followed ✓') : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Search + category filter */}
      <div className="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input placeholder="Spozzz suchen..." value={query} onChange={e=>setQuery(e.target.value)}/>
      </div>
      <div className="cats-bar" style={{ flexShrink:0 }}>
        {['Alle', ...new Set(userSpots.map(s => s.category))].map(c => (
          <button key={c} className={`chip ${cat===c?'active':''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {/* Spots */}
      <div style={{ flex:1, overflowY:'auto', paddingBottom:80 }}>
        {loading ? (
          <div className="empty-state"><span className="empty-state-ico">⏳</span>Wird geladen...</div>
        ) : filtered.length ? (
          filtered.map(s => <SpotCard key={s.id} spot={s}/>)
        ) : (
          <div className="empty-state"><span className="empty-state-ico">🔍</span>Keine Spozzz gefunden</div>
        )}
      </div>
    </div>
  )
}
