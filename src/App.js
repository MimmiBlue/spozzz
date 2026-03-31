import React, { createContext, useContext, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, auth } from './lib/supabase'
import './index.css'

// Pages
import LoginPage    from './pages/LoginPage'
import HomePage     from './pages/HomePage'
import FriendsPage  from './pages/FriendsPage'
import SavedPage    from './pages/SavedPage'
import MySpozzzPage from './pages/MySpozzzPage'
import AddSpotPage  from './pages/AddSpotPage'
import DetailPage   from './pages/DetailPage'
import FriendProfilePage from './pages/FriendProfilePage'
import Layout       from './components/Layout'

// ─── AUTH CONTEXT ────────────────────────────────────────────────────────────
export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// ─── TOAST CONTEXT ───────────────────────────────────────────────────────────
export const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

function Toast({ message }) {
  return <div className="toast">{message}</div>
}

export default function App() {
  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState(null)
  const [toastTimer, setToastTimer] = useState(null)

  const showToast = (msg) => {
    if (toastTimer) clearTimeout(toastTimer)
    setToast(msg)
    const t = setTimeout(() => setToast(null), 2600)
    setToastTimer(t)
  }

  useEffect(() => {
    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { setProfile(null); return }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data))
  }, [user])

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--s)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:32, marginBottom:8 }}>
            S<em style={{fontStyle:'italic',color:'var(--ac)'}}>p</em>ozzz
          </div>
          <div style={{ fontSize:13, color:'var(--i2)' }}>Wird geladen...</div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, profile, setProfile }}>
      <ToastContext.Provider value={showToast}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
            <Route element={user ? <Layout /> : <Navigate to="/login" />}>
              <Route path="/"            element={<HomePage />} />
              <Route path="/friends"     element={<FriendsPage />} />
              <Route path="/saved"       element={<SavedPage />} />
              <Route path="/my-spozzz"   element={<MySpozzzPage />} />
              <Route path="/add"         element={<AddSpotPage />} />
              <Route path="/spot/:id"    element={<DetailPage />} />
              <Route path="/user/:id"    element={<FriendProfilePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        {toast && <Toast message={toast} />}
      </ToastContext.Provider>
    </AuthContext.Provider>
  )
}
