// src/components/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  // Don't redirect while the initial /auth/me check is still in flight
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
