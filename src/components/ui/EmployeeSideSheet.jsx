import { motion } from 'framer-motion'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { employeeAPI, roleAPI, authAPI } from '../../api'
import ConfirmDialog from './ConfirmDialog'
import RoleManagement from './RoleManagement'
import EmployeeHero from '../employee/EmployeeHero'
import ContactInfo from '../employee/ContactInfo'
import { AlertCircle, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/dateUtils'
import { parseApiError } from '../../utils/errorUtils'
import FocusTrap from 'focus-trap-react'
import { useUIStore } from '../../store/uiStore'
import '../../styles/employee-detail.css'

const ALL_ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE']

const DEPARTMENTS = [
  'DEVELOPMENT','FINANCE','DESIGN','HR','SALES','MARKETING','SUPPORT',
  'ADMINISTRATION','HOSPITALITY','PROCUREMENT','QUALITY ASSURANCE','TRAINING',
  'SECURITY','MAINTENANCE','CUSTOMER CARE','BUSINESS DEVELOPMENT','STRATEGY','EXECUTIVE LEADERSHIP',
]

const SKILL_SUGGESTIONS = [
  'JavaScript','TypeScript','React','Angular','Vue.js','Node.js','Python','Java',
  'Spring Boot','SQL','PostgreSQL','MongoDB','Docker','Kubernetes','AWS','Azure',
  'Git','REST APIs','GraphQL','Leadership','Communication','Team Management',
  'Project Management','Problem Solving','Agile','Scrum','Jira','Figma','Photoshop',
  'Accounting','Excel','Power BI','Tableau','SEO','Content Writing',
  'Customer Service','Sales','Negotiation','Training & Development',
]

export default function EmployeeSideSheet({ empId, isInactiveView, onClose }) {
  const navigate       = useNavigate()
  const { user, isAdmin, isManager } = useAuth()
  const qc = useQueryClient()
  const { isChatOpen, chatWidth, sideSheetWidth, setSideSheetWidth } = useUIStore()
  const isResizing = useRef(false)

  const startResize = () => {
    isResizing.current = true
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', endResize)
  }
  const handleResize = (e) => {
    if (!isResizing.current) return
    const rightEdge = isChatOpen ? chatWidth : 0
    const newWidth = window.innerWidth - e.clientX - rightEdge
    if (newWidth >= 400 && newWidth <= window.innerWidth * 0.7) setSideSheetWidth(newWidth)
  }
  const endResize = () => {
    isResizing.current = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', endResize)
  }

  const [deleteOpen,     setDeleteOpen]     = useState(false)
  const [assignRoleOpen, setAssignRoleOpen] = useState(false)
  const [removeRoleOpen, setRemoveRoleOpen] = useState(false)
  const [assignRole,     setAssignRole]     = useState('')
  const [removeRole,     setRemoveRole]     = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employee', empId, isInactiveView],
    queryFn: () => isInactiveView ? employeeAPI.getInactiveById(empId) : employeeAPI.getById(empId),
    retry: (count, err) => [403, 404].includes(err?.response?.status) ? false : count < 2,
  })

  const { data: rolesData } = useQuery({
    queryKey: ['employee-roles', empId],
    queryFn: () => roleAPI.getRoles(empId),
    enabled: !!empId && isAdmin() && !isInactiveView,
    retry: 1,
  })

  const employee        = data?.data
  const currentRoles    = rolesData?.data || []
  const assignableRoles = ALL_ROLES.filter(r => !currentRoles.includes(r))
  const removableRoles  = ALL_ROLES.filter(r =>  currentRoles.includes(r))
  const isSelf          = user?.empId === employee?.empId

  const canEdit = !isInactiveView && (isAdmin() || (isManager() && employee?.department === user?.department) || isSelf)

  const updateMutation = useMutation({
    mutationFn: (updates) => employeeAPI.update(empId, updates),
    onMutate: async (updates) => {
      // Optimistic upate for instant UI feedback (crucial for TagInput race conditions)
      await qc.cancelQueries({ queryKey: ['employee', empId, isInactiveView] })
      const previous = qc.getQueryData(['employee', empId, isInactiveView])
      
      qc.setQueryData(['employee', empId, isInactiveView], old => {
        if (!old) return old
        return {
          ...old,
          data: { ...old.data, ...updates }
        }
      })
      
      return { previous }
    },
    onSuccess: () => {
      // Background validation
      qc.invalidateQueries({ queryKey: ['employee', empId] })
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (err, updates, context) => {
      // Rollback on failure
      if (context?.previous) {
        qc.setQueryData(['employee', empId, isInactiveView], context.previous)
      }
      toast.error(parseApiError(err, 'Failed to update employee details'))
    }
  })

  // Patching helpers
  const patch = (field) => async (val) => await updateMutation.mutateAsync({ [field]: val })
  const patchArray = (field) => async (arr) => await updateMutation.mutateAsync({ [field]: arr.join(', ') })
  const splitCsv = (str) => str?.split(',').map(s => s.trim()).filter(Boolean) || []

  const deleteMutation = useMutation({
    mutationFn: () => employeeAPI.delete(empId),
    onSuccess: () => {
      toast.success('Employee deactivated')
      qc.invalidateQueries({ queryKey: ['employees'] })
      setDeleteOpen(false)
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err, 'Failed to deactivate employee'))
  })

  const assignMutation = useMutation({
    mutationFn: (role) => roleAPI.assign(empId, role),
    onSuccess: () => {
      toast.success('Role assigned')
      qc.invalidateQueries({ queryKey: ['employee-roles', empId] })
      setAssignRoleOpen(false)
      setAssignRole('')
    },
    onError: (err) => toast.error(parseApiError(err, 'Failed to assign role'))
  })

  const removeMutation = useMutation({
    mutationFn: (role) => roleAPI.remove(empId, role),
    onSuccess: () => {
      toast.success('Role removed')
      qc.invalidateQueries({ queryKey: ['employee-roles', empId] })
      setRemoveRoleOpen(false)
      setRemoveRole('')
    },
    onError: (err) => toast.error(parseApiError(err, 'Failed to remove role'))
  })

  const resetPwdMutation = useMutation({
    mutationFn: () => authAPI.resetPassword(empId),
    onSuccess: () => toast.success('Temporary password sent to employee email'),
    onError: (err) => toast.error(parseApiError(err, 'Failed to reset password'))
  })

  if (isLoading) {
    return (
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="glass-panel"
        style={{ position: 'fixed', top: 'var(--topnav-height)', right: isChatOpen ? chatWidth : 0, bottom: 0, width: `${sideSheetWidth}px`, maxWidth: '90vw', zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center', borderLeft: '1px solid var(--border)', transition: 'right 0.3s ease' }}
      >
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </motion.div>
    )
  }

  if (error || !employee) {
    const status = error?.response?.status
    const message = status === 404 ? 'Employee not found.'
      : status === 403 ? 'You do not have permission to view this employee.'
      : parseApiError(error, 'Failed to load employee details.')
    return (
      <FocusTrap focusTrapOptions={{ initialFocus: false, escapeDeactivates: false, clickOutsideDeactivates: true }}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Employee Error"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="glass-panel"
        style={{ position: 'fixed', top: 'var(--topnav-height)', right: isChatOpen ? chatWidth : 0, bottom: 0, width: `${sideSheetWidth}px`, maxWidth: '90vw', zIndex: 1050, padding: 40, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'right 0.3s ease' }}
      >
        <div className="empty-state">
          <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
          <h3>Could not load employee</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 320, textAlign: 'center' }}>{message}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}><RefreshCw size={14} /> Retry</button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /> Close</button>
          </div>
        </div>
      </motion.div>
      </FocusTrap>
    )
  }

  const initials    = employee.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const departments  = splitCsv(employee.department)
  const designations = splitCsv(employee.designation)
  const skills       = splitCsv(employee.skills)

  return (
    <FocusTrap focusTrapOptions={{ initialFocus: false, escapeDeactivates: false, clickOutsideDeactivates: true }}>
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${employee.name} details`}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="employee-detail-page glass-panel"
      style={{
        position: 'fixed',
        top: 'var(--topnav-height)',
        right: isChatOpen ? chatWidth : 0,
        bottom: 0,
        width: `${sideSheetWidth}px`,
        maxWidth: '90vw',
        zIndex: 1050,
        overflowY: 'hidden',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        borderLeft: '1px solid var(--border)',
        padding: '0',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'right 0.3s ease',
      }}
    >
      {/* Resize handle — Keyboard and Mouse supported */}
      <div
        onMouseDown={startResize}
        tabIndex={0}
        role="separator"
        aria-label="Resize employee profile panel"
        aria-orientation="vertical"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setSideSheetWidth(w => Math.min(w + 20, window.innerWidth * 0.7))
          if (e.key === 'ArrowRight') setSideSheetWidth(w => Math.max(w - 20, 400))
        }}
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 8,
          cursor: 'ew-resize', zIndex: 20,
          background: 'transparent',
          outline: 'none'
        }}
        className="resize-handle"
      />

      {/* ── Enterprise Header — flex-shrink-0 so it never scrolls away */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        zIndex: 10,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isInactiveView ? 'var(--danger)' : 'var(--success)',
            boxShadow: `0 0 8px ${isInactiveView ? 'var(--danger)' : 'var(--success)'}`
          }} />
          Employee Profile
        </h2>
        <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close (Esc)" style={{ padding: 6 }}>
          <X size={16} />
        </button>
      </div>

      {/* ── Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

      <EmployeeHero
        employee={employee}
        initials={initials}
        departments={departments}
        currentRoles={currentRoles}
        canEdit={canEdit}
        isAdmin={isAdmin}
        isInactiveView={isInactiveView}
        isSelf={isSelf}
        assignableRoles={assignableRoles}
        removableRoles={removableRoles}
        resetPwdMutation={resetPwdMutation}
        patch={patch}
        setAssignRole={setAssignRole}
        setAssignRoleOpen={setAssignRoleOpen}
        setRemoveRole={setRemoveRole}
        setRemoveRoleOpen={setRemoveRoleOpen}
        setDeleteOpen={setDeleteOpen}
      />

      <ContactInfo
        employee={employee}
        canEdit={canEdit}
        isInactiveView={isInactiveView}
        patch={patch}
        patchArray={patchArray}
        departments={departments}
        designations={designations}
        skills={skills}
        formatDate={formatDate}
        DEPARTMENTS={DEPARTMENTS}
        SKILL_SUGGESTIONS={SKILL_SUGGESTIONS}
      />

      {!isInactiveView && (
        <RoleManagement
          empId={empId}
          currentRoles={currentRoles}
          allRoles={ALL_ROLES}
          onAssign={(role) => assignMutation.mutate(role)}
          onRemove={(role) => removeMutation.mutate(role)}
          assignOpen={assignRoleOpen}
          setAssignOpen={setAssignRoleOpen}
          removeOpen={removeRoleOpen}
          setRemoveOpen={setRemoveRoleOpen}
          assignRole={assignRole}
          setAssignRole={setAssignRole} // Fixed: from setSortField to setAssignRole
          removeRole={removeRole}
          setRemoveRole={setRemoveRole}
          loading={assignMutation.isPending || removeMutation.isPending}
        />
      )}

      {/* Warning Modals */}
      {!isInactiveView && !isSelf && (
        <ConfirmDialog
          open={deleteOpen} onClose={() => setDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
          title="Deactivate Employee"
          message={`Are you sure you want to deactivate ${employee.name}? They will lose system access immediately.`}
          confirmLabel="Deactivate" danger loading={deleteMutation.isPending}
        />
      )}
      </div>
    </motion.div>
    </FocusTrap>
  )
}
