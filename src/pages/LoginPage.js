import React, { useState } from 'react'
import { auth } from '../lib/supabase'

export default function LoginPage() {
  const [mode, setMode]     = useState('login') // 'login' | 'register'
  const [email, setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await auth.signIn(email, password)
        if (error) throw error
      } else {
        if (!username.trim()) throw new Error('Bitte Benutzername eingeben')
        const { error } = await auth.signUp(email, password, username)
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', padding:26, background:'var(--s)' }}>
      {/* Logo */}
      <div style={{ fontFamily:'Playfair Display,serif', fontSize:42, marginBottom:6 }}>
        S<em style={{ fontStyle:'italic', color:'var(--ac)' }}>p</em>ozzz
      </div>
      <p style={{ fontSize:13, color:'var(--i2)', marginBottom:28, textAlign:'center', lineHeight:1.5 }}>
        Share what you love.<br/>Discover what matters.
      </p>

      {/* Tabs */}
      <div style={{ display:'flex', width:'100%', marginBottom:20, background:'var(--s2)', borderRadius:12, padding:4 }}>
        {['login','register'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex:1, padding:'8px 4px', border:'none', borderRadius:9,
            background: mode===m ? 'var(--wh)' : 'transparent',
            fontWeight:600, fontSize:13, cursor:'pointer', color:'var(--ink)',
            boxShadow: mode===m ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            fontFamily:'DM Sans,sans-serif', transition:'all .15s'
          }}>
            {m === 'login' ? 'Einloggen' : 'Registrieren'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ width:'100%' }}>
        {mode === 'register' && (
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--i2)', display:'block', marginBottom:4 }}>Benutzername</label>
            <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="dein_username" required/>
          </div>
        )}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--i2)', display:'block', marginBottom:4 }}>E-Mail</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="du@example.com" required/>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--i2)', display:'block', marginBottom:4 }}>Passwort</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/>
        </div>

        {error && <p style={{ fontSize:13, color:'var(--rd)', marginBottom:12, textAlign:'center' }}>{error}</p>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Wird geladen...' : mode === 'login' ? 'Einloggen' : 'Konto erstellen'}
        </button>
      </form>

      <p style={{ fontSize:12, color:'var(--i2)', marginTop:24, textAlign:'center', fontStyle:'italic' }}>
        „Your world of hidden gems"
      </p>
    </div>
  )
}
