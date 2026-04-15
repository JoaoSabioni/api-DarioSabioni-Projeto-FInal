const TOKEN_KEY = 'elegance_token'
const USER_KEY = 'elegance_user'

export type UserInfo = {
  token: string
  role: string
  barberId: string | null
  expiresAt: string
}

export function saveAuth(data: UserInfo) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(data))
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): UserInfo | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function clearAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated(): boolean {
  const user = getUser()
  if (!user) return false
  return new Date(user.expiresAt) > new Date()
}