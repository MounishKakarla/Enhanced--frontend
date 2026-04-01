import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'
import { useUIStore } from '../../store/uiStore'
import {
  Send, Database, AlertCircle, RefreshCw,
  BarChart3, Table2, Mic, MicOff, Volume2, VolumeX, Trash2, X
} from 'lucide-react'
import api from '../../api'
import '../../styles/chatbot.css'
import { BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart as RLineChart, Line, CartesianGrid } from 'recharts'
import { useVirtualizer } from '@tanstack/react-virtual'

const CHATBOT_API  = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8000/api/chatbot'
const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', 
  '#ec4899', '#f97316', '#14b8a6', '#3b82f6', '#84cc16', '#a855f7'
]
const BOT_NAME     = 'Aura'

const histKey = (uid) => `aura_history_${uid}`
const loadHistory = (uid) => {
  if (!uid) return []
  try { return JSON.parse(localStorage.getItem(histKey(uid)) || '[]') }
  catch { return [] }
}
const saveHistory = (uid, msgs) => {
  if (!uid) return
  try { localStorage.setItem(histKey(uid), JSON.stringify(msgs.slice(-300))) }
  catch { /* quota – ignore */ }
}
const nukeHistory = (uid) => { if (uid) localStorage.removeItem(histKey(uid)) }

// ─────────────────────────────────────────────────────────────────────────────
// Greeting helper
// ─────────────────────────────────────────────────────────────────────────────
const getGreeting = (user) => {
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const userName = user?.name
    || user?.firstName
    || user?.username
    || user?.email?.split('@')[0]
    || 'there'
  return `Good ${timeOfDay}, ${userName}! 👋 How can I help you today?`
}

const greetKey = (uid) => `aura_greeted_${uid}_${new Date().toDateString()}`

// ─────────────────────────────────────────────────────────────────────────────
// Recharts implementations
// ─────────────────────────────────────────────────────────────────────────────
function AppBarChart({ rows, columns }) {
  if (!rows?.length || columns.length < 2) return null
  const lCol = columns[0]
  // Find ALL numeric columns
  const vCols = columns.filter(c => typeof rows[0][c] === 'number')
  if (!vCols.length) vCols.push(columns[1])
  
  const data = rows.map(r => {
    const obj = { ...r }
    vCols.forEach(c => { obj[c] = Number(r[c]) || 0 })
    return obj
  })

  return (
    <div style={{ width: '100%', height: 220, marginTop: 12 }}>
      <ResponsiveContainer>
        <RBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey={lCol} tick={{fontSize: 10, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
          <YAxis tick={{fontSize: 10, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }} 
            cursor={{fill: 'var(--bg-hover)'}} 
          />
          {vCols.length > 1 && <Legend iconSize={10} wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />}
          {vCols.map((c, i) => (
            <Bar key={c} dataKey={c} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} barSize={vCols.length > 1 ? undefined : 32} />
          ))}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  )
}

function AppendLineChart({ rows, columns }) {
  if (!rows?.length || columns.length < 2) return null
  const lCol = columns[0]
  const vCols = columns.filter(c => typeof rows[0][c] === 'number')
  if (!vCols.length) vCols.push(columns[1])

  const data = rows.map(r => {
    const obj = { ...r }
    vCols.forEach(c => { obj[c] = Number(r[c]) || 0 })
    return obj
  })

  return (
    <div style={{ width: '100%', height: 220, marginTop: 12 }}>
      <ResponsiveContainer>
        <RLineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey={lCol} tick={{fontSize: 10, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
          <YAxis tick={{fontSize: 10, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }} 
          />
          {vCols.length > 1 && <Legend iconSize={10} wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />}
          {vCols.map((c, i) => (
            <Line key={c} type="monotone" dataKey={c} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          ))}
        </RLineChart>
      </ResponsiveContainer>
    </div>
  )
}

function AppDonutChart({ rows, columns }) {
  if (!rows?.length || columns.length < 2) return null
  const lCol = columns[0]
  const vCol = columns.find(c => typeof rows[0][c] === 'number') || columns[1]

  const data = rows.map(r => ({ ...r, [vCol]: Number(r[vCol]) || 0 }))

  return (
    <div style={{ width: '100%', height: 240, marginTop: 12 }}>
      <ResponsiveContainer>
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Pie data={data} dataKey={vCol} nameKey={lCol} cx="50%" cy="50%" innerRadius={50} outerRadius={80} stroke="var(--bg-card)" strokeWidth={2}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Data table
// ─────────────────────────────────────────────────────────────────────────────
function DataTable({ columns, rows }) {
  const { openEmployeeSheet } = useUIStore()
  const parentRef = useRef(null)

  const rowVirtualizer = useVirtualizer({
    count: rows?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 5,
  })

  if (!rows?.length) return (
    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 8 }}>No rows returned.</p>
  )
  
  return (
    <div ref={parentRef} style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 320, marginTop: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', scrollbarWidth: 'thin' }}>
      <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'auto' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-tertiary)' }}>
          <tr>
            {columns.map(c => (
              <th key={c} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', minWidth: '100px' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowVirtualizer.getVirtualItems().length > 0 && (
            <tr style={{ height: rowVirtualizer.getVirtualItems()[0].start }} />
          )}
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const row = rows[virtualRow.index]
            const i = virtualRow.index
            return (
              <tr 
                key={virtualRow.key} 
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)' }}
              >
                {columns.map(c => {
                  const val = row[c]
                  return (
                    <td key={c} style={{ padding: '10px 14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', minWidth: '100px' }}>
                      {val === null || val === undefined
                        ? <span style={{ color: 'var(--text-muted)' }}>—</span>
                        : c === 'empId' 
                          ? <span style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { openEmployeeSheet(val); document.body.click(); }}>{val}</span>
                          : String(val)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
          {rowVirtualizer.getVirtualItems().length > 0 && (
            <tr style={{ height: rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end }} />
          )}
        </tbody>
      </table>
    </div>
  )
}

const ADD_KEYWORDS    = ['add', 'insert', 'create new', 'new record', 'register']
const UPDATE_KEYWORDS = ['update', 'edit', 'modify', 'change']

const detectIntent = (p) => {
  const l = p.toLowerCase()
  if (ADD_KEYWORDS.some(k    => l.includes(k))) return 'add'
  if (UPDATE_KEYWORDS.some(k => l.includes(k))) return 'update'
  return 'query'
}

const resolveTable = (p, schema) => {
  const l = p.toLowerCase()
  let best = null, score = 0
  for (const t of Object.keys(schema)) {
    const tl  = t.toLowerCase()
    const sin = tl.replace(/s$/, '')
    if (l.includes(tl)              && tl.length  > score) { best = t; score = tl.length }
    if (sin.length > 2 && l.includes(sin) && sin.length > score) { best = t; score = sin.length }
  }
  return best
}

function DateDivider({ ts }) {
  const d    = new Date(ts)
  const now  = new Date()
  const yest = new Date(); yest.setDate(now.getDate() - 1)
  const label =
    d.toDateString() === now.toDateString()  ? 'Today' :
    d.toDateString() === yest.toDateString() ? 'Yesterday' :
    d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 10px', background: 'var(--bg-tertiary)', borderRadius: 20, border: '1px solid var(--border)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

const toggleStyle = {
  display: 'inline-flex', alignItems: 'center',
  padding: '2px 8px', borderRadius: 20, fontSize: 11,
  border: 'none', cursor: 'pointer', transition: 'all .15s',
}

function Bubble({ msg }) {
  const [view, setView] = useState('chart')
  const isUser = msg.role === 'user'

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 8,
      marginBottom: 4,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'var(--accent)' : 'var(--bg-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        color: isUser ? '#fff' : 'var(--text-muted)',
        boxShadow: '0 1px 4px rgba(0,0,0,.25)',
      }}>
        {isUser ? 'U' : '🤖'}
      </div>

      <div style={{
        maxWidth: '85%',
        minWidth: 60,
        background: isUser ? 'var(--accent)' : 'var(--bg-card)',
        border: isUser ? 'none' : '1px solid var(--border)',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '10px 14px 8px',
        color: isUser ? '#fff' : 'var(--text-primary)',
        boxShadow: '0 1px 3px rgba(0,0,0,.18)',
        wordBreak: 'break-word',
      }}>
        <p style={{ fontSize: 14, margin: 0, lineHeight: 1.6 }}>{msg.content}</p>

        {msg.ts && (
          <div style={{ fontSize: 10, marginTop: 4, textAlign: 'right', color: isUser ? 'rgba(255,255,255,.55)' : 'var(--text-muted)' }}>
            {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

        {msg.rows?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
              <button
                onClick={() => setView('table')}
                style={{ ...toggleStyle, background: view === 'table' ? 'var(--accent)' : 'var(--bg-tertiary)', color: view === 'table' ? '#fff' : 'var(--text-secondary)' }}
              >
                <Table2 size={10} style={{ marginRight: 3 }} /> Table
              </button>
              {msg.chart_type && (
                <button
                  onClick={() => setView('chart')}
                  style={{ ...toggleStyle, background: view === 'chart' ? 'var(--accent)' : 'var(--bg-tertiary)', color: view === 'chart' ? '#fff' : 'var(--text-secondary)' }}
                >
                  <BarChart3 size={10} style={{ marginRight: 3 }} /> Chart
                </button>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                {msg.rows.length} row{msg.rows.length !== 1 ? 's' : ''}
              </span>
            </div>

            {view === 'chart' && msg.chart_type === 'pie'  && <AppDonutChart rows={msg.rows} columns={msg.columns} />}
            {view === 'chart' && msg.chart_type === 'line' && <AppendLineChart rows={msg.rows} columns={msg.columns} />}
            {view === 'chart' && msg.chart_type && msg.chart_type !== 'pie' && msg.chart_type !== 'line' && <AppBarChart rows={msg.rows} columns={msg.columns} />}
            {(view === 'table' || !msg.chart_type)                          && <DataTable     columns={msg.columns} rows={msg.rows} />}
          </div>
        )}
      </div>
    </div>
  )
}

function MessageFeed({ messages }) {
  const out = []; let lastDay = null
  messages.forEach((msg, i) => {
    const day = msg.ts ? new Date(msg.ts).toDateString() : null
    if (day && day !== lastDay) { out.push(<DateDivider key={`d${i}`} ts={msg.ts} />); lastDay = day }
    out.push(<Bubble key={`m${i}`} msg={msg} />)
  })
  return <>{out}</>
}

function IconBtn({ children, title, onClick, active, danger }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 32, height: 32, borderRadius: 8,
      border: '1px solid var(--border)',
      background: active ? 'var(--accent)' : 'var(--bg-tertiary)',
      color: danger ? 'var(--danger)' : active ? '#fff' : 'var(--text-secondary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'all .15s',
    }}>
      {children}
    </button>
  )
}

export default function ChatBotWidget({ onClose }) {
  const { isAdmin, isManager, user } = useAuth()
  const navigate = useNavigate()

  const uid = user?.id ?? user?.empId ?? user?.username ?? user?.email ?? null

  const [messages,     setMessages]     = useState([])
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [dbConfig,     setDbConfig]     = useState(null)
  const [schema,       setSchema]       = useState({})
  const [initialising, setInitialising] = useState(true)
  const [isListening,  setIsListening]  = useState(false)
  const [isSpeaking,   setIsSpeaking]   = useState(false)
  const { chatWidth, setChatWidth, openEmployeeSheet, setNewEmployeeSheetOpen, setChatOpen } = useUIStore()

  const bottomRef  = useRef(null)
  const connected  = useRef(false)
  const recogRef   = useRef(null)
  const isResizing = useRef(false)

  const startResize = () => {
    isResizing.current = true
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', endResize)
  }

  const handleResize = (e) => {
    if (!isResizing.current) return
    const newWidth = window.innerWidth - e.clientX
    if (newWidth >= 320 && newWidth <= window.innerWidth * 0.8) {
      setChatWidth(newWidth)
    }
  }

  const endResize = () => {
    isResizing.current = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', endResize)
  }

  useEffect(() => {
    if (uid && messages.length) saveHistory(uid, messages)
  }, [messages, uid])

  const speak = (text) => {
    if (!isSpeaking) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1; u.pitch = 1.1
    window.speechSynthesis.speak(u)
  }

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    recogRef.current = Object.assign(new SR(), { continuous: false, interimResults: false, lang: 'en-US' })
    recogRef.current.onresult = (e) => {
      const t = e.results[0][0].transcript
      setInput(t); setIsListening(false); handleSend(t)
    }
    recogRef.current.onend = () => setIsListening(false)
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  useEffect(() => {
    if (connected.current) return
    connected.current = true

    ;(async () => {
      const saved = loadHistory(uid)
      try {
        const cfg = (await api.get('/ems/db-config')).data
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const conn = await fetch(`${CHATBOT_API}/connect`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ db: cfg }),
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        const data = await conn.json()
        if (!conn.ok) throw new Error(data.detail || 'Connection failed')

        setDbConfig(cfg)
        setSchema(data.schema || {})

        // ── Greeting logic ──────────────────────────────────────────────────
        const key             = greetKey(uid)
        const alreadyGreeted  = !!localStorage.getItem(key)
        if (!alreadyGreeted) localStorage.setItem(key, '1')

        setMessages(
          saved.length
            ? saved   // restore history silently — no duplicate greeting
            : [{ role: 'assistant', content: getGreeting(user), ts: new Date().toISOString() }]
        )
        // ────────────────────────────────────────────────────────────────────

      } catch {
        const saved = loadHistory(uid)
        setMessages(saved.length
          ? saved
          : [{ role: 'assistant', content: `Couldn't auto-connect to the database. Please check configuration.`, ts: new Date().toISOString() }]
        )
      } finally {
        setInitialising(false)
      }
    })()
  }, [uid])

  const push = (msg) =>
    setMessages(prev => [...prev, { ...msg, ts: new Date().toISOString() }])

  const refreshSchema = async () => {
    if (!dbConfig) return
    try {
      const r = await fetch(`${CHATBOT_API}/schema`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db: dbConfig }),
      })
      setSchema(await r.json())
    } catch { /* silent */ }
  }

  const handleClear = () => {
    nukeHistory(uid)
    // Reset today's greeting flag so it shows again cleanly
    localStorage.removeItem(greetKey(uid))
    setMessages([{ role: 'assistant', content: getGreeting(user), ts: new Date().toISOString() }])
  }

  const handleSend = async (override = null) => {
    const text = (override ?? input).trim()
    if (!text || !dbConfig) return
    setInput('')
    push({ role: 'user', content: text })
    setLoading(true)

    const intent = detectIntent(text)

    if (intent === 'add') {
      setLoading(false)
      const tbl = resolveTable(text, schema)
      if (tbl?.toLowerCase().match(/emp/)) {
        push({ role: 'assistant', content: 'Sure! Opening the Add Employee form\u2026' })
        setTimeout(() => { setNewEmployeeSheetOpen(true) }, 600)
      } else {
        push({ role: 'assistant', content: `I couldn't identify a table. Try: "add employee" to open the Add Employee form.` })
      }
      return
    }

    if (intent === 'update') {
      setLoading(false)
      const idMatches = text.match(/\b([A-Za-z]{1,4}\d{4,}|\d{4,})\b/g)
      const keywords  = new Set([...UPDATE_KEYWORDS, 'employee', 'emp'])
      const extracted = idMatches?.find(m => !keywords.has(m.toLowerCase()))
      if (extracted) {
        push({ role: 'assistant', content: `Opening employee **${extracted}** for editing…` })
        setTimeout(() => { openEmployeeSheet(extracted) }, 600)
      } else {
        push({ role: 'assistant', content: `Please include the employee ID. Example: "update TT0001"` })
      }
      return
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const res  = await fetch(`${CHATBOT_API}/query`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, db: dbConfig }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Query failed')

      if (data.message) {
        push({ role: 'assistant', content: data.message })
        speak(data.message)
        refreshSchema()
      } else {
        const summary = data.row_count === 0
          ? 'Query returned no results.'
          : `Found ${data.row_count} row${data.row_count !== 1 ? 's' : ''}.`
        push({ role: 'assistant', content: summary, columns: data.columns, rows: data.rows, chart_type: data.chart_type })
        speak(summary)
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        push({ role: 'assistant', content: 'Query timed out after 8 seconds. For safety, ultra-complex queries are aborted.' })
      } else {
        const msg = err.message.includes('SyntaxError')
          ? "I generated an invalid query. Could you rephrase your question?"
          : `Error: ${err.message}`
        push({ role: 'assistant', content: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleMic = () => {
    if (isListening) { recogRef.current?.stop() }
    else { setIsListening(true); recogRef.current?.start() }
  }

  if (!isAdmin() && !isManager()) return null

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="chatbot-widget glass-panel"
      role="dialog"
      aria-label="SQL Chatbot"
      style={{
        position: 'fixed',
        top: 'var(--topnav-height)', right: 0, bottom: 0,
        width: `${chatWidth}px`,
        maxWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        borderLeft: '1px solid var(--border)',
      }}
    >
      {/* Resize Handle — Now keyboard accessible */}
      <div
        onMouseDown={startResize}
        tabIndex={0}
        role="separator"
        aria-label="Resize chatbot panel"
        aria-orientation="vertical"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setChatWidth(w => Math.min(w + 20, window.innerWidth * 0.8))
          if (e.key === 'ArrowRight') setChatWidth(w => Math.max(w - 20, 320))
        }}
        style={{ position: 'absolute', left: -4, top: 0, bottom: 0, width: 8, cursor: 'ew-resize', zIndex: 10, outline: 'none' }}
        className="resize-handle"
      />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{BOT_NAME}</h1>
            <p style={{ fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 4,
              color: initialising ? 'var(--warning)' : dbConfig ? 'var(--success)' : 'var(--danger)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              {dbConfig?.database || 'Status'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <IconBtn title={isSpeaking ? 'Mute voice' : 'Enable voice'} active={isSpeaking} onClick={() => setIsSpeaking(v => !v)}>
            {isSpeaking ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </IconBtn>
          {dbConfig && (
            <IconBtn title="Refresh schema" onClick={refreshSchema}>
              <RefreshCw size={13} />
            </IconBtn>
          )}
          <IconBtn title="Clear history" danger onClick={handleClear}>
            <Trash2 size={13} />
          </IconBtn>
          <button onClick={onClose} aria-label="Close Chatbot" style={{ marginLeft: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Message area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', scrollbarWidth: 'thin' }}>
        {initialising && messages.length === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        )}

        {messages.length === 0 && !initialising && (
          <div className="empty-state" style={{ flex: 1 }}>
            <Database size={36} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ marginTop: 12 }}>{BOT_NAME}</h3>
            <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--text-muted)', maxWidth: 360 }}>
              Ask questions in plain English.<br />
              Try <em>"show employees by department"</em>.
            </p>
          </div>
        )}

        <MessageFeed messages={messages} />

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🤖</div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: `bounce .9s ${i * 0.18}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        flexShrink: 0, margin: '16px', marginTop: 0,
        display: 'flex', gap: 8, alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 -1px 6px rgba(0,0,0,.1)',
      }}>
        <button onClick={toggleMic} style={{
          background: isListening ? 'var(--danger)' : 'var(--bg-tertiary)',
          border: 'none', borderRadius: '50%',
          width: 34, height: 34, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isListening ? '#fff' : 'var(--text-muted)', cursor: 'pointer',
          transition: 'all .2s',
        }} title={isListening ? 'Stop' : 'Voice input'}>
          {isListening ? <MicOff size={15} /> : <Mic size={15} />}
        </button>

        <input
          className="form-input"
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, padding: '4px 0' }}
          placeholder={
            isListening    ? '🎙 Listening…'
            : initialising ? 'Connecting…'
            : dbConfig     ? 'Ask anything…'
            :                'Not connected'
          }
          value={input}
          disabled={loading || initialising || !dbConfig}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
        />

        <button
          className="btn btn-primary"
          onClick={() => handleSend()}
          disabled={loading || initialising || !dbConfig || !input.trim()}
          style={{ borderRadius: '50%', width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Send size={14} />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0);   opacity: .6; }
          40%           { transform: translateY(-5px); opacity: 1;  }
        }
      `}</style>
    </motion.div>
  )
}