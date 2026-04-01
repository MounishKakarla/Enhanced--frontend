// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api'
import { useSessionTimeout } from '../hooks/useSessionTimeout'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [isWarning, setIsWarning] = useState(false)

  // Verify cookie on app load
  useEffect(() => {
    // Fail-safe: if /auth/me hangs for > 5s, proceed as unauthenticated to let user log in
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false)
        console.warn('Auth check timed out — proceeding to login form.')
      }
    }, 5000)

    authAPI.me()
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => {
        clearTimeout(timer)
        setLoading(false)
      })
  }, [])

  const login = async (credentials) => {
    await authAPI.login(credentials)
    const res = await authAPI.me()
    setUser(res.data)
  }

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch { /* proceed anyway */ }
    finally { setUser(null); setIsWarning(false) }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      await authAPI.refresh()
      setIsWarning(false)
      toast.success('Session extended successfully')
    } catch {
      logout().then(() => { window.location.href = '/login' })
    }
  }, [logout])

  // Session timeout — auto-logout after inactivity
  const handleTimeout = useCallback(() => {
    toast.error('Session expired. Please sign in again.', { duration: 5000 })
    logout().then(() => { window.location.href = '/login' })
  }, [logout])

  useSessionTimeout({ 
    onTimeout: handleTimeout, 
    onWarning: () => setIsWarning(true),
    enabled: !!user && !isWarning // Pause timeout check while warning is active to avoid multiple warnings
  })

  const hasRole   = (role) => user?.roles?.includes(role) ?? false
  const isAdmin   = ()     => hasRole('ADMIN')
  const isManager = ()     => hasRole('MANAGER')

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-primary)',
      }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      user, login, logout, refreshSession,
      hasRole, isAdmin, isManager,
      isAuthenticated: !!user,
      isLoading: loading,
      isWarning, setIsWarning
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
