// src/App.jsx
// Route fix: /employees/add → /employees/new
// This prevents React Router from ambiguously matching "add" as an empId param.

import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider }   from './context/ThemeContext'
import { AuthProvider }    from './context/AuthContext'
import ProtectedRoute      from './components/auth/ProtectedRoute'
import RoleRoute           from './components/auth/RoleRoute'
import AppLayout           from './components/layout/AppLayout'

import LandingPage          from './pages/LandingPage'
import LoginPage            from './pages/LoginPage'
import DashboardPage        from './pages/DashboardPage'
import EmployeesPage        from './pages/EmployeesPage'
import ProfilePage          from './pages/ProfilePage'
import SettingsPage         from './pages/SettingsPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"      element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>

              {/* All authenticated */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile"   element={<ProfilePage />} />
              <Route path="/settings"  element={<SettingsPage />} />

              {/* ADMIN + MANAGER */}
              <Route element={<RoleRoute roles={['ADMIN', 'MANAGER']} />}>
                <Route path="/employees" element={<EmployeesPage />} />
              </Route>

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
