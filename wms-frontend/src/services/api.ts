import axios from 'axios'
import { API_BASE_URL, AUTH_TOKEN_STORAGE_KEY, ROUTES } from '../constants'
import { clearStoredAuth } from './auth-storage'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      const url = err.config?.url ?? ''
      const isLogin = url.includes('/auth/login')
      if (!isLogin) {
        clearStoredAuth()
        if (!window.location.pathname.startsWith(ROUTES.LOGIN)) {
          window.location.assign(ROUTES.LOGIN)
        }
      }
    }
    return Promise.reject(err)
  },
)
