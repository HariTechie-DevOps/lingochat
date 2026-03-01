import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'

const LANGUAGES = [
  { code:'en', name:'English',    flag:'🇬🇧' },
  { code:'ja', name:'Japanese',   flag:'🇯🇵' },
  { code:'hi', name:'Hindi',      flag:'🇮🇳' },
  { code:'zh', name:'Chinese',    flag:'🇨🇳' },
  { code:'ar', name:'Arabic',     flag:'🇸🇦' },
  { code:'es', name:'Spanish',    flag:'🇪🇸' },
  { code:'fr', name:'French',     flag:'🇫🇷' },
  { code:'de', name:'German',     flag:'🇩🇪' },
  { code:'pt', name:'Portuguese', flag:'🇧🇷' },
  { code:'ru', name:'Russian',    flag:'🇷🇺' },
  { code:'ko', name:'Korean',     flag:'🇰🇷' },
  { code:'ta', name:'Tamil',      flag:'🇮🇳' },
  { code:'te', name:'Telugu',     flag:'🇮🇳' },
  { code:'ml', name:'Malayalam',  flag:'🇮🇳' },
  { code:'bn', name:'Bengali',    flag:'🇧🇩' },
  { code:'tr', name:'Turkish',    flag:'🇹🇷' },
  { code:'it', name:'Italian',    flag:'🇮🇹' },
  { code:'nl', name:'Dutch',      flag:'🇳🇱' },
  { code:'vi', name:'Vietnamese', flag:'🇻🇳' },
  { code:'th', name:'Thai',       flag:'🇹🇭' },
  { code:'id', name:'Indonesian', flag:'🇮🇩' },
  { code:'pl', name:'Polish',     flag:'🇵🇱' },
  { code:'uk', name:'Ukrainian',  flag:'🇺🇦' },
  { code:'el', name:'Greek',      flag:'🇬🇷' },
  { code:'he', name:'Hebrew',     flag:'🇮🇱' },
  { code:'fa', name:'Persian',    flag:'🇮🇷' },
  { code:'ms', name:'Malay',      flag:'🇲🇾' },
  { code:'sw', name:'Swahili',    flag:'🇰🇪' },
  { code:'ur', name:'Urdu',       flag:'🇵🇰' },
  { code:'kn', name:'Kannada',    flag:'🇮🇳' },
  { code:'af', name:'Afrikaans',  flag:'🇿🇦' },
  { code:'ro', name:'Romanian',   flag:'🇷🇴' },
]

const LogoSvg = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M4 6C4 5.44772 4.44772 5 5 5H27C27.5523 5 28 5.44772 28 6V20C28 20.5523 27.5523 21 27 21H18L14 27L10 21H5C4.44772 21 4 20.5523 4 20V6Z" fill="#0C0C0C"/>
    <circle cx="11" cy="13" r="2" fill="#0C0C0C"/>
    <circle cx="16" cy="13" r="2" fill="#0C0C0C"/>
    <circle cx="21" cy="13" r="2" fill="#0C0C0C"/>
  </svg>
)

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '', email: '', password: '', displayName: '', nativeLang: 'en',
  })
  const [showPw,      setShowPw]      = useState(false)
  const [showLangDrop, setShowLangDrop] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const { register } = useAuthStore()

  const s = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const selectedLang = LANGUAGES.find(l => l.code === form.nativeLang) || LANGUAGES[0]

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const { username, email, password, displayName } = form
    if (!username || !email || !password || !displayName) { setError('All fields required'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      await register(form)
      toast.success('Account created! Welcome to LingoChat 🎉')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Try again.')
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
        </div>

        <h2 className="auth-heading">Create account</h2>
        <p className="auth-sub">Join the global conversation</p>

        {error && <div className="err-box">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label className="label">Display name</label>
            <div className="inp-wrap">
              <input placeholder="How others see you" value={form.displayName}
                onChange={e => s('displayName', e.target.value)} />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label className="label">Username</label>
              <div className="inp-wrap">
                <input placeholder="handle" value={form.username}
                  onChange={e => s('username', e.target.value.toLowerCase())}
                  autoCapitalize="none" />
              </div>
            </div>
            <div className="field">
              <label className="label">Email</label>
              <div className="inp-wrap">
                <input type="email" placeholder="you@email.com" value={form.email}
                  onChange={e => s('email', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="field">
            <label className="label">Password</label>
            <div className="inp-wrap">
              <input type={showPw ? 'text' : 'password'} placeholder="Min 8 characters"
                value={form.password} onChange={e => s('password', e.target.value)} />
              <button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)}>
                {showPw ? '◯' : '●'}
              </button>
            </div>
          </div>

          <div className="field">
            <label className="label">Your native language</label>
            <div className="lang-sel">
              <button type="button" className="lang-btn"
                onClick={() => setShowLangDrop(v => !v)}>
                <span className="lang-flag">{selectedLang.flag}</span>
                <span className="lang-name-txt">{selectedLang.name}</span>
                <span className="chev">{showLangDrop ? '▲' : '▼'}</span>
              </button>
              {showLangDrop && (
                <div className="lang-drop">
                  {LANGUAGES.map(lang => (
                    <div key={lang.code}
                      className={`lang-opt${lang.code === form.nativeLang ? ' sel' : ''}`}
                      onClick={() => { s('nativeLang', lang.code); setShowLangDrop(false) }}>
                      <span className="lang-flag">{lang.flag}</span>
                      <span>{lang.name}</span>
                      {lang.code === form.nativeLang && <span className="ck">✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button className="btn-secondary" type="submit" disabled={loading}>
            {loading ? <span className="spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </motion.div>
    </div>
  )
}
