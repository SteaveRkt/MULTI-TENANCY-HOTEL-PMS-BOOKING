import axios from 'axios'

const rawBaseURL = import.meta.env.VITE_API_URL || ''
const baseURL = rawBaseURL.replace(/\/+$/, '')

const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hotel_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Avoid redirecting when login or register requests fail
    const isAuthRequest =
      err.config?.url?.includes('/api/auth/login') ||
      err.config?.url?.includes('/api/auth/register')

    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('hotel_token')
      localStorage.removeItem('hotel_user')
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
  register: (data) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
}

export const dashboardAPI = {
  getStats: (params) => api.get('/api/dashboard/stats', { params }),
  getMonthlyKpi: (params) => api.get('/api/dashboard/monthly-kpi', { params }),
  getRoomsStatus: (params) => api.get('/api/dashboard/rooms-status', { params }),
}

export const roomsAPI = {
  list: (params) => api.get('/api/rooms', { params }),
  create: (data) => api.post('/api/rooms', data),
  update: (id, data) => api.put(`/api/rooms/${id}`, data),
  remove: (id) => api.delete(`/api/rooms/${id}`),
  available: (params) => api.get('/api/rooms/available', { params }),
}

export const reservationsAPI = {
  list: (params) => api.get('/api/reservations', { params }),
  create: (data) => api.post('/api/reservations', data),
  update: (id, data) => api.put(`/api/reservations/${id}`, data),
  updateStatus: (id, status) => api.patch(`/api/reservations/${id}/status`, { status }),
  addPayment: (id, data) => api.post(`/api/reservations/${id}/payment`, data),
  getInvoice: (id) => api.get(`/api/reservations/${id}/invoice`, { responseType: 'blob' }),
  cancel: (id) => api.post(`/api/reservations/${id}/cancel`),
}

export const customersAPI = {
  list: (params) => api.get('/api/customers', { params }),
  create: (data) => api.post('/api/customers', data),
  update: (id, data) => api.put(`/api/customers/${id}`, data),
  remove: (id) => api.delete(`/api/customers/${id}`),
}

export const usersAPI = {
  list: () => api.get('/api/users'),
  create: (data) => api.post('/api/users', data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  remove: (id) => api.delete(`/api/users/${id}`),
}

export const publicAPI = {
  getHotels: () => api.get('/api/public/hotels'),
  getAvailableRooms: (params) => api.get('/api/public/rooms/available', { params }),
  createReservation: (data) => api.post('/api/public/reservations', data),
  getReservation: (code) => api.get(`/api/public/reservations/${code}`),
  cancelReservation: (code) => api.post(`/api/public/reservations/${code}/cancel`),
  payReservation: (code, data) => api.post(`/api/public/reservations/${code}/payment`, data),
  getInvoice: (code) => api.get(`/api/public/reservations/${code}/invoice`, { responseType: 'blob' }),
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
