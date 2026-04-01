// src/pages/NewEmployeePage.jsx
// Renamed from AddEmployeePage — route is now /employees/new
// This eliminates the React Router ambiguity where "add" was parsed as an :empId param.

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeAPI } from '../../api'
import {
  ArrowLeft, AlertCircle, CheckCircle, User, Mail,
  Phone, MapPin, Building2, Briefcase, Calendar, Star, FileText,
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/dateUtils'
import { parseApiError } from '../../utils/errorUtils'
import TagInput from './Taginput'
import ResumeUploadButton from './ResumeUploadButton'
import FocusTrap from 'focus-trap-react'
import { BaseInput, BaseTextarea, FormField } from './BaseComponents'
import '../../styles/new-employee.css'

const DEPARTMENTS = [
  'DEVELOPMENT', 'FINANCE', 'DESIGN', 'HR', 'SALES', 'MARKETING',
  'SUPPORT', 'ADMINISTRATION', 'HOSPITALITY', 'PROCUREMENT',
  'QUALITY ASSURANCE', 'TRAINING', 'SECURITY', 'MAINTENANCE',
  'CUSTOMER CARE', 'BUSINESS DEVELOPMENT', 'STRATEGY', 'EXECUTIVE LEADERSHIP',
]

const SKILL_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js',
  'Python', 'Java', 'Spring Boot', 'SQL', 'PostgreSQL', 'MongoDB',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'REST APIs', 'GraphQL',
  'Leadership', 'Communication', 'Team Management', 'Project Management',
  'Problem Solving', 'Agile', 'Scrum', 'Jira', 'Figma', 'Photoshop',
  'Accounting', 'Excel', 'Power BI', 'Tableau', 'SEO', 'Content Writing',
  'Customer Service', 'Sales', 'Negotiation', 'Training & Development',
]

const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE']
const STEPS = ['Personal Info', 'Employment & Skills', 'Roles', 'Review']

const STEP_FIELDS = [
  ['name', 'personalEmail', 'companyEmail', 'phoneNumber', 'address'],
  ['dateOfJoin', 'dateOfBirth'],
  [],
  [],
]

export default function NewEmployeeSheet({ onClose }) {
  const queryClient = useQueryClient()
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

  const [step,         setStep]         = useState(0)
  const [roles,        setRoles]        = useState(['EMPLOYEE'])
  const [submitted,    setSubmitted]    = useState(false)
  const [departments,  setDepartments]  = useState([])
  const [designations, setDesignations] = useState([])
  const [skills,       setSkills]       = useState([])
  const [resumeParsed, setResumeParsed] = useState(false)

  const { register, trigger, getValues, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '', personalEmail: '', companyEmail: '',
      phoneNumber: '', address: '', dateOfJoin: '',
      dateOfBirth: '', description: '',
    },
  })

  // Auto-fill from resume
  const handleResumeData = (data) => {
    if (!data) return
    const fullName = [data.fName, data.lName].filter(Boolean).join(' ')
    if (fullName)           setValue('name',          fullName,         { shouldValidate: true })
    if (data.pEmail)        setValue('personalEmail', data.pEmail,      { shouldValidate: true })
    if (data.phoneNumber)   setValue('phoneNumber',   data.phoneNumber, { shouldValidate: true })
    if (data.dob)           setValue('dateOfBirth',   data.dob,         { shouldValidate: true })
    if (data.address) {
      const addr = [data.address.street, data.address.city, data.address.state, data.address.zip, data.address.country]
        .filter(Boolean).join(', ')
      if (addr) setValue('address', addr, { shouldValidate: true })
    }
    if (Array.isArray(data.skills) && data.skills.length > 0) {
      const normalized = data.skills.map(s => s.trim()).filter(Boolean)
      setSkills(prev => {
        const existing = new Set(prev.map(s => s.toLowerCase()))
        return [...prev, ...normalized.filter(s => !existing.has(s.toLowerCase()))]
      })
    }
    setResumeParsed(true)
  }

  const mutation = useMutation({
    mutationFn: (data) => employeeAPI.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success(`Employee ${res.data.name} (${res.data.empId}) created! Credentials sent via email.`, { duration: 5000 })
      onClose()
    },
    onError: (err) => {
      toast.error(parseApiError(err, 'Failed to create employee'))
      setSubmitted(false)
    },
  })

  const nextStep = async () => {
    const valid = await trigger(STEP_FIELDS[step])
    if (!valid) return
    if (step === 1) {
      if (departments.length  === 0) { toast.error('Add at least one department');  return }
      if (designations.length === 0) { toast.error('Add at least one designation'); return }
    }
    if (step === 2 && roles.length === 0) { toast.error('Assign at least one role'); return }
    setStep(s => s + 1)
  }

  const handleCreate = () => {
    if (submitted) return
    setSubmitted(true)
    mutation.mutate({
      ...getValues(),
      department:  departments.join(','),
      designation: designations.join(','),
      skills:      skills.join(','),
      roles,
    })
  }

  const toggleRole = (role) => {
    if (isSubmitting) return
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
  }

  const values      = getValues()
  const isSubmitting = mutation.isPending || submitted

  return (
    <FocusTrap focusTrapOptions={{ initialFocus: false, escapeDeactivates: false, clickOutsideDeactivates: true }}>
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Create New Employee"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="glass-panel"
      style={{
        position: 'fixed', top: 'var(--topnav-height)', right: isChatOpen ? chatWidth : 0, bottom: 0,
        width: `${sideSheetWidth}px`,
        maxWidth: '90vw', zIndex: 1050, borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflowY: 'hidden',
        background: 'var(--bg-card)', transition: 'right 0.3s ease',
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 6,
          cursor: 'ew-resize', zIndex: 20, background: 'transparent',
        }}
        className="resize-handle"
      />

      {/* Header — flex-shrink-0, always pinned at top, never scrolls */}
      <div style={{ flexShrink: 0, zIndex: 10, background: 'var(--bg-card)', padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
          Add New Employee
        </h2>
        <button onClick={onClose} className="btn-icon">
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div className="new-employee-container" style={{ padding: 0, margin: 0, minHeight: 'auto' }}>

        {/* Resume banner */}
        <div className="resume-banner card">
          <div className="resume-banner-label">
            <FileText size={13} />
            Auto-fill from Resume
            {resumeParsed && (
              <span className="resume-badge">✓ Resume applied</span>
            )}
          </div>
          <div style={{ padding: '8px 12px 12px' }}>
            <ResumeUploadButton onParsed={handleResumeData} />
          </div>
        </div>

        {/* Step indicator — fluid and wrapped if narrow */}
        <div className="step-indicator" style={{ flexWrap: 'wrap', gap: '20px 0' }}>
          {STEPS.map((label, i) => (
            <div key={i} className="step-item" style={{ flex: i < STEPS.length - 1 ? '1 1 auto' : 'none', display: 'flex', alignItems: 'center', minWidth: '80px' }}>
              <div className="step-label-wrap">
                <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`step-label ${i === step ? 'active' : i < step ? 'done' : ''}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-line ${i < step ? 'done' : ''}`} style={{ margin: '0 8px 18px' }} />
              )}
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="step-heading">
            {['Personal Information', 'Employment Details & Skills', 'Assign Roles', 'Review & Submit'][step]}
          </h2>
          <p className="step-desc">
            {[
              'Fill in personal details, or upload a resume above to auto-fill',
              'Departments, designations, dates and skills',
              'Choose access roles for this employee',
              'Review all details before creating the account',
            ][step]}
          </p>

          {/* Step 0 */}
          {step === 0 && (
            <div>
              <BaseInput
                label="Full Name" icon={User} required
                placeholder="e.g. Mounish Kakarla"
                error={errors.name?.message}
                {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Too short' } })}
              />
              <div className="grid-2">
                <BaseInput
                  label="Company Email" icon={Mail} required type="email"
                  placeholder="name@tektalis.com"
                  error={errors.companyEmail?.message}
                  {...register('companyEmail', {
                    required: 'Required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                  })}
                />
                <BaseInput
                  label="Personal Email" icon={Mail} required type="email"
                  placeholder="personal@gmail.com"
                  error={errors.personalEmail?.message}
                  {...register('personalEmail', {
                    required: 'Required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                  })}
                />
              </div>
              <BaseInput
                label="Phone Number" icon={Phone} required
                placeholder="+91 9876543210"
                error={errors.phoneNumber?.message}
                {...register('phoneNumber', {
                  required: 'Required',
                  pattern: { value: /^[0-9+\- ]{8,15}$/, message: 'Invalid phone' },
                })}
              />
              <BaseInput
                label="Address" icon={MapPin} required
                placeholder="Full address"
                error={errors.address?.message}
                {...register('address', { required: 'Address is required' })}
              />
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <FormField label="Departments" icon={Building2} required error={departments.length === 0 ? 'At least one required' : null}>
                <TagInput values={departments} onChange={setDepartments} suggestions={DEPARTMENTS}
                  placeholder="Search departments…" chipColor="info" allowCustom={false} />
              </FormField>

              <FormField label="Designations" icon={Briefcase} required error={designations.length === 0 ? 'At least one required' : null}>
                <TagInput values={designations} onChange={setDesignations} suggestions={[]}
                  placeholder="e.g. Senior Developer, Tech Lead" chipColor="accent" allowCustom />
              </FormField>

              <div className="grid-2">
                <BaseInput
                  label="Date of Joining" icon={Calendar} required type="date"
                  error={errors.dateOfJoin?.message}
                  {...register('dateOfJoin', { required: 'Required' })}
                />
                <BaseInput
                  label="Date of Birth" icon={Calendar} required type="date"
                  error={errors.dateOfBirth?.message}
                  {...register('dateOfBirth', { required: 'Required' })}
                />
              </div>

              <FormField label="Skills" icon={Star}>
                <TagInput values={skills} onChange={setSkills} suggestions={SKILL_SUGGESTIONS}
                  placeholder="Search or type a skill & press Enter…" chipColor="success" allowCustom />
              </FormField>

              <BaseTextarea
                label="Description (optional)"
                placeholder="Brief description or notes…"
                {...register('description')}
              />
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Select one or more access roles for this employee.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                {ROLES.map(role => (
                  <button key={role} type="button" onClick={() => toggleRole(role)}
                    className={`role-toggle ${roles.includes(role) ? 'active' : ''}`}>
                    {roles.includes(role) && <CheckCircle size={14} />}
                    {role}
                  </button>
                ))}
              </div>
              {roles.length === 0 && (
                <div className="form-error"><AlertCircle size={12} /> At least one role is required</div>
              )}
              <div className="role-descriptions">
                {[
                  { role: 'ADMIN',    desc: 'Full access — create, manage, deactivate employees and assign roles' },
                  { role: 'MANAGER',  desc: 'View & search employees, edit basic details' },
                  { role: 'EMPLOYEE', desc: 'Profile and self-service settings only' },
                ].map(r => (
                  <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span className={`badge role-${r.role.toLowerCase()}`}>{r.role}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ReviewSection title="Personal Information">
                <div className="review-grid">
                  <ReviewRow label="Full Name"      value={values.name} />
                  <ReviewRow label="Company Email"  value={values.companyEmail} />
                  <ReviewRow label="Personal Email" value={values.personalEmail} />
                  <ReviewRow label="Phone"          value={values.phoneNumber} />
                  <ReviewRow label="Address"        value={values.address} />
                </div>
              </ReviewSection>

              <ReviewSection title="Employment Details">
                <div className="review-grid">
                  <div>
                    <div className="review-label">Departments</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {departments.map(d => <span key={d} className="badge badge-info" style={{ fontSize: 11 }}>{d}</span>)}
                    </div>
                  </div>
                  <div>
                    <div className="review-label">Designations</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {designations.map(d => <span key={d} className="badge badge-accent" style={{ fontSize: 11 }}>{d}</span>)}
                    </div>
                  </div>
                  <ReviewRow label="Date of Join"  value={formatDate(values.dateOfJoin)} />
                  <ReviewRow label="Date of Birth" value={formatDate(values.dateOfBirth)} />
                </div>
              </ReviewSection>

              {skills.length > 0 && (
                <ReviewSection title="Skills">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {skills.map(s => (
                      <span key={s} style={{ background: 'var(--success-light)', color: 'var(--success)', borderRadius: 4, padding: '2px 10px', fontSize: 12, fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </ReviewSection>
              )}

              <ReviewSection title="Assigned Roles">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {roles.map(r => <span key={r} className={`badge role-${r.toLowerCase()}`}>{r}</span>)}
                </div>
              </ReviewSection>

              <div className="info-notice">
                ℹ️ Login credentials will be emailed to <strong>{values.personalEmail}</strong>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="step-nav">
            <div>
              {step > 0 && (
                <button type="button" className="btn btn-secondary" onClick={() => setStep(s => s - 1)} disabled={isSubmitting}>
                  <ArrowLeft size={14} /> Back
                </button>
              )}
            </div>
            <div>
              {step < STEPS.length - 1 ? (
                <button type="button" className="btn btn-primary" onClick={nextStep}>Continue →</button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={handleCreate}
                  disabled={isSubmitting} style={{ minWidth: 160, justifyContent: 'center' }}>
                  {isSubmitting
                    ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Creating…</>
                    : 'Create Employee'}
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
        </div>
      </motion.div>
    </FocusTrap>
  )
}

function ReviewSection({ title, children }) {
  return (
    <div className="review-section">
      <div className="review-section-title">{title}</div>
      {children}
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div>
      <div className="review-label">{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{value || '—'}</div>
    </div>
  )
}
