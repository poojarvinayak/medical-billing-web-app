import { NavLink, Outlet } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './app-layout.css'

const navigationItems = ['Dashboard', 'Billing', 'Sales', 'Medicines', 'Inventory', 'Purchases', 'Customers', 'Suppliers', 'Reports', 'Settings']

const routeFor = (label: string): string => `/${label.toLowerCase()}`

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }) }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">+</span><div><strong>Nandi</strong><small>Medical Store</small></div></div>
        <nav aria-label="Main navigation">
          {navigationItems.map((item) => <NavLink key={item} to={routeFor(item)} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>{item}</NavLink>)}
        </nav>
      </aside>
      <div className="app-body">
        <header className="header"><div><p className="eyebrow">Single-store operations</p><h1>Medical Store Billing System</h1></div><div className="header-account"><div className="account-details"><strong>{user?.name}</strong><small>{user?.role}</small></div><button className="logout-button" onClick={() => void handleLogout()}>Logout</button></div></header>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  )
}
