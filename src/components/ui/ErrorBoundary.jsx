import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', width: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-primary)', padding: '24px',
          textAlign: 'center', fontFamily: 'var(--font-body)'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '500px', padding: '48px 32px',
            borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--danger-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: 8
            }}>
              <AlertCircle size={40} color="var(--danger)" />
            </div>
            
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Something went wrong</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              An unexpected error occurred. This has been logged and we'll look into it.
              In the meantime, you can try reloading the application.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 12, width: '100%' }}>
              <button className="btn btn-primary" onClick={this.handleReload} style={{ flex: 1, justifyContent: 'center' }}>
                <RefreshCw size={16} /> Reload App
              </button>
              <button className="btn btn-secondary" onClick={this.handleGoHome} style={{ flex: 1, justifyContent: 'center' }}>
                <Home size={16} /> Back to Home
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div style={{
                marginTop: 24, padding: 12, background: 'rgba(0,0,0,0.05)',
                borderRadius: 8, fontSize: 11, color: 'var(--text-muted)',
                textAlign: 'left', width: '100%', overflowX: 'auto',
                fontFamily: 'var(--font-mono)'
              }}>
                <strong>Dev Info:</strong> {this.state.error?.toString()}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
