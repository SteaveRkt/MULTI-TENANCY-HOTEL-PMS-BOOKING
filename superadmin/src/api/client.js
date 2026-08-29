import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('superadmin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRequest = err.config?.url?.includes('/api/auth/login')

    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('superadmin_token')
      localStorage.removeItem('superadmin_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export function getApiErrorMessage(err, fallback = 'Une erreur est survenue.') {
  if (!err) return fallback
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = d.loc ? d.loc[d.loc.length - 1] : ''
        return field ? `${field}: ${d.msg}` : d.msg
      })
      .join(' | ')
  }
  if (err.response?.data?.message) return err.response.data.message
  if (err.message === 'Network Error') {
    return "Impossible de joindre le serveur. Vérifiez que le backend FastAPI est lancé sur le port 8000."
  }
  return err.message || fallback
}

export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
}

export const superAdminAPI = {
  getStats: () => api.get('/api/super-admin/stats'),
  getHotels: (params) => api.get('/api/super-admin/hotels', { params }),
  createHotel: (data) => api.post('/api/super-admin/hotels', data),
  updateHotel: (id, data) => api.put(`/api/super-admin/hotels/${id}`, data),
  deleteHotel: (id) => api.delete(`/api/super-admin/hotels/${id}`),
  getUsers: (params) => api.get('/api/super-admin/users', { params }),
  toggleUserStatus: (id) => api.patch(`/api/super-admin/users/${id}/status`),
  getReservations: (params) => api.get('/api/super-admin/reservations', { params }),
}

export default api
