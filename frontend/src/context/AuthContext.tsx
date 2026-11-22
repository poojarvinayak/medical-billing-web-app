import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import api from '../services/api'
import type { AuthUser } from '../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try { const response = await api.get<{ user: AuthUser }>('/auth/me'); setUser(response.data.user) }
    catch { setUser(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void refreshUser() }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post<{ user: AuthUser }>('/auth/login', { email, password })
      setUser(response.data.user)
    } catch (error: unknown) {
      throw error
    }
  }, [])

  const logout = useCallback(async () => { await api.post('/auth/logout'); setUser(null) }, [])

  const value = useMemo(() => ({ user, loading, isAuthenticated: Boolean(user), login, logout, refreshUser }), [user, loading, login, logout, refreshUser])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context }
