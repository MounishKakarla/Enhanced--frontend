// src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import {
  Users, Shield, Zap, BarChart3, Lock, Globe,
  ArrowRight, Sun, Moon, MessageSquare, Server, Database,
} from 'lucide-react'
import logoWhite from '../assets/Tektalis_Logo_White.svg'
import logoDark  from '../assets/Tektalis_Logo_Dark.svg'
import '../styles/landing.css'

const FEATURES = [
  {
    icon: Users,
    title: 'Employee Management',
    desc:  'Full lifecycle management — onboard, update, and offboard employees with complete audit trails.',
    detail: 'Create, edit, and deactivate employees. Track join dates, departments, roles, and location — all in one place with full history.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc:  'Granular ADMIN, MANAGER, and EMPLOYEE roles. Every action secured and controlled.',
    detail: 'Three-tier permission model. Admins manage all users, Managers view their teams, Employees access only their own profile.',
  },
  {
    icon: Zap,
    title: 'JWT Authentication',
    desc:  'Stateless, refresh-token-aware authentication. Sessions stay alive, security stays tight.',
    detail: 'Access tokens expire in 15 minutes. Refresh tokens silently renew sessions. No cookies, no CSRF — pure stateless security.',
  },
  {
    icon: BarChart3,
    title: 'Smart Search & Filters',
    desc:  'Instantly search by name, department, or join date with server-side pagination.',
    detail: 'Debounced live search, multi-column filtering, and paginated results — all handled server-side for performance at scale.',
  },
  {
    icon: Lock,
    title: 'Password Management',
    desc:  'Self-service password change and admin-triggered reset with automated email delivery.',
    detail: 'BCrypt-hashed passwords. Admins can force-reset any account. Employees change their own password with current-password verification.',
  },
  {
    icon: Globe,
    title: 'Email Notifications',
    desc:  'Branded email templates sent on account creation and password reset events.',
    detail: 'Thymeleaf-rendered HTML emails with Tektalis branding. Triggered automatically on account creation, reset, and status changes.',
  },
  {
    icon: MessageSquare,
    title: 'Aura AI',
    desc:  'Ask anything in plain English — Aura queries your database, visualises results as charts or tables, and responds instantly.',
    detail: 'Powered by Groq LLaMA. Converts natural language to SQL, auto-detects chart types, and renders bar/pie charts inline. Admins & Managers only.',
  },
  {
    icon: Server,
    title: 'Spring Boot + FastAPI',
    desc:  'Dual backend — Spring Boot handles core EMS logic while FastAPI powers the AI chatbot layer.',
    detail: 'Spring Boot 3 with Spring Security for the main API. FastAPI (Python) as a lightweight AI microservice connecting Groq LLM to your database.',
  },
  {
    icon: Database,
    title: 'PostgreSQL',
    desc:  'Relational database powering every query — structured, indexed, and production-ready.',
    detail: 'JPA/Hibernate ORM on the Spring side. psycopg2 on the FastAPI side. Schema introspection lets Aura AI understand your tables at runtime.',
  },
]

const STATS = [
  { value: '3',      label: 'Role Levels'  },
  { value: 'JWT',    label: 'Auth Method'  },
  { value: '100%',   label: 'REST API'     },
  { value: 'BCrypt', label: 'Encrypted'    },
]

const TECH_STACK = [
  'Spring Boot 3', 'Spring Security', 'JWT (JJWT)', 'JPA / Hibernate',
  'PostgreSQL', 'Thymeleaf', 'React 18', 'Vite', 'TanStack Query',
  'React Hook Form', 'Axios', 'React Router v6', 'FastAPI', 'Groq LLaMA',
]

// ── Flip Card ────────────────────────────────────────────────────────────────
function FeatureCard({ f }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className="flip-card"
      onClick={() => setFlipped(v => !v)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div className="flip-card-inner" style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>

        {/* ── Front ── */}
        <div className="flip-face flip-front card landing-feature-card">
          <div className="landing-feature-icon">
            <f.icon size={20} color="var(--accent)" />
          </div>
          <h3>{f.title}</h3>
          <p>{f.desc}</p>
          <span className="flip-hint">Hover to learn more →</span>
        </div>

        {/* ── Back ── */}
        <div className="flip-face flip-back card landing-feature-card">
          <div style={{ marginBottom: 12 }}>
            <f.icon size={22} color="rgba(255,255,255,0.9)" />
          </div>
          <h3 style={{ color: '#fff', marginBottom: 10 }}>{f.title}</h3>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.65 }}>{f.detail}</p>
        </div>

      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate               = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, isLoading } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  const logoSrc    = theme === 'dark' ? logoWhite : logoDark
  const navLogoSrc = scrolled || theme === 'dark' ? logoWhite : logoDark

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Redirect authenticated users to dashboard if they hit the landing page
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  // Don't render anything while checking auth to prevent layout flashes or redirects
  if (isLoading) return null

  return (
    <div className="landing">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-logo" onClick={() => navigate('/')}>
          <img src={navLogoSrc} alt="Tektalis" />
        </div>
        <div className="landing-nav-right">
          <button className="btn-icon" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {isAuthenticated ? (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
              Dashboard <ArrowRight size={14} />
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
              Sign In <ArrowRight size={14} />
            </button>
          )}
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-glow landing-hero-glow-center" />
        <div className="landing-hero-glow landing-hero-glow-left" />

        <div className="landing-badge">
          <span className="landing-badge-dot" />
          Spring Boot + React · Full Stack EMS
        </div>

        <h1 className="landing-hero-title">
          Manage Your
          <br />
          <span style={{ color: 'var(--accent)' }}>Workforce</span> with
          <br />
          Precision
        </h1>

        <p className="landing-hero-desc">
          A complete Employee Management System with role-based access control,
          JWT authentication, real-time search, and automated email workflows.
        </p>

        <div className="landing-hero-cta">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
            <ArrowRight size={16} />
          </button>
          <a href="#features" className="btn btn-ghost btn-lg">Learn More</a>
        </div>

        <div className="landing-stats">
          {STATS.map(s => (
            <div key={s.label} className="landing-stat">
              <div className="landing-stat-value">{s.value}</div>
              <div className="landing-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="landing-features">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <div className="landing-eyebrow">CAPABILITIES</div>
            <h2>Everything you need</h2>
          </div>
          <div className="landing-features-grid">
            {FEATURES.map((f, i) => <FeatureCard key={i} f={f} />)}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────────────────────── */}
      <section className="landing-tech">
        <div className="landing-section-inner" style={{ textAlign: 'center' }}>
          <h2 className="landing-tech-title">Built on a solid foundation</h2>
          <p className="landing-tech-desc">Production-grade stack with security and scalability in mind</p>
          <div className="landing-tech-tags">
            {TECH_STACK.map(tech => (
              <div key={tech} className="tag" style={{ padding: '8px 16px', fontSize: 13 }}>{tech}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="landing-cta">
        <h2>Ready to manage your team?</h2>
        <p>Sign in with your employee credentials to access the dashboard.</p>
        <button
          className="btn btn-lg landing-cta-btn"
          onClick={() => navigate('/login')}
        >
          Sign In Now <ArrowRight size={16} />
        </button>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-logo" onClick={() => navigate('/')}>
          <img src={logoSrc} alt="Tektalis" />
        </div>
        <span className="landing-footer-copy">
          © {new Date().getFullYear()} Tektalis. Employee Management System.
        </span>
      </footer>

      {/* ── FLIP CARD CSS ────────────────────────────────────────────────── */}
      <style>{`
        .flip-card {
          perspective: 1000px;
          cursor: pointer;
          height: 230px;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.45s cubic-bezier(.4,0,.2,1);
        }
        .flip-face {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-sizing: border-box;
        }
        .flip-back {
          transform: rotateY(180deg);
          background: var(--accent) !important;
          border: none !important;
          justify-content: center;
        }
        .flip-hint {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: auto;
          padding-top: 10px;
        }
      `}</style>
    </div>
  )
}