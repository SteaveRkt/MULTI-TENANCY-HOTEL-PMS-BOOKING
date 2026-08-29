import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('hotel_token'))
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('hotel_user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  // On mount or token change, fetch user profile to keep hotel_name and data in sync
  useEffect(() => {
    if (token) {
      authAPI
        .me()
        .then((res) => {
          if (res.data.role === 'SUPER_ADMIN') {
            localStorage.removeItem('hotel_token')
            localStorage.removeItem('hotel_user')
            setToken(null)
            setUser(null)
            return
          }
          setUser(res.data)
          localStorage.setItem('hotel_user', JSON.stringify(res.data))
        })
        .catch(() => {
          localStorage.removeItem('hotel_token')
          localStorage.removeItem('hotel_user')
          setToken(null)
          setUser(null)
        })
    }
  }, [token])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const res = await authAPI.login({ email, password })
      const { access_token, user: userData } = res.data

      let userObj = userData
      if (!userObj) {
        // Fallback: fetch profile from /api/auth/me
        const meRes = await authAPI.me()
        userObj = meRes.data
      }

      if (userObj.role === 'SUPER_ADMIN') {
        throw new Error(
          "Accès refusé. Les comptes Super Admin ne peuvent pas se connecter à l'espace de gestion hôtelière. Veuillez vous connecter sur le portail Super Admin."
        )
      }

      localStorage.setItem('hotel_token', access_token)
      setToken(access_token)
      localStorage.setItem('hotel_user', JSON.stringify(userObj))
      setUser(userObj)
      return userObj
    } finally {
      setLoading(false)
    }
  }, [])

  const registerHotel = useCallback(async (data) => {
    setLoading(true)
    try {
      const res = await authAPI.register(data)
      let { access_token, user: userData } = res.data || {}

      // If backend returns access_token directly
      if (access_token) {
        localStorage.setItem('hotel_token', access_token)
        setToken(access_token)
      } else {
        // Auto-login if token was not directly in register response
        const loginRes = await authAPI.login({ email: data.email, password: data.password })
        access_token = loginRes.data.access_token
        userData = loginRes.data.user
        localStorage.setItem('hotel_token', access_token)
        setToken(access_token)
      }

      if (!userData) {
        const meRes = await authAPI.me()
        userData = meRes.data
      }

      localStorage.setItem('hotel_user', JSON.stringify(userData))
      setUser(userData)
      return userData
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('hotel_token')
    localStorage.removeItem('hotel_user')
    setToken(null)
    setUser(null)
  }, [])

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isAdmin = user?.role === 'ADMIN'
  const isReceptionist = user?.role === 'RECEPTIONIST'
  const isAuthenticated = !!token && user?.role !== 'SUPER_ADMIN'

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        registerHotel,
        isSuperAdmin,
        isAdmin,
        isReceptionist,
        isAuthenticated,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
