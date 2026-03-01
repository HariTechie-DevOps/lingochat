# LingoChat 🌐

> Real-time multilingual chat. Every message automatically translated for each recipient.

![Design: Neon Ink — dark editorial with citrus yellow + magenta accents]

## The core idea

You type in your language. Your contacts read in theirs. Zero friction, zero copy-paste.

```
Alice (English) sends →  "Good morning! Ready for our meeting?"
Bob   (Japanese) sees →  "おはようございます！会議の準備はできていますか？"
                          EN → JA  ▓▓▓▓▓▓▓▓▓  95%  [tap to see original]
```

## Tech Stack

| Layer       | Tech                                            |
|-------------|--------------------------------------------------|
| Backend     | Java 17 · Spring Boot 3.2 · Spring Security      |
| Database    | MySQL 8 + Flyway migrations                      |
| Cache       | Caffeine (in-memory, local) / Redis (production) |
| Real-time   | WebSocket + STOMP protocol                       |
| Auth        | JWT access (24h) + refresh tokens (7d)           |
| Translation | LibreTranslate (free) / Google / DeepL / mock    |
| Frontend    | React 18 · Vite · TypeScript                     |
| State       | Zustand                                          |
| Animation   | Framer Motion                                    |
| Rate limit  | Bucket4j (per-IP token bucket)                   |

## Quick Start (local)

```bash
# 1. MySQL setup (run once)
mysql -u root -p -e "
  CREATE DATABASE IF NOT EXISTS lingochat CHARACTER SET utf8mb4;
  CREATE USER IF NOT EXISTS 'lingochat_user'@'localhost' IDENTIFIED BY 'lingochat_pass';
  GRANT ALL PRIVILEGES ON lingochat.* TO 'lingochat_user'@'localhost';
  FLUSH PRIVILEGES;
"

# 2. Backend
cd backend && mvn spring-boot:run

# 3. Frontend (new terminal)
cd frontend && npm install && npm run dev

# Open → http://localhost:3000
```

See **SETUP.md** for full step-by-step with troubleshooting.

## Features

- ✅ Register / login / auto token refresh
- ✅ JWT auth + BCrypt (cost 12) + rate limiting
- ✅ Real-time messaging via WebSocket/STOMP
- ✅ Automatic language detection (Unicode script analysis)
- ✅ Async translation — messages deliver instantly, translation arrives <1s
- ✅ Translation cache — same text never translated twice
- ✅ 40+ supported languages
- ✅ Unread counts + read receipts
- ✅ User search
- ✅ Fully responsive (desktop · tablet · mobile)
- ✅ "Neon Ink" design — unique, editorial, dark

## Design

**"Neon Ink"** — dark editorial aesthetic. Charcoal backgrounds, citrus yellow (#F5E642) for primary actions, hot magenta (#FF2D87) for translation highlights.

Typography: *Instrument Serif* (display) + *Plus Jakarta Sans* (body) + *JetBrains Mono* (labels/code)

Every message from a different-language sender shows a **translation card** — tap to toggle between the translated version and the original.

## API Endpoints

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout

GET  /api/v1/users/me
GET  /api/v1/users/search?query=

GET  /api/v1/conversations
POST /api/v1/conversations
GET  /api/v1/conversations/:uid/messages?page=&size=
POST /api/v1/conversations/:uid/read

GET  /api/v1/languages

WebSocket: ws://localhost:8080/ws (SockJS)
  → /app/chat.send         send message
  → /user/queue/messages   receive new messages
  → /user/queue/translations  receive translation updates
```

## License

MIT — use freely, build on it, make it yours.
