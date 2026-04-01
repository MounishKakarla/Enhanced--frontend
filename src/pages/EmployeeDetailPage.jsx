// src/pages/EmployeeDetailPage.jsx
// Changes: non-editable fields use readOnly styling, name has hover color effect,
// separate CSS import, no mixed styles.

import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { employeeAPI, roleAPI, authAPI } from '../api'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import TagInput from '../components/ui/Taginput'
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Briefcase,
  Calendar, Trash2, ShieldPlus, ShieldMinus, RotateCcw,
  User, AlertCircle, UserX, Check, X, Pencil, RefreshCw, Star,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '../utils/dateUtils'
import { parseApiError } from '../utils/errorUtils'
import '../styles/employee-detail.css'

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

// ── Inline editable field ──────────────────────────────────────────────────────
function InlineField({ label, icon: Icon, value, onSave, disabled, multiline, danger }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value || '')
  const [saving,  setSaving]  = useState(false)

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return }
    setSaving(true)
    try   { await onSave(draft); setEditing(false) }
    catch { /* toast handled by caller */ }
    finally { setSaving(false) }
  }

  const handleCancel = () => { setDraft(value || ''); setEditing(false) }

  const iconColor = danger ? 'var(--danger)' : 'var(--text-muted)'
  const iconBg    = danger ? 'var(--danger-light)' : 'var(--bg-tertiary)'

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 32, height: 32, flexShrink: 0, marginTop: 2, background: iconBg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: danger ? 'var(--danger)' : 'var(--text-muted)', marginBottom: 3 }}>{label}</div>

        {/* Disabled / read-only display */}
        {disabled ? (
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', padding: '2px 0', wordBreak: 'break-all' }}>
            {value || <span style={{ fontStyle: 'italic', fontWeight: 400 }}>—</span>}
          </div>
        ) : editing ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            {multiline ? (
              <textarea
                className="form-input"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={2}
                autoFocus
                style={{ fontSize: 13, resize: 'vertical', padding: '6px 10px' }}
              />
            ) : (
              <input
                className="form-input"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
                autoFocus
                style={{ fontSize: 13, padding: '6px 10px' }}
              />
            )}
            <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm" style={{ padding: '6px 10px', flexShrink: 0 }}>
              {saving ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Check size={12} />}
            </button>
            <button onClick={handleCancel} className="btn btn-secondary btn-sm" style={{ padding: '6px 10px', flexShrink: 0 }}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="inline-field-row">
            <span style={{ fontSize: 14, fontWeight: 500, wordBreak: 'break-all', color: danger ? 'var(--danger)' : 'var(--text-primary)' }}>
              {value || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>—</span>}
            </span>
            <button
              onClick={() => { setDraft(value || ''); setEditing(true) }}
              className="inline-edit-btn"
              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0, padding: 2, flexShrink: 0 }}
              title={`Edit ${label}`}
            >
              <Pencil size={11} color="var(--text-muted)" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Static (non-editable) detail item ─────────────────────────────────────────
function DetailItem({ icon: Icon, label, value, danger }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 32, height: 32, flexShrink: 0, background: danger ? 'var(--danger-light)' : 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color={danger ? 'var(--danger)' : 'var(--text-muted)'} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: danger ? 'var(--danger)' : 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: danger ? 'var(--danger)' : 'inherit' }}>{value || '—'}</div>
      </div>
    </div>
  )
}

// ── Inline-editable name in hero — hover shows accent color ───────────────────
function InlineEditableName({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value || '')
  const [saving,  setSaving]  = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleSave = async () => {
    if (!draft.trim() || draft === value) { setEditing(false); return }
    setSaving(true)
    try   { await onSave(draft.trim()); setEditing(false) }
    catch { /* handled by mutation */ }
    finally { setSaving(false) }
  }

  if (editing) return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
      <input
        className="form-input"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
        autoFocus
        style={{ fontSize: 20, fontWeight: 700, padding: '4px 10px' }}
      />
      <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm" style={{ padding: '6px 10px' }}>
        {saving ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Check size={12} />}
      </button>
      <button onClick={() => setEditing(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }}>
        <X size={12} />
      </button>
    </div>
  )

  return (
    <h2
      onClick={() => { setDraft(value); setEditing(true) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Click to edit name"
      style={{
        fontSize: 22, marginBottom: 4,
        cursor: 'pointer',
        color: hovered ? 'var(--accent)' : 'var(--text-primary)',
        transition: 'color 0.15s',
        display: 'inline-flex', alignItems: 'center', gap: 8,
      }}
    >
      {value}
      <Pencil size={13} color="var(--text-muted)" style={{ opacity: hovered ? 0.7 : 0.25, transition: 'opacity 0.15s' }} />
    </h2>
  )
}

// ── Multi-value tag field (departments / designations) ─────────────────────────
function MultiValueField({ icon: Icon, label, values, onChange, suggestions, chipColor, badgeClass, canEdit, allowCustom }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 32, height: 32, background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <Icon size={14} color="var(--text-muted)" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
        {canEdit ? (
          <TagInput
            values={values} onChange={onChange} suggestions={suggestions}
            placeholder={`Search or add ${label.toLowerCase()}…`}
            chipColor={chipColor} allowCustom={allowCustom}
          />
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {values.length > 0
              ? values.map(v => <span key={v} className={`badge ${badgeClass}`}>{v}</span>)
              : <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>—</span>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EmployeeDetailPage() {
  const { empId }      = useParams()
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const isInactiveView = searchParams.get('inactive') === 'true'

  const { user, isAdmin, isManager } = useAuth()
  const qc = useQueryClient()

  const [deleteOpen,     setDeleteOpen]     = useState(false)
  const [assignRoleOpen, setAssignRoleOpen] = useState(false)
  const [removeRoleOpen, setRemoveRoleOpen] = useState(false)
  const [assignRole,     setAssignRole]     = useState('')
  const [removeRole,     setRemoveRole]     = useState('')

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // ── Mutations ──────────────────────────────────────────────────────────────
  const patchMutation = useMutation({
    mutationFn: (fields) => employeeAPI.update(empId, fields),
    onSuccess: () => {
      toast.success('Saved')
      qc.invalidateQueries({ queryKey: ['employee', empId] })
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (err) => toast.error(parseApiError(err, 'Failed to update')),
  })

  const patch      = (field) => async (value) => { await patchMutation.mutateAsync({ [field]: value }) }
  const patchArray = (field) => async (vals)  => { await patchMutation.mutateAsync({ [field]: vals.join(',') }) }

  const deleteMutation = useMutation({
    mutationFn: () => employeeAPI.delete(empId),
    onSuccess: () => {
      toast.success('Employee deactivated')
      qc.invalidateQueries({ queryKey: ['employees'] })
      navigate('/employees')
    },
    onError: (err) => toast.error(parseApiError(err, 'Failed to deactivate')),
  })

  const assignMutation = useMutation({
    mutationFn: (role) => roleAPI.assign(empId, role),
    onSuccess: (_, role) => {
      toast.success(`Role ${role} assigned`)
      qc.invalidateQueries({ queryKey: ['employee-roles', empId] })
      setAssignRoleOpen(false); setAssignRole('')
    },
    onError: (err) => toast.error(parseApiError(err, 'Failed to assign role')),
  })

  const removeMutation = useMutation({
    mutationFn: (role) => roleAPI.remove(empId, role),
    onSuccess: (_, role) => {
      toast.success(`Role ${role} removed`)
      qc.invalidateQueries({ queryKey: ['employee-roles', empId] })
      setRemoveRoleOpen(false); setRemoveRole('')
    },
    onError: (err) => toast.error(parseApiError(err, 'Failed to remove role')),
  })

  const resetPwdMutation = useMutation({
    mutationFn: () => authAPI.resetPassword(empId),
    onSuccess: () => toast.success('Password reset email sent'),
    onError: (err) => toast.error(parseApiError(err, 'Failed to reset password')),
  })

  const handleBack = () => isInactiveView ? navigate('/employees/inactive') : navigate('/employees')
  const canEdit    = !isInactiveView && (isAdmin() || isManager())

  // ── States ─────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  if (error || !employee) {
    const status  = error?.response?.status
    const message = status === 404 ? 'Employee not found.'
      : status === 403 ? 'You do not have permission to view this employee.'
      : parseApiError(error, 'Failed to load employee details.')
    return (
      <div className="empty-state">
        <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
        <h3>Could not load employee</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 320, textAlign: 'center' }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => refetch()}><RefreshCw size={14} /> Retry</button>
          <button className="btn btn-secondary btn-sm" onClick={handleBack}><ArrowLeft size={14} /> Go Back</button>
        </div>
      </div>
    )
  }

  const initials    = employee.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const departments  = splitCsv(employee.department)
  const designations = splitCsv(employee.designation)
  const skills       = splitCsv(employee.skills)

  return (
    <div className="employee-detail-page">

      <button className="btn btn-ghost btn-sm" onClick={handleBack} style={{ width: 'fit-content' }}>
        <ArrowLeft size={14} />
        {isInactiveView ? 'Back to Inactive Employees' : 'Back to Employees'}
      </button>

      {/* Hero */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="avatar avatar-xl" style={{
              background: isInactiveView ? 'var(--bg-tertiary)' : 'var(--accent-light)',
              color: isInactiveView ? 'var(--text-muted)' : 'var(--accent)', fontSize: 28,
            }}>
              {initials}
            </div>

            <div>
              {canEdit
                ? <InlineEditableName value={employee.name} onSave={patch('name')} />
                : <h2 style={{ fontSize: 22, marginBottom: 4 }}>{employee.name}</h2>}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {departments.map(d => (
                  <span key={d} className={`badge ${isInactiveView ? 'badge-neutral' : 'badge-info'}`}>{d}</span>
                ))}
                {isInactiveView && (
                  <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <UserX size={11} /> Deactivated
                  </span>
                )}
              </div>

              {!isInactiveView && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {currentRoles.length > 0
                    ? currentRoles.map(r => <span key={r} className={`badge role-${r.toLowerCase()}`}>{r}</span>)
                    : <span className="badge badge-neutral">No roles assigned</span>}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {canEdit && isAdmin() && (
            <div className="detail-hero-actions">
              <button className="btn btn-secondary btn-sm"
                onClick={() => { setAssignRole(''); setAssignRoleOpen(true) }}
                disabled={assignableRoles.length === 0}>
                <ShieldPlus size={13} /> Assign Role
              </button>
              <button className="btn btn-secondary btn-sm"
                onClick={() => { setRemoveRole(''); setRemoveRoleOpen(true) }}
                disabled={removableRoles.length === 0}>
                <ShieldMinus size={13} /> Remove Role
              </button>
              <button className="btn btn-secondary btn-sm"
                onClick={() => resetPwdMutation.mutate()}
                disabled={resetPwdMutation.isPending}>
                {resetPwdMutation.isPending
                  ? <span className="spinner" style={{ width: 13, height: 13 }} />
                  : <RotateCcw size={13} />}
                {resetPwdMutation.isPending ? 'Sending…' : 'Reset Password'}
              </button>

              {!isSelf && (
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}>
                  <Trash2 size={13} /> Deactivate
                </button>
              )}

              {isSelf && (
                <div className="self-warning">
                  You cannot deactivate your own account
                </div>
              )}
            </div>
          )}

          {isInactiveView && (
            <div style={{ padding: '8px 16px', background: 'var(--danger-light)', borderRadius: 8, fontSize: 13, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserX size={14} /> Read-only — account deactivated
            </div>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 className="card-title">Contact Information</h3>
            {canEdit && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click value to edit</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Company email — always read-only */}
            <InlineField icon={Mail}   label="Company Email"  value={employee.companyEmail} disabled />
            <InlineField icon={Mail}   label="Personal Email" value={employee.personalEmail}
              onSave={patch('personalEmail')} disabled={!canEdit} />
            <InlineField icon={Phone}  label="Phone"          value={employee.phoneNumber}
              onSave={patch('phoneNumber')} disabled={!canEdit} />
            <InlineField icon={MapPin} label="Address"        value={employee.address}
              onSave={patch('address')} disabled={!canEdit} multiline />
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Employment Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <DetailItem icon={User} label="Employee ID" value={employee.empId} />
            <MultiValueField
              icon={Building2} label={`Department${departments.length !== 1 ? 's' : ''}`}
              values={departments}
              onChange={canEdit ? async (vals) => { try { await patchArray('department')(vals) } catch {} } : null}
              suggestions={DEPARTMENTS} chipColor="info" badgeClass="badge-info"
              canEdit={canEdit} allowCustom={false}
            />
            <MultiValueField
              icon={Briefcase} label={`Designation${designations.length !== 1 ? 's' : ''}`}
              values={designations}
              onChange={canEdit ? async (vals) => { try { await patchArray('designation')(vals) } catch {} } : null}
              suggestions={[]} chipColor="accent" badgeClass="badge-accent"
              canEdit={canEdit} allowCustom
            />
            <DetailItem icon={Calendar} label="Date of Joining" value={formatDate(employee.dateOfJoin)} />
            {employee.dateOfBirth && (
              <DetailItem icon={Calendar} label="Date of Birth" value={formatDate(employee.dateOfBirth)} />
            )}
            {isInactiveView && employee.dateOfExit && (
              <DetailItem icon={Calendar} label="Date of Exit" value={formatDate(employee.dateOfExit)} danger />
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--success-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={14} color="var(--success)" />
            </div>
            <h3 className="card-title" style={{ margin: 0 }}>Skills</h3>
          </div>
          {canEdit && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Type to search or add custom skills</span>}
        </div>
        {canEdit ? (
          <TagInput
            values={skills}
            onChange={async (vals) => { try { await patchArray('skills')(vals) } catch {} }}
            suggestions={SKILL_SUGGESTIONS}
            placeholder="Search or add skills…"
            chipColor="success"
            allowCustom
          />
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {skills.length > 0
              ? skills.map(s => <span key={s} className="skill-chip">{s}</span>)
              : <span style={{ color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic' }}>No skills recorded.</span>}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 14 }}>Description / Notes</h3>
        {canEdit ? (
          <InlineField
            icon={User} label="" value={employee.description}
            onSave={patch('description')} disabled={false} multiline
          />
        ) : (
          <p style={{ color: employee.description ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight: 1.7, fontStyle: employee.description ? 'normal' : 'italic' }}>
            {employee.description || 'No description available.'}
          </p>
        )}
      </div>

      {/* Modals */}
      {!isInactiveView && (
        <>
          <Modal open={assignRoleOpen} onClose={() => { setAssignRoleOpen(false); setAssignRole('') }}
            title="Assign Role"
            footer={
              <>
                <button className="btn btn-secondary" onClick={() => { setAssignRoleOpen(false); setAssignRole('') }}>Cancel</button>
                <button className="btn btn-primary" onClick={() => assignMutation.mutate(assignRole)}
                  disabled={!assignRole || assignMutation.isPending}>
                  {assignMutation.isPending ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Assigning…</> : 'Assign Role'}
                </button>
              </>
            }>
            {assignableRoles.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Employee already has all available roles.</p>
            ) : (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Role to Assign</label>
                <select className="form-select" value={assignRole} onChange={e => setAssignRole(e.target.value)}>
                  <option value="">Choose a role…</option>
                  {assignableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Currently assigned: {currentRoles.length > 0 ? currentRoles.join(', ') : 'none'}
                </p>
              </div>
            )}
          </Modal>

          <Modal open={removeRoleOpen} onClose={() => { setRemoveRoleOpen(false); setRemoveRole('') }}
            title="Remove Role"
            footer={
              <>
                <button className="btn btn-secondary" onClick={() => { setRemoveRoleOpen(false); setRemoveRole('') }}>Cancel</button>
                <button className="btn btn-danger" onClick={() => removeMutation.mutate(removeRole)}
                  disabled={!removeRole || removeMutation.isPending}>
                  {removeMutation.isPending ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Removing…</> : 'Remove Role'}
                </button>
              </>
            }>
            {removableRoles.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No roles assigned to remove.</p>
            ) : (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Role to Remove</label>
                <select className="form-select" value={removeRole} onChange={e => setRemoveRole(e.target.value)}>
                  <option value="">Choose a role…</option>
                  {removableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Currently assigned: {currentRoles.join(', ')}
                </p>
              </div>
            )}
          </Modal>

          {!isSelf && (
            <ConfirmDialog
              open={deleteOpen} onClose={() => setDeleteOpen(false)}
              onConfirm={() => deleteMutation.mutate()}
              title="Deactivate Employee"
              message={`Are you sure you want to deactivate ${employee.name}? They will lose system access immediately.`}
              confirmLabel="Deactivate" danger loading={deleteMutation.isPending}
            />
          )}
        </>
      )}
    </div>
  )
}

function splitCsv(str) {
  if (!str) return []
  return str.split(',').map(s => s.trim()).filter(Boolean)
}
