import { getToken } from './auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5134'

async function request(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, { ...options, headers })

  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new Error('Não autenticado')
  }

  return res
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function login(username: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error('Credenciais inválidas')
  return res.json()
}

// ─── Bookings ────────────────────────────────────────────────────────────────
export async function getBarberBookings(barberId: string) {
  const res = await request(`/api/bookings/barber/${barberId}`)
  if (!res.ok) throw new Error('Erro ao carregar marcações')
  return res.json()
}

export async function getBarberDayBookings(barberId: string, date: string) {
  const res = await request(`/api/bookings/barber/${barberId}/day/${date}`)
  if (!res.ok) throw new Error('Erro ao carregar marcações do dia')
  return res.json()
}

export async function confirmBooking(id: string) {
  const res = await request(`/api/bookings/${id}/confirm`, { method: 'PUT' })
  if (!res.ok) throw new Error('Erro ao confirmar')
  return res.json()
}

export async function cancelBooking(id: string) {
  const res = await request(`/api/bookings/${id}/cancel`, { method: 'PUT' })
  if (!res.ok) throw new Error('Erro ao cancelar')
  return res.json()
}

export async function updateBooking(id: string, data: { bookingDate?: string; bookingTime?: string; serviceId?: string }) {
  const res = await request(`/api/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (res.status === 409) throw new Error('Horário já ocupado')
  if (!res.ok) throw new Error('Erro ao editar')
  return res.json()
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export async function getAllBookings() {
  const res = await request('/api/bookings')
  if (!res.ok) throw new Error('Erro ao carregar')
  return res.json()
}

export async function deleteBooking(id: string) {
  const res = await request(`/api/bookings/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Erro ao apagar')
}