import { create } from 'zustand'
import { AuthAPI } from '../services/api'
import { wsService } from '../services/websocket'

export interface AppUser {
  uid: string
  username: string
  displayName: string
  avatarUrl?: string
  nativeLang: string
  status: string
}

interface AuthState {
  user: AppUser | null
  accessToken: string | null
  isAuthenticated: boolean
  login:    (username: string, password: string) => Promise<void>
  register: (data: Record<string, string>)        => Promise<void>
  logout:   ()                                    => Promise<void>
  loadUser: ()                                    => Promise<void>
}

const A = 'lc_access'
const R = 'lc_refresh'
const U = 'lc_user'

export const useAuthStore = create<AuthState>((set) => ({
  user:            null,
  accessToken:     null,
  isAuthenticated: false,

  loadUser: async () => {
    const token    = localStorage.getItem(A)
    const userJson = localStorage.getItem(U)
    if (!token || !userJson) return
    try {
      const user = JSON.parse(userJson)
      set({ accessToken: token, user, isAuthenticated: true })
      wsService.connect().catch(() => {})
    } catch {}
  },

  login: async (username, password) => {
    const res = await AuthAPI.login(username, password)
    const { accessToken, refreshToken, user } = res.data
    localStorage.setItem(A, accessToken)
    localStorage.setItem(R, refreshToken)
    localStorage.setItem(U, JSON.stringify(user))
    set({ user, accessToken, isAuthenticated: true })
    await wsService.connect()
  },

  register: async (data) => {
    const res = await AuthAPI.register(data)
    const { accessToken, refreshToken, user } = res.data
    localStorage.setItem(A, accessToken)
    localStorage.setItem(R, refreshToken)
    localStorage.setItem(U, JSON.stringify(user))
    set({ user, accessToken, isAuthenticated: true })
    await wsService.connect()
  },

  logout: async () => {
    try {
      const refresh = localStorage.getItem(R)
      if (refresh) await AuthAPI.logout(refresh)
    } catch {}
    wsService.disconnect()
    localStorage.removeItem(A)
    localStorage.removeItem(R)
    localStorage.removeItem(U)
    set({ user: null, accessToken: null, isAuthenticated: false })
  },
}))
