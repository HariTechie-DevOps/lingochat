import {
  useState, useEffect, useRef, useCallback, FormEvent,
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useAuthStore, AppUser } from '../stores/authStore'
import { ConvAPI, UserAPI } from '../services/api'
import { wsService } from '../services/websocket'

dayjs.extend(relativeTime)

/* ── Types ──────────────────────────────────────────── */
interface Sender {
  uid: string
  username: string
  displayName: string
  nativeLang: string
  status?: string
}
interface Msg {
  uid:                   string
  conversationId:        string
  sender:                Sender
  originalText:          string
  originalLang:          string
  translatedText?:       string
  targetLang?:           string
  translationConfidence?: number
  hasTranslation?:       boolean
  replyToUid?:           string
  edited:                boolean
  deleted:               boolean
  createdAt:             string
}
interface Conv {
  uid:           string
  type:          'DIRECT' | 'GROUP'
  name?:         string
  participants:  Sender[]
  unreadCount:   number
  lastMessageAt?: string
  lastMessage?:  Msg
}

/* ── Logo SVG ───────────────────────────────────────── */
const LogoSvg = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
    <path d="M4 6C4 5.44772 4.44772 5 5 5H27C27.5523 5 28 5.44772 28 6V20C28 20.5523 27.5523 21 27 21H18L14 27L10 21H5C4.44772 21 4 20.5523 4 20V6Z" fill="#0C0C0C"/>
    <circle cx="11" cy="13" r="2" fill="#0C0C0C"/>
    <circle cx="16" cy="13" r="2" fill="#0C0C0C"/>
    <circle cx="21" cy="13" r="2" fill="#0C0C0C"/>
  </svg>
)

/* ── Utils ──────────────────────────────────────────── */
function initials(name: string) { return name?.[0]?.toUpperCase() ?? '?' }

function getDisplayName(conv: Conv, myUid: string) {
  if (conv.type === 'GROUP') return conv.name || 'Group'
  const other = conv.participants?.find(p => p.uid !== myUid)
  return other?.displayName || 'Chat'
}

function isOnline(conv: Conv, myUid: string) {
  const other = conv.participants?.find(p => p.uid !== myUid)
  return other?.status === 'ONLINE'
}

/* ── Main Page ──────────────────────────────────────── */
export default function ChatPage() {
  const { uid }                   = useParams<{ uid?: string }>()
  const navigate                  = useNavigate()
  const { user, logout }          = useAuthStore()

  const [convs,         setConvs]         = useState<Conv[]>([])
  const [activeConv,    setActiveConv]    = useState<Conv | null>(null)
  const [messages,      setMessages]      = useState<Msg[]>([])
  const [input,         setInput]         = useState('')
  const [search,        setSearch]        = useState('')
  const [searchResults, setSearchResults] = useState<Sender[]>([])
  const [typingUser,    setTypingUser]    = useState<string | null>(null)
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [page,          setPage]          = useState(0)
  const [hasMore,       setHasMore]       = useState(true)
  const [loadingMsgs,   setLoadingMsgs]   = useState(false)

  const endRef      = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout>>()

  /* Load conversations on mount */
  const loadConvs = useCallback(async () => {
    try {
      const res = await ConvAPI.getAll()
      setConvs(res.data)
    } catch {}
  }, [])

  useEffect(() => { loadConvs() }, [loadConvs])

  /* Open conv from URL */
  useEffect(() => {
    if (!uid || convs.length === 0) return
    const c = convs.find(c => c.uid === uid)
    if (c) openConv(c)
  }, [uid, convs.length])

  /* WebSocket listeners */
  useEffect(() => {
    const offMsg = wsService.on('NEW_MESSAGE', (raw: unknown) => {
      const msg = raw as Msg
      if (msg.conversationId === activeConv?.uid) {
        setMessages(prev => [...prev, msg])
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)
      }
      setConvs(prev => prev.map(c =>
        c.uid === msg.conversationId
          ? { ...c, lastMessage: msg, lastMessageAt: msg.createdAt,
              unreadCount: c.uid === activeConv?.uid ? 0 : c.unreadCount + 1 }
          : c
      ))
    })
    const offTr = wsService.on('TRANSLATION_READY', (raw: unknown) => {
      const msg = raw as Msg
      setMessages(prev => prev.map(m =>
        m.uid === msg.uid
          ? { ...m, translatedText: msg.translatedText,
              translationConfidence: msg.translationConfidence, hasTranslation: true }
          : m
      ))
    })
    return () => { offMsg(); offTr() }
  }, [activeConv?.uid])

  /* Open a conversation */
  const openConv = async (conv: Conv) => {
    setActiveConv(conv)
    setMessages([])
    setPage(0)
    setHasMore(true)
    setSidebarOpen(false)
    navigate(`/chat/${conv.uid}`, { replace: true })
    setLoadingMsgs(true)
    try {
      const res = await ConvAPI.getMessages(conv.uid, 0, 50)
      const { content, last } = res.data
      setMessages([...content].reverse())
      setHasMore(!last)
      setConvs(prev => prev.map(c => c.uid === conv.uid ? { ...c, unreadCount: 0 } : c))
      await ConvAPI.markRead(conv.uid)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'auto' }), 50)
    } catch { toast.error('Could not load messages') }
    finally { setLoadingMsgs(false) }
  }

  /* Load older messages on scroll to top */
  const loadOlder = useCallback(async () => {
    if (!activeConv || !hasMore || loadingMsgs) return
    const nextPage = page + 1
    setLoadingMsgs(true)
    try {
      const res = await ConvAPI.getMessages(activeConv.uid, nextPage, 50)
      const { content, last } = res.data
      setMessages(prev => [...[...content].reverse(), ...prev])
      setHasMore(!last)
      setPage(nextPage)
    } catch {}
    finally { setLoadingMsgs(false) }
  }, [activeConv, hasMore, loadingMsgs, page])

  /* Send message */
  const sendMsg = () => {
    const text = input.trim()
    if (!text || !activeConv) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    try {
      wsService.send(activeConv.uid, text)
    } catch {
      toast.error('Send failed — not connected')
      setInput(text)
    }
  }

  /* Textarea key handling */
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMsg()
    }
  }

  /* Auto-resize textarea */
  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    if (activeConv) {
      wsService.typing(activeConv.uid, true)
      clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => wsService.typing(activeConv.uid, false), 1500)
    }
  }

  /* User search */
  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await UserAPI.search(search.trim())
        setSearchResults(res.data)
      } catch {}
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  /* Start a new chat */
  const startChat = async (target: Sender) => {
    try {
      const res = await ConvAPI.create({ participantUids: [target.uid], type: 'DIRECT' })
      await loadConvs()
      openConv(res.data)
      setSearch('')
      setSearchResults([])
    } catch { toast.error('Could not start chat') }
  }

  /* Scroll to top → load older */
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if ((e.target as HTMLDivElement).scrollTop < 80) loadOlder()
  }

  /* ── Render ───────────────────────────────────────── */
  return (
    <div className="shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-top">
          <div className="logo">
            <div className="logo-icon"><LogoSvg /></div>
            <span className="logo-wordmark">Lingo<em>Chat</em></span>
          </div>
          <div className="search">
            <span className="search-ico">⌕</span>
            <input
              placeholder="Search chats or find people…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setSearchResults([]) }}
                style={{ background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:'0.8rem',flexShrink:0 }}
              >✕</button>
            )}
          </div>
        </div>

        {/* User search results */}
        {searchResults.length > 0 && (
          <div className="search-results-panel">
            <div className="sr-label">People</div>
            {searchResults.map(u => (
              <div key={u.uid} className="user-row" onClick={() => startChat(u)}>
                <div className="av">{initials(u.displayName)}</div>
                <div>
                  <div className="user-row-name">{u.displayName}</div>
                  <div className="user-row-handle">@{u.username}</div>
                </div>
                <span className="lang-chip">{u.nativeLang.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Conversation list */}
        <div className="conv-list">
          <button className="new-chat-btn" onClick={() => textareaRef.current?.focus()}>
            <span style={{ fontSize:'1rem' }}>＋</span> New conversation
          </button>

          {convs.length === 0 && !search && (
            <div className="empty" style={{ padding:'30px 16px', height:'auto' }}>
              <div className="empty-ico">💬</div>
              <div className="empty-ttl">No conversations yet</div>
              <div className="empty-sub">Search for someone above to start chatting</div>
            </div>
          )}

          {convs.map(conv => {
            const name     = getDisplayName(conv, user?.uid ?? '')
            const hasUnread = conv.unreadCount > 0
            const online   = isOnline(conv, user?.uid ?? '')
            return (
              <div
                key={conv.uid}
                className={`conv-row${activeConv?.uid === conv.uid ? ' active' : ''}`}
                onClick={() => openConv(conv)}
              >
                <div className={`av${hasUnread ? ' hi' : ''}`}>
                  {initials(name)}
                  {online && <span className="dot" />}
                </div>
                <div className="conv-meta">
                  <div className="conv-head">
                    <span className={`conv-name${hasUnread ? ' bold' : ''}`}>{name}</span>
                    <span className="conv-time">
                      {conv.lastMessageAt ? dayjs(conv.lastMessageAt).fromNow(true) : ''}
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span className={`conv-preview${hasUnread ? ' unread' : ''}`}>
                      {conv.lastMessage?.originalText ?? 'Start a conversation'}
                    </span>
                    {hasUnread && (
                      <span className="badge">{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Me strip */}
        <div className="me-strip">
          <div className="av hi">{initials(user?.displayName ?? 'U')}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="me-name">{user?.displayName}</div>
            <div className="me-lang">{user?.nativeLang?.toUpperCase()} · Online</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Chat area ── */}
      <main className="chat">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="chat-hdr">
              <button className="mobile-back" onClick={() => setSidebarOpen(true)}>‹</button>
              <div className={`av${isOnline(activeConv, user?.uid ?? '') ? ' hi' : ''}`}
                style={{ width:38, height:38, fontSize:'0.85rem', borderRadius:'var(--r-md)' }}>
                {initials(getDisplayName(activeConv, user?.uid ?? ''))}
                {isOnline(activeConv, user?.uid ?? '') && <span className="dot" />}
              </div>
              <div className="chat-hdr-info">
                <div className="chat-hdr-name">{getDisplayName(activeConv, user?.uid ?? '')}</div>
                <div className={`chat-hdr-sub${typingUser ? ' typing' : ''}`}>
                  {typingUser ? `${typingUser} is typing…` :
                    isOnline(activeConv, user?.uid ?? '') ? 'Online' : 'Offline'}
                </div>
              </div>
              <div className="hdr-actions">
                <button className="icon-btn" title="More options">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="msgs" onScroll={onScroll}>
              {loadingMsgs && messages.length === 0 && (
                <div style={{ display:'flex', justifyContent:'center', padding:'20px' }}>
                  <div className="spin" />
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine    = msg.sender.uid === user?.uid
                const prev      = messages[i - 1]
                const showAv    = !isMine && (!prev || prev.sender.uid !== msg.sender.uid)
                const showName  = showAv
                const showDate  = i === 0 || !dayjs(msg.createdAt).isSame(dayjs(prev?.createdAt), 'day')

                return (
                  <div key={msg.uid}>
                    {showDate && (
                      <div className="date-sep">
                        <span>{dayjs(msg.createdAt).format('MMMM D, YYYY')}</span>
                      </div>
                    )}
                    <MsgBubble
                      msg={msg}
                      isMine={isMine}
                      showAv={showAv}
                      showName={showName}
                      viewerLang={user?.nativeLang ?? 'en'}
                    />
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="input-bar">
              <div className="input-wrap">
                <textarea
                  ref={textareaRef}
                  className="msg-textarea"
                  placeholder="Write a message… (Enter to send, Shift+Enter for newline)"
                  value={input}
                  onChange={onInput}
                  onKeyDown={onKeyDown}
                  rows={1}
                />
              </div>
              <button
                className="send-btn"
                onClick={sendMsg}
                disabled={!input.trim()}
                title="Send"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </>
        ) : (
          /* Empty welcome state */
          <div className="empty">
            <div className="empty-ico">🌐</div>
            <div className="empty-ttl">No conversation selected</div>
            <div className="empty-sub">
              Pick a chat from the sidebar or search for someone to connect with — across any language.
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/* ── Message Bubble Component ───────────────────────── */
function MsgBubble({
  msg, isMine, showAv, showName, viewerLang,
}: {
  msg:        Msg
  isMine:     boolean
  showAv:     boolean
  showName:   boolean
  viewerLang: string
}) {
  const [showOrig, setShowOrig] = useState(false)

  const hasTr =
    !!msg.translatedText &&
    msg.originalLang !== viewerLang &&
    msg.translatedText !== msg.originalText

  const pct = msg.translationConfidence != null
    ? Math.round((msg.translationConfidence || 0) * 100)
    : null

  return (
    <motion.div
      className={`msg-row ${isMine ? 'mine' : 'other'}`}
      initial={{ opacity: 0, y: 5, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.16, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div className={`msg-av${showAv ? '' : ' ghost'}`}>
        {showAv ? initials(msg.sender.displayName) : ''}
      </div>

      <div className="msg-wrap">
        {showName && !isMine && (
          <div className="msg-sender-name">{msg.sender.displayName}</div>
        )}

        <div className={`bubble ${isMine ? 'mine' : 'other'}`}>
          {msg.deleted ? <em style={{ opacity:.5 }}>Message deleted</em> : msg.originalText}
        </div>

        {/* Translation card — signature feature */}
        {hasTr && (
          <div className="tcard" onClick={() => setShowOrig(v => !v)}>
            <div className="tcard-head">
              <div className="lang-pair">
                <span className="ltag src">{msg.originalLang?.toUpperCase()}</span>
                <span className="arrow-ico">→</span>
                <span className="ltag tgt">{viewerLang.toUpperCase()}</span>
              </div>
              {pct !== null && (
                <div className="conf-bar">
                  <div className="conf-track">
                    <div className="conf-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="conf-pct">{pct}%</span>
                </div>
              )}
            </div>

            {showOrig ? (
              <>
                <div className="tcard-label">Original</div>
                <div className="tcard-orig">{msg.originalText}</div>
              </>
            ) : (
              <>
                <div className="tcard-label">Translation</div>
                <div className="tcard-text">{msg.translatedText}</div>
              </>
            )}
            <div className="tcard-hint">
              {showOrig ? 'tap to show translation' : 'tap to see original'}
            </div>
          </div>
        )}

        <div className="msg-ts">
          {dayjs(msg.createdAt).format('HH:mm')}
          {isMine && <span className="tick">✓✓</span>}
        </div>
      </div>
    </motion.div>
  )
}
