import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const TOKEN_KEY = 'family_auth_token'
const API_BASE = '/api/auth'

function loadToken() {
  try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}

function saveToken(token, remember) {
  try {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      sessionStorage.setItem(TOKEN_KEY, token)
    }
  } catch { /* ignore */ }
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  } catch { /* ignore */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setTokenState] = useState(loadToken)

  // Auto-load user on mount
  useEffect(() => {
    const savedToken = loadToken()
    if (!savedToken) {
      setLoading(false)
      return
    }
    // Validate token with server
    fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${savedToken}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(userData => {
        if (userData) {
          setUser(userData)
          setTokenState(savedToken)
        } else {
          clearToken()
          setTokenState(null)
        }
      })
      .catch(() => {
        clearToken()
        setTokenState(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username, password, remember = false) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '登录失败')
    saveToken(data.token, remember)
    setTokenState(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (username, password, nickname, remember = false) => {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, nickname }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '注册失败')
    saveToken(data.token, remember)
    setTokenState(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
    setUser(null)
  }, [])

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
