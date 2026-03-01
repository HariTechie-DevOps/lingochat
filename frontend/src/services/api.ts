import axios, { AxiosError } from 'axios'

const BASE = '/api/v1'

export const api = axios.create({
  baseURL: BASE,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('lc_access')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auto-refresh on 401
let refreshing: Promise<string> | null = null

api.interceptors.response.use(
  r => r,
  async (err: AxiosError) => {
    const orig = err.config as any
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      try {
        if (!refreshing) {
          const refresh = localStorage.getItem('lc_refresh')
          refreshing = axios.post(`${BASE}/auth/refresh`, { refreshToken: refresh })
            .then(res => {
              const { accessToken, refreshToken } = res.data
              localStorage.setItem('lc_access',  accessToken)
              localStorage.setItem('lc_refresh', refreshToken)
              refreshing = null
              return accessToken
            })
        }
        const newToken = await refreshing
        orig.headers.Authorization = `Bearer ${newToken}`
        return api(orig)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export const AuthAPI = {
  register: (d: object)              => api.post('/auth/register', d),
  login:    (username: string, password: string) => api.post('/auth/login', { username, password }),
  refresh:  (refreshToken: string)   => api.post('/auth/refresh', { refreshToken }),
  logout:   (refreshToken: string)   => api.post('/auth/logout',  { refreshToken }),
}

export const ConvAPI = {
  getAll:      ()                          => api.get('/conversations'),
  create:      (body: object)              => api.post('/conversations', body),
  getMessages: (uid: string, page = 0, size = 50) =>
    api.get(`/conversations/${uid}/messages?page=${page}&size=${size}`),
  markRead:    (uid: string)               => api.post(`/conversations/${uid}/read`),
}

export const UserAPI = {
  me:     ()              => api.get('/users/me'),
  search: (q: string)     => api.get(`/users/search?query=${encodeURIComponent(q)}`),
}
