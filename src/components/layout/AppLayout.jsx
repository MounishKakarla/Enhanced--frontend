// src/components/layout/AppLayout.jsx
// Layout: slim sidebar (logo + logout only) + top navbar with all nav items
// Avatar dropdown shows user details. Logo navigates to landing page.

import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, Users, UserX, UserPlus, User,
  Settings, LogOut, Sun, Moon, BotMessageSquare,
  ChevronDown, Shield, Mail, Menu, X, Search,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ChatBotWidget from '../ui/ChatBotWidget'
import EmployeeSideSheet from '../ui/EmployeeSideSheet'
import CommandPalette from '../ui/CommandPalette'
import { useUIStore } from '../../store/uiStore'
import logoWhite from '../../assets/Tektalis_Logo_White.svg'
import logoDark  from '../../assets/Tektalis_Logo_Dark.svg'
import toast from 'react-hot-toast'
import NewEmployeeSheet from '../ui/NewEmployeeSheet'
import SessionWarningModal from '../ui/SessionWarningModal'

const NAV_ITEMS = [
  { to: '/dashboard',           icon: LayoutDashboard,  label: 'Dashboard',    roles: null },
  { to: '/employees',           icon: Users,            label: 'Employees',    roles: ['ADMIN', 'MANAGER'] },
]

export default function AppLayout() {
  const { user, logout, isWarning, refreshSession } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Zustand UI State
  const { 
    isChatOpen, setChatOpen, chatWidth,
    paletteOpen, setPaletteOpen,
    activeEmpId, isInactiveView, closeEmployeeSheet,
    isNewEmployeeSheetOpen, setNewEmployeeSheetOpen,
    sideSheetWidth,
  } = useUIStore()

  // Total right offset: chatbot + side sheet (if open)
  const sheetOpen = !!activeEmpId || isNewEmployeeSheetOpen
  const rawOffset =
    (isChatOpen ? chatWidth : 0) +
    (sheetOpen   ? sideSheetWidth : 0)
  
  // Responsive protection: Ensure the main content (Employees Page) doesn't shrink below 500px
  // If the offset is too large for the current window, we cap it. 
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const totalRightOffset = rawOffset

  const [avatarOpen, setAvatarOpen]   = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const avatarRef = useRef(null)

  // ── Global Command Palette Listener ───────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(p => !p)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])


  const logoSrc = theme === 'dark' ? logoWhite : logoDark

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const filteredNav = NAV_ITEMS.filter(item => {
    if (!item.roles) return true
    return item.roles.some(r => user?.roles?.includes(r))
  })

  const initials = user?.empId?.slice(0, 2).toUpperCase() || '??'

  return (
    <div className="app-layout-v2">
      {/* ── TOP NAVBAR ─────────────────────────────────────────────────────── */}
      <header className="topnav glass-panel">
        {/* Logo */}
        <div
          className="topnav-logo"
          onClick={() => navigate('/dashboard')}
          title="Go to dashboard"
        >
          <img src={logoSrc} alt="Tektalis" />
        </div>

        {/* Nav items — desktop */}
        <nav className="topnav-links desktop-only">
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) => `topnav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right controls */}
        <div className="topnav-right">
          {/* Theme toggle */}
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 13, gap: 8, display: 'flex', alignItems: 'center' }} onClick={() => setPaletteOpen(true)}>
            <Search size={15} />
            <span style={{ opacity: 0.6 }}>Search...</span>
            <kbd style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4, opacity: 0.5, border: '1px solid var(--border)' }}>Ctrl K</kbd>
          </button>

          {/* Avatar dropdown */}
          <div ref={avatarRef} style={{ position: 'relative' }}>
            <button
              className="avatar-btn"
              onClick={() => setAvatarOpen(o => !o)}
              aria-label="User Account Menu"
              aria-expanded={avatarOpen}
              title="Account"
            >
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                {initials}
              </div>
              <ChevronDown
                size={13}
                style={{
                  transition: 'transform 0.2s',
                  transform: avatarOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  color: 'var(--text-muted)',
                }}
              />
            </button>

            {avatarOpen && (
              <div className="avatar-dropdown glass-panel">
                {/* User info */}
                <div className="avatar-dropdown-header">
                  <div className="avatar" style={{ width: 44, height: 44, fontSize: 16, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                      {user?.name || user?.empId}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.companyEmail}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      {user?.roles?.map(r => (
                        <span key={r} className={`badge role-${r.toLowerCase()}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="avatar-dropdown-divider" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <DropdownItem icon={theme === 'dark' ? Sun : Moon} label={`Theme: ${theme === 'dark' ? 'Light' : 'Dark'}`} onClick={() => toggleTheme()} />
                  <DropdownItem icon={User}     label="My Profile"  onClick={() => { navigate('/profile');  setAvatarOpen(false) }} />
                  <DropdownItem icon={Settings} label="Settings"    onClick={() => { navigate('/settings'); setAvatarOpen(false) }} />
                  <DropdownItem icon={Shield}   label={`ID: ${user?.empId}`} onClick={() => {}} muted />
                  <DropdownItem icon={Mail}     label={user?.companyEmail}   onClick={() => {}} muted small />
                </div>

                <div className="avatar-dropdown-divider" />

                <DropdownItem
                  icon={LogOut}
                  label="Sign Out"
                  onClick={handleLogout}
                  danger
                />
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="btn-icon mobile-only" style={{ zIndex: 101, position: 'relative' }} onClick={() => setMobileOpen(o => !o)} aria-label="Toggle Mobile Menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* ── MOBILE NAV DRAWER ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="mobile-overlay"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="mobile-nav glass-panel">
            {filteredNav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </>
      )}

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <main 
        className="main-v2" 
        aria-hidden={paletteOpen ? "true" : undefined} 
        style={{ 
          width: `calc(100% - ${totalRightOffset}px)`,
          marginRight: totalRightOffset, 
          transition: 'all 0.3s ease',
          overflowX: 'auto'  // Allow horizontal scroll if squeezed too much
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="page-v2"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── FLOATING CHATBOT BUTTON ──────────────────────────────────────────── */}
      {!isChatOpen && (user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER')) && (
        <div 
          className="floating-chat-btn" 
          onClick={() => setChatOpen(true)}
          aria-label="Open Aura AI Chatbot"
          title="Open SQL Chatbot"
          style={{
            right: sheetOpen ? `calc(${sideSheetWidth}px + 20px)` : '20px',
            transition: 'right 0.3s ease',
          }}
        >
          <BotMessageSquare />
        </div>
      )}

      {/* ── SIDE PANELS ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isChatOpen && <ChatBotWidget onClose={() => setChatOpen(false)} />}
        {activeEmpId && (
          <EmployeeSideSheet 
            empId={activeEmpId} 
            isInactiveView={isInactiveView} 
            onClose={closeEmployeeSheet} 
          />
        )}
        {isNewEmployeeSheetOpen && (
          <NewEmployeeSheet onClose={() => setNewEmployeeSheetOpen(false)} />
        )}
      </AnimatePresence>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* ── SESSION WARNING MODAL ─────────────────────────────────────────── */}
      <SessionWarningModal 
        isOpen={isWarning} 
        onStay={refreshSession} 
        onLogout={handleLogout} 
      />
    </div>
  )
}

function DropdownItem({ icon: Icon, label, onClick, danger, muted, small }) {
  return (
    <button
      onClick={onClick}
      className="dropdown-item"
      style={{
        color: danger ? 'var(--danger)' : muted ? 'var(--text-muted)' : 'var(--text-secondary)',
        fontSize: small ? 11 : 13,
      }}
    >
      <Icon size={13} style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  )
}
