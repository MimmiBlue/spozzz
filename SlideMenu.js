import React from 'react'
import { useAuth } from '../App'
import { auth } from '../lib/supabase'

export default function SlideMenu({ onClose, onNavigate }) {
  const { user, profile } = useAuth()
  const initial = profile?.username?.[0]?.toUpperCase() || 'M'

  const items = [
    { label: 'Home', path: '/', icon: <svg viewBox="0 0 24 24" strokeWidth="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> },
    { label: 'Friendship Requests', path: '/friends?tab=requests', icon: <svg viewBox="0 0 24 24" strokeWidth="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>, badge: true },
    { label: 'My Friends', path: '/friends', icon: <svg viewBox="0 0 24 24" strokeWidth="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg> },
    { label: 'Find Friends', path: '/friends?tab=find', icon: <svg viewBox="0 0 24 24" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg> },
    { label: 'Profile Settings', path: '/my-spozzz?tab=settings', icon: <svg viewBox="0 0 24 24" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
    { label: 'Data Privacy & Terms', path: '/my-spozzz?tab=privacy', icon: <svg viewBox="0 0 24 24" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
    { label: 'Inappropriate Content', path: '/my-spozzz?tab=report', icon: <svg viewBox="0 0 24 24" strokeWidth="1.8"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg> },
  ]

  const handleLogout = async () => {
    await auth.signOut()
    onClose()
  }

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-panel" onClick={e => e.stopPropagation()}>
        <button className="menu-close" onClick={onClose}>✕</button>

        {/* User */}
        <div className="menu-user">
          <div className="avatar" style={{ width:52, height:52, background:'linear-gradient(135deg,#C4733F,#E8A87C)', fontSize:20, color:'white' }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar"/>
              : initial
            }
          </div>
          <span className="menu-username">{profile?.username || 'Maja'}</span>
        </div>

        <div className="menu-divider"/>

        {/* Nav items */}
        {items.map(item => (
          <button key={item.label} className="menu-item" onClick={() => onNavigate(item.path)}>
            {item.icon}
            <span>
              {item.label}
              {item.badge && <span className="menu-badge">2</span>}
            </span>
          </button>
        ))}

        <div style={{ flex:1 }}/>
        <div className="menu-divider"/>

        <button className="menu-item logout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Log Out</span>
        </button>
      </div>
    </div>
  )
}
