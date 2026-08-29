import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('superadmin_token'))
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('superadmin_user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      authAPI
        .me()
        .then((res) => {
          if (res.data.role !== 'SUPER_ADMIN') {
            throw new Error('Unauthorized role')
          }
          setUser(res.data)
          localStorage.setItem('superadmin_user', JSON.stringify(res.data))
        })
        .catch(() => {
          localStorage.removeItem('superadmin_token')
          localStorage.removeItem('superadmin_user')
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
        const meRes = await authAPI.me()
        userObj = meRes.data
      }

      if (userObj.role !== 'SUPER_ADMIN') {
        throw new Error("Accès refusé. Ce portail est strictement réservé aux Super Administrateurs.")
      }

      localStorage.setItem('superadmin_token', access_token)
      localStorage.setItem('superadmin_user', JSON.stringify(userObj))
      setToken(access_token)
      setUser(userObj)
      return userObj
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('superadmin_token')
    localStorage.removeItem('superadmin_user')
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = !!token && user?.role === 'SUPER_ADMIN'

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
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
