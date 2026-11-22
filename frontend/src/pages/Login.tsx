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
  const [showPassword, setShowPassword] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  if (!loading && isAuthenticated) return <Navigate to="/dashboard" replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setSubmitting(true)
    try { await login(email, password); setLoginSuccess(true); window.setTimeout(() => { const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'; navigate(from, { replace: true }) }, 650) }
    catch { setError('Unable to sign in. Check your email and password.') }
    finally { setSubmitting(false) }
  }

  return <main className={`login-page${loginSuccess ? ' login-success-state' : ''}`}><section className="login-card"><div className="login-brand"><span className="brand-mark login-brand-mark"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 16c4-7 10-9 14-9s10 2 14 9l-4 3c-2-4-6-6-10-6s-8 2-10 6z" fill="#f4fbf8"/><path d="M12 17c-5-1-7-5-6-9 5 1 8 4 9 9m21 0c5-1 7-5 6-9-5 1-8 4-9 9" fill="none" stroke="#f4fbf8" strokeWidth="3" strokeLinecap="round"/><path d="M16 18c1-6 5-9 8-9s7 3 8 9c3 4 4 10 2 16-2 5-6 8-10 8s-8-3-10-8c-2-6-1-12 2-16z" fill="#1b9b86" stroke="#f4fbf8" strokeWidth="1.5"/><path d="M20 21h8v4h-8zm0 10h8v4h-8zm-5-6h18v4H15z" fill="#fff"/><circle cx="19" cy="17" r="1.2" fill="#14384a"/><circle cx="29" cy="17" r="1.2" fill="#14384a"/></svg></span><div><strong>Shri Nandi</strong><small>Medicals</small></div></div><p className="eyebrow">Secure access</p><h1>Welcome back</h1><p className="login-copy">Sign in to continue to the medical store system.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg><span>{showPassword ? 'Hide' : 'Show'}</span></button></div></label>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button></form></section></main>
}
