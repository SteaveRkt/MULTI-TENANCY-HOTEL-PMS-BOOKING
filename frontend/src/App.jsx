import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import PublicLayout from './components/layout/PublicLayout'
import AdminLayout from './components/layout/AdminLayout'

import HomePage from './pages/public/HomePage'
import CheckoutPage from './pages/public/CheckoutPage'
import PaymentPage from './pages/public/PaymentPage'
import TrackBookingPage from './pages/public/TrackBookingPage'
import LoginPage from './pages/auth/LoginPage'

import DashboardPage from './pages/admin/DashboardPage'
import RoomsStatusGridPage from './pages/admin/RoomsStatusGridPage'
import ReservationsPage from './pages/admin/ReservationsPage'
import RoomsManagementPage from './pages/admin/RoomsManagementPage'
import CustomersPage from './pages/admin/CustomersPage'
import StaffPage from './pages/admin/StaffPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/payment/:code" element={<PaymentPage />} />
              <Route path="/track" element={<TrackBookingPage />} />
            </Route>

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin routes (protected) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="rooms-grid" element={<RoomsStatusGridPage />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="rooms" element={<RoomsManagementPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="staff" element={<StaffPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
