import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'

const LogoSvg = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M4 6C4 5.44772 4.44772 5 5 5H27C27.5523 5 28 5.44772 28 6V20C28 20.5523 27.5523 21 27 21H18L14 27L10 21H5C4.44772 21 4 20.5523 4 20V6Z" fill="#0C0C0C"/>
    <circle cx="11" cy="13" r="2" fill="#0C0C0C"/>
    <circle cx="16" cy="13" r="2" fill="#0C0C0C"/>
    <circle cx="21" cy="13" r="2" fill="#0C0C0C"/>
  </svg>
)

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const { login } = useAuthStore()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) { setError('All fields required'); return }
    setLoading(true); setError('')
    try {
      await login(username.trim(), password)
      toast.success('Welcome back!')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="auth-logo">
          <div className="auth-logo-icon"><LogoSvg /></div>
          <span className="auth-logo-name">LingoChat</span>
          <span className="auth-logo-tag">Speak freely · understood everywhere</span>
        </div>

        <h2 className="auth-heading">Sign in</h2>
        <p className="auth-sub">Enter your credentials to continue</p>

        {error && <div className="err-box">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label className="label">Username</label>
            <div className="inp-wrap">
              <input
                type="text"
                placeholder="your_username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Password</label>
            <div className="inp-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)}>
                {showPw ? '◯' : '●'}
              </button>
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spin" style={{ borderTopColor: '#0C0C0C' }} /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-foot">
          New here? <Link to="/register">Create account</Link>
        </div>
      </motion.div>
    </div>
  )
}
