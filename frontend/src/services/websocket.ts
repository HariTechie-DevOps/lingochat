import { Client, StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

type Handler = (data: unknown) => void

class WsService {
  private client: Client | null = null
  private handlers = new Map<string, Set<Handler>>()
  private subs     = new Map<string, StompSubscription>()
  private _connected = false

  connect(): Promise<void> {
    const token = localStorage.getItem('lc_access')
    if (!token) return Promise.reject(new Error('No token'))

    return new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS('/ws') as WebSocket,
        connectHeaders:   { Authorization: `Bearer ${token}` },
        heartbeatIncoming: 10_000,
        heartbeatOutgoing: 10_000,
        reconnectDelay:    3_000,
        onConnect: () => {
          this._connected = true
          this._subscribePersonal()
          resolve()
        },
        onStompError:     f  => reject(new Error(f.headers.message)),
        onDisconnect:     ()  => { this._connected = false },
        onWebSocketError: ()  => { this._connected = false },
      })
      this.client.activate()
    })
  }

  private _subscribePersonal() {
    this.client?.subscribe('/user/queue/messages', f => {
      try { this._emit('NEW_MESSAGE', JSON.parse(f.body)?.payload) } catch {}
    })
    this.client?.subscribe('/user/queue/translations', f => {
      try { this._emit('TRANSLATION_READY', JSON.parse(f.body)?.payload) } catch {}
    })
  }

  subscribeConvReceipts(uid: string, cb: Handler): () => void {
    const dest = `/topic/conversation.${uid}.receipts`
    if (!this.subs.has(dest) && this.client?.connected) {
      const sub = this.client.subscribe(dest, f => {
        try { cb(JSON.parse(f.body)) } catch {}
      })
      this.subs.set(dest, sub)
    }
    return () => { this.subs.get(dest)?.unsubscribe(); this.subs.delete(dest) }
  }

  send(conversationId: string, text: string, replyToId?: string) {
    if (!this.client?.connected) throw new Error('Not connected')
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ conversationId, text, replyToId }),
    })
  }

  typing(conversationId: string, typing: boolean) {
    this.client?.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ conversationId, typing }),
    })
  }

  on(event: string, handler: Handler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
    return () => this.handlers.get(event)?.delete(handler)
  }

  private _emit(event: string, data: unknown) {
    this.handlers.get(event)?.forEach(h => h(data))
  }

  disconnect() {
    this.subs.forEach(s => s.unsubscribe())
    this.subs.clear()
    this.client?.deactivate()
    this.client     = null
    this._connected = false
  }

  get connected() { return this._connected }
}

export const wsService = new WsService()
