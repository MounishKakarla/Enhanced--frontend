// src/api/index.js
// All URLs come from .env — no hardcoded strings.

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// ── Axios instance ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 60000,
})

// ── Refresh-storm guard ────────────────────────────────────────────────────────
let isRefreshing = false
let pendingQueue = []

function processQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  )
  pendingQueue = []
}

// ── Response interceptor ───────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    const skipRetry =
      original?._retry ||
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/logout') ||
      original?.url?.includes('/auth/me')   // auth-check — don't retry, just let it fail

    // Only intercept 401 (token expired). 403 = genuinely forbidden or unauthenticated
    // (Spring Security uses Http403ForbiddenEntryPoint for anonymous requests, not 401).
    // Retrying on 403 causes an infinite refresh loop on app load.
    if (error.response?.status === 401 && !skipRetry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then(() => api(original))
      }

      original._retry = true
      isRefreshing = true

      try {
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        processQueue(null)
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError)
        // If refresh fails or returns 401/403, violently redirect to login
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api

// ── Auth APIs ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data)  => api.post('/auth/login', data),
  logout:         ()      => api.post('/auth/logout'),
  refresh:        ()      => api.post('/auth/refresh'),
  me:             ()      => api.get('/auth/me'),
  changePassword: (data)  => api.put('/auth/changePassword', data),
  resetPassword:  (empId) => api.post(`/auth/reset-password/${empId}`),
}

// ── Employee APIs ──────────────────────────────────────────────────────────────
export const employeeAPI = {
  create:          (data)        => api.post('/ems/employee', data),
  getProfile:      ()            => api.get('/ems/profile'),
  getById:         (empId)       => api.get(`/ems/employee/${empId}`),
  search:          (params)      => api.get('/ems/employees', { params }),
  getInactiveById: (empId)       => api.get(`/ems/employee/inactive/${empId}`),
  getInactive:     (params)      => api.get('/ems/employees/inactive', { params }),
  delete:          (empId)       => api.delete(`/ems/employee/${empId}`),
  update:          (empId, data) => api.patch(`/ems/update/${empId}`, data),
}

// ── Role APIs ──────────────────────────────────────────────────────────────────
export const roleAPI = {
  assign:   (empId, grantRole)  => api.post(`/ems/assign/${empId}`, null, { params: { grantRole } }),
  remove:   (empId, revokeRole) => api.post(`/ems/remove/${empId}`, null, { params: { revokeRole } }),
  getRoles: (empId)             => api.get(`/ems/roles/${empId}`),
}
