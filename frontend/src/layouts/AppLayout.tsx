import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './app-layout.css'

const navigationItems = ['Dashboard', 'Billing', 'Sales', 'Medicines', 'Inventory', 'Purchases', 'Customers', 'Suppliers', 'Reports', 'Settings']

const routeFor = (label: string): string => `/${label.toLowerCase()}`

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-mark${compact ? ' brand-mark-compact' : ''}`} aria-label="Shri Nandi Medicals logo">
      <svg viewBox="0 0 48 48" role="img" aria-hidden="true">
        <path d="M10 16c4-7 10-9 14-9s10 2 14 9l-4 3c-2-4-6-6-10-6s-8 2-10 6z" fill="#f4fbf8" />
        <path d="M12 17c-5-1-7-5-6-9 5 1 8 4 9 9m21 0c5-1 7-5 6-9-5 1-8 4-9 9" fill="none" stroke="#f4fbf8" strokeWidth="3" strokeLinecap="round" />
        <path d="M16 18c1-6 5-9 8-9s7 3 8 9c3 4 4 10 2 16-2 5-6 8-10 8s-8-3-10-8c-2-6-1-12 2-16z" fill="#1b9b86" stroke="#f4fbf8" strokeWidth="1.5" />
        <path d="M20 21h8v4h-8zm0 10h8v4h-8zm-5-6h18v4H15z" fill="#fff" opacity=".96" />
        <circle cx="19" cy="17" r="1.2" fill="#14384a" /><circle cx="29" cy="17" r="1.2" fill="#14384a" />
      </svg>
    </span>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => setMenuOpen(false), [location.pathname])
  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }) }
  return (
    <div className="app-shell">
      {menuOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar${menuOpen ? ' sidebar-open' : ''}`}>
        <div className="brand"><BrandMark /><div><strong>Shri Nandi</strong><small>Medicals</small></div></div>
        <nav aria-label="Main navigation">
          {navigationItems.map((item) => {
            const destination = routeFor(item)
            const isActive = location.pathname === destination || location.pathname.startsWith(`${destination}/`)
            return <button key={item} type="button" className={`nav-item${isActive ? ' active' : ''}`} onClick={() => { navigate(destination); setMenuOpen(false) }}>{item}</button>
          })}
        </nav>
      </aside>
      <div className="app-body">
        <header className="header"><button className="mobile-menu-button" type="button" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>☰</button><div className="header-brand"><BrandMark compact /><div><p className="eyebrow">Single-store operations</p><h1>Shri Nandi Medicals</h1></div></div><div className="header-account"><div className="account-details"><strong>{user?.name}</strong><small>{user?.role}</small></div><button className="logout-button" onClick={() => void handleLogout()}>Logout</button></div></header>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  )
}
