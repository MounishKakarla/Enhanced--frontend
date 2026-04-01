// src/hooks/useSessionTimeout.js
// Auto-logout after VITE_SESSION_TIMEOUT_MS of inactivity (default 15 min).
// Also logs out immediately if the tab becomes hidden during a sensitive operation.

import { useEffect, useRef, useCallback } from 'react'

const TIMEOUT_MS = Number(import.meta.env.VITE_SESSION_TIMEOUT_MS) || 15 * 60 * 1000
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

export function useSessionTimeout({ onTimeout, onWarning, enabled = true }) {
  const lastActivity = useRef(Date.now())
  const intervalRef = useRef(null)
  const warned       = useRef(false)

  const checkTimeout = useCallback(() => {
    if (!enabled) return
    const elapsed = Date.now() - lastActivity.current
    
    // Warn 60s before timeout
    if (elapsed >= (TIMEOUT_MS - 60000) && !warned.current) {
      warned.current = true
      onWarning?.()
    }

    if (elapsed >= TIMEOUT_MS) {
      onTimeout?.()
    }
  }, [enabled, onTimeout, onWarning])

  const reset = useCallback(() => {
    if (!enabled) return
    lastActivity.current = Date.now()
    warned.current = false
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    reset()

    // Routinely check if we've passed the threshold
    intervalRef.current = setInterval(checkTimeout, 1000)

    // Reset on user interactions
    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, reset, { passive: true }))

    return () => {
      clearInterval(intervalRef.current)
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, reset))
    }
  }, [enabled, reset, checkTimeout])

  // Aggressively check when the tab becomes active/visible again
  // (e.g., coming back from sleep mode where JS timers pause)
  useEffect(() => {
    if (!enabled) return
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkTimeout()
      }
    }
    
    const handleFocus = () => {
      checkTimeout()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled, checkTimeout])
}
