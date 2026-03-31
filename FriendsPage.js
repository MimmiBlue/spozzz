import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, useToast } from '../App'
import { follows, friendRequests, profiles, spots } from '../lib/supabase'
import SpotCard from '../components/SpotCard'

export default function FriendsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const [searchParams] = useSearchParams()
  const [tab, setTab]           = useState(searchParams.get('tab') === 'find' ? 'find' : 'friends')
  const [friends, setFriends]   = useState([])
  const [feedSpots, setFeedSpots] = useState([])
  const [requests, setRequests] = useState([])
  const [query, setQuery]       = useState('')
  const [findEmail, setFindEmail] = useState('')
  const [findResults, setFindResults] = useState([])
  const [loading, setLoading]   = useState(true)
  const [sentReqs, setSentReqs] = useState({})

  const load = async () => {
    if (!user) return
    setLoading(true)
    const [fRes, rRes] = await Promise.all([
      follows.getFollowing(user.id),
      friendRequests.getPending(user.id)
    ])
    const friendList = fRes.data?.map(f => f.profiles).filter(Boolean) || []
    setFriends(friendList)
    setRequests(rRes.data || [])
    // Load friends' spots
    const { data: spotData } = await spots.getFriendsSpots(user.id)
    setFeedSpots(spotData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const handleAccept = async (req) => {
    await friendRequests.accept(req.id)
    await follows.toggle(user.id, req.from_id) // auto-follow back
    showToast(`@${req.profiles?.username} als Freund hinzugefügt ✓`)
    load()
  }

  const handleDecline = async (req) => {
    await friendRequests.decline(req.id)
    showToast('Anfrage abgelehnt')
    load()
  }

  const handleEmailSearch = async (val) => {
    setFindEmail(val)
    if (val.length < 3) { setFindResults([]); return }
    const { data } = await profiles.searchByEmail(val)
    const sentRes = await friendRequests.getSent(user.id)
    const sentIds = new Set(sentRes.data?.map(r => r.to_id) || [])
    const followingIds = new Set(friends.map(f => f.id))
    setFindResults((data || []).filter(p => p.id !== user.id).map(p => ({
      ...p,
      isFollowing: followingIds.has(p.id),
      reqSent: sentIds.has(p.id)
    })))
  }

  const handleFollowFromSearch = async (p) => {
    if (p.isFollowing) {
      await follows.toggle(user.id, p.id)
      showToast(`Entfolgt @${p.username}`)
    } else {
      await friendRequests.send(user.id, p.id)
      setSentReqs(prev => ({ ...prev, [p.id]: true }))
      showToast(`Freundschaftsanfrage an @${p.username} gesendet`)
    }
    handleEmailSearch(findEmail)
  }

  const filtered = query
    ? feedSpots.filter(s => [s.name, s.country, s.city, s.category, s.profiles?.username].join(' ').toLowerCase().includes(query.toLowerCase()))
    : feedSpots

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:'var(--wh)', flexShrink:0 }}>
        <div className="page-head">
          <h2>Freunde</h2>
        </div>

        {/* Requests banner */}
        {requests.length > 0 && (
          <div className="req-banner">
            <span>Friendship Requests: <strong>{requests.length}</strong></span>
            <button onClick={() => setTab('requests')}>Anzeigen ›</button>
          </div>
        )}

        {/* Avatar strip */}
        {tab === 'friends' && friends.length > 0 && (
          <div style={{ borderBottom:'.5px solid var(--br)', paddingBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.06em', color:'var(--i2)', padding:'8px 17px 4px' }}>
              MY FRIENDS: {friends.length}
            </div>
            <div style={{ display:'flex', gap:14, padding:'4px 16px 4px', overflowX:'auto' }}>
              {friends.map(f => (
                <div key={f.id} onClick={() => navigate(`/user/${f.id}`)}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0, cursor:'pointer' }}>
                  <div className="avatar" style={{ width:48, height:48, background:'var(--s2)', fontSize:16, border:'2px solid var(--ac)' }}>
                    {f.avatar_url ? <img src={f.avatar_url} alt={f.username}/> : f.username?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize:10, fontWeight:500, color:'var(--ink)', maxWidth:50, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {f.username}
                  </span>
                  <span style={{ fontSize:9, color:'var(--gn)' }}>✓ following</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.06em', color:'var(--ink)', padding:'6px 17px 2px', display:'flex', justifyContent:'space-between' }}>
              <span>MY FRIENDS RECOMMENDATIONS: {feedSpots.length}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab==='friends'?'active':''}`} onClick={() => setTab('friends')}>Meine Freunde</button>
          <button className={`tab ${tab==='find'?'active':''}`} onClick={() => setTab('find')}>Freunde finden</button>
          {requests.length > 0 && (
            <button className={`tab ${tab==='requests'?'active':''}`} onClick={() => setTab('requests')}>
              Anfragen ({requests.length})
            </button>
          )}
        </div>
      </div>

      {/* MY FRIENDS tab */}
      {tab === 'friends' && (
        <>
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input placeholder="Search for countries, cities, friends and keywords..." value={query} onChange={e=>setQuery(e.target.value)}/>
          </div>
          <div style={{ flex:1, overflowY:'auto', paddingBottom:80 }}>
            {loading ? (
              <div className="empty-state"><span className="empty-state-ico">⏳</span>Wird geladen...</div>
            ) : filtered.length ? (
              filtered.map(s => <SpotCard key={s.id} spot={s}/>)
            ) : (
              <div className="empty-state"><span className="empty-state-ico">👥</span>
                {friends.length ? 'Keine Ergebnisse' : 'Folge Freunden, um ihre Spots zu sehen.'}
              </div>
            )}
          </div>
        </>
      )}

      {/* FIND FRIENDS tab */}
      {tab === 'find' && (
        <>
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="email" placeholder="E-Mail-Adresse eingeben..." value={findEmail} onChange={e=>handleEmailSearch(e.target.value)}/>
          </div>
          <div style={{ flex:1, overflowY:'auto', paddingBottom:80 }}>
            {!findEmail && (
              <p style={{ padding:'16px 20px', fontSize:13, color:'var(--i2)', textAlign:'center', lineHeight:1.5 }}>
                Gib die E-Mail-Adresse einer Person ein, um sie zu finden.
              </p>
            )}
            {findResults.map(p => (
              <div key={p.id} style={{ background:'var(--wh)', border:'.5px solid var(--br)', borderRadius:14, margin:'0 14px 10px', padding:13, display:'flex', alignItems:'center', gap:12 }}>
                <div className="avatar" style={{ width:46, height:46, background:'var(--s2)', fontSize:16 }}>
                  {p.avatar_url ? <img src={p.avatar_url} alt={p.username}/> : p.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>@{p.username}</div>
                  {p.bio && <div style={{ fontSize:12, color:'var(--i2)', marginTop:1 }}>{p.bio}</div>}
                  <div style={{ fontSize:11, color:'var(--i2)', marginTop:2 }}>{p.email}</div>
                </div>
                <button
                  className={`follow-btn ${p.isFollowing ? 'following' : p.reqSent || sentReqs[p.id] ? 'sent' : 'follow'}`}
                  onClick={() => handleFollowFromSearch(p)}
                >
                  {p.isFollowing ? 'Followed ✓' : p.reqSent || sentReqs[p.id] ? 'Angefragt ✓' : 'Anfrage senden'}
                </button>
              </div>
            ))}
            {findEmail.length >= 3 && !findResults.length && (
              <div className="empty-state"><span className="empty-state-ico">🔍</span>Keine Nutzer gefunden.</div>
            )}
          </div>
        </>
      )}

      {/* REQUESTS tab */}
      {tab === 'requests' && (
        <div style={{ flex:1, overflowY:'auto', paddingBottom:80 }}>
          <div style={{ padding:'10px 14px 4px', fontSize:11, fontWeight:600, letterSpacing:'.06em', color:'var(--i2)' }}>
            OFFENE ANFRAGEN: {requests.length}
          </div>
          {requests.length ? requests.map(req => (
            <div key={req.id} style={{ background:'var(--wh)', border:'.5px solid var(--br)', borderRadius:14, margin:'0 14px 10px', padding:13, display:'flex', alignItems:'center', gap:12 }}>
              <div className="avatar" style={{ width:44, height:44, background:'var(--s2)', fontSize:15 }}>
                {req.profiles?.avatar_url ? <img src={req.profiles.avatar_url} alt=""/> : req.profiles?.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>@{req.profiles?.username}</div>
                <div style={{ fontSize:12, color:'var(--i2)', marginTop:1 }}>{req.profiles?.bio}</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => handleAccept(req)} style={{ padding:'6px 11px', borderRadius:10, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', background:'var(--ac)', color:'white', fontFamily:'DM Sans,sans-serif' }}>Annehmen</button>
                <button onClick={() => handleDecline(req)} style={{ padding:'6px 11px', borderRadius:10, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', background:'var(--s)', color:'var(--i2)', fontFamily:'DM Sans,sans-serif' }}>Ablehnen</button>
              </div>
            </div>
          )) : (
            <div className="empty-state"><span className="empty-state-ico">👥</span>Keine offenen Anfragen</div>
          )}
        </div>
      )}
    </div>
  )
}
