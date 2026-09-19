import { FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './login.css'

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  if (!loading && isAuthenticated) return <Navigate to="/dashboard" replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setSubmitting(true)
    try { await login(email, password); const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'; navigate(from, { replace: true }) }
    catch { setError('Unable to sign in. Check your email and password.') }
    finally { setSubmitting(false) }
  }

  return <main className="login-page"><section className="login-card"><div className="login-brand"><span className="brand-mark">+</span><div><strong>Nandi</strong><small>Medical Store</small></div></div><p className="eyebrow">Secure access</p><h1>Welcome back</h1><p className="login-copy">Sign in to continue to the medical store system.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button></form></section></main>
}
