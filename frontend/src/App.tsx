import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from './stores/authStore'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage     from './pages/ChatPage'

const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M4 6C4 5.44772 4.44772 5 5 5H27C27.5523 5 28 5.44772 28 6V20C28 20.5523 27.5523 21 27 21H18L14 27L10 21H5C4.44772 21 4 20.5523 4 20V6Z" fill="#0C0C0C"/>
    <circle cx="11" cy="13" r="2" fill="#0C0C0C"/>
    <circle cx="16" cy="13" r="2" fill="#0C0C0C"/>
    <circle cx="21" cy="13" r="2" fill="#0C0C0C"/>
  </svg>
)

export default function App() {
  const { isAuthenticated, loadUser } = useAuthStore()
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    loadUser().finally(() => setBooted(true))
  }, [])

  if (!booted) {
    return (
      <div className="splash">
        <div className="splash-logo-icon">
          <LogoIcon />
        </div>
        <span className="splash-name">LingoChat</span>
        <span className="splash-sub">Chat across every language</span>
        <div className="spin" />
      </div>
    )
  }

  return (
    <Routes>
      {isAuthenticated ? (
        <>
          <Route path="/chat"     element={<ChatPage />} />
          <Route path="/chat/:uid" element={<ChatPage />} />
          <Route path="*"         element={<Navigate to="/chat" replace />} />
        </>
      ) : (
        <>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*"         element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  )
}

export { LogoIcon }
