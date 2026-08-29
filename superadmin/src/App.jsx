import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import SuperAdminLayout from './components/layout/SuperAdminLayout'
import LoginPage from './pages/auth/LoginPage'
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard'
import SuperAdminHotelsPage from './pages/hotels/SuperAdminHotelsPage'
import SuperAdminUsersPage from './pages/users/SuperAdminUsersPage'
import SuperAdminReservationsPage from './pages/reservations/SuperAdminReservationsPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Super Admin Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Super Admin Platform Routes */}
            <Route element={<SuperAdminLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/hotels" element={<SuperAdminHotelsPage />} />
              <Route path="/users" element={<SuperAdminUsersPage />} />
              <Route path="/reservations" element={<SuperAdminReservationsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
