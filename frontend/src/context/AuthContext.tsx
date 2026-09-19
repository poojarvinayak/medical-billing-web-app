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
    // #region agent log
    fetch('http://127.0.0.1:7299/ingest/4add0374-c4a5-474b-ac4f-8335f0436b39',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'40ba18'},body:JSON.stringify({sessionId:'40ba18',runId:'pre-fix',hypothesisId:'H1-H5',location:'AuthContext.tsx:login:start',message:'login attempt started',data:{apiBaseUrl:import.meta.env.VITE_API_BASE_URL??'fallback-localhost:5000',emailProvided:Boolean(email),passwordLength:password.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    try {
      const response = await api.post<{ user: AuthUser }>('/auth/login', { email, password })
      // #region agent log
      fetch('http://127.0.0.1:7299/ingest/4add0374-c4a5-474b-ac4f-8335f0436b39',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'40ba18'},body:JSON.stringify({sessionId:'40ba18',runId:'pre-fix',hypothesisId:'H4',location:'AuthContext.tsx:login:success',message:'login API success',data:{status:response.status,hasUser:Boolean(response.data?.user),userEmail:response.data?.user?.email??null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setUser(response.data.user)
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } }; code?: string; message?: string }
      // #region agent log
      fetch('http://127.0.0.1:7299/ingest/4add0374-c4a5-474b-ac4f-8335f0436b39',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'40ba18'},body:JSON.stringify({sessionId:'40ba18',runId:'pre-fix',hypothesisId:'H1-H3',location:'AuthContext.tsx:login:error',message:'login API failed',data:{status:axiosError.response?.status??null,apiMessage:axiosError.response?.data?.message??null,code:axiosError.code??null,errorMessage:axiosError.message??null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      throw error
    }
  }, [])

  const logout = useCallback(async () => { await api.post('/auth/logout'); setUser(null) }, [])

  const value = useMemo(() => ({ user, loading, isAuthenticated: Boolean(user), login, logout, refreshUser }), [user, loading, login, logout, refreshUser])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context }
