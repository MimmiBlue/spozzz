import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, useToast } from '../App'
import { auth } from '../lib/supabase'
import SlideMenu from './SlideMenu'

export default function Layout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const showToast = useToast()
  const [menuOpen, setMenuOpen] = useState(false)

  const path = location.pathname

  const navItems = [
    { path: '/', label: 'Home', icon: (
      <svg viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    )},
    { path: '/friends', label: 'Friends', icon: (
      <svg viewBox="0 0 24 24" strokeWidth="1.8">
        <circle cx="9" cy="7" r="4"/>
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
        <path d="M21 21v-2a4 4 0 00-3-3.87"/>
      </svg>
    ), badge: true },
    null, // FAB placeholder
    { path: '/saved', label: 'Saved', icon: (
      <svg viewBox="0 0 24 24" strokeWidth="1.8">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
      </svg>
    )},
    { path: '/my-spozzz', label: 'My Spozzz', icon: (
      <svg viewBox="0 0 24 24" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    )},
  ]

  // Provide openMenu to child pages via window (simple approach)
  window.__openSpozzzMenu = () => setMenuOpen(true)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', maxWidth:430, margin:'0 auto', background:'var(--wh)' }}>
      {/* Page content */}
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <Outlet context={{ openMenu: () => setMenuOpen(true) }} />
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {navItems.map((item, i) => {
          if (!item) return (
            <button key="fab" className="nav-fab" onClick={() => navigate('/add')}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          )
          const active = path === item.path || (item.path !== '/' && path.startsWith(item.path))
          return (
            <button
              key={item.path}
              className={`nav-btn ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {item.label}
              {item.badge && <div className="nav-badge"/>}
            </button>
          )
        })}
      </nav>

      {/* Slide-in Menu */}
      {menuOpen && (
        <SlideMenu
          onClose={() => setMenuOpen(false)}
          onNavigate={(path) => { setMenuOpen(false); navigate(path) }}
        />
      )}
    </div>
  )
}
