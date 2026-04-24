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

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function login(username: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error('Credenciais inválidas')
  return res.json()
}

// ─── Barbers ──────────────────────────────────────────────────────────────────
export async function getBarbers() {
  const res = await fetch(`${API}/api/barbers`)
  if (!res.ok) throw new Error('Erro ao carregar barbeiros')
  return res.json()
}

// ─── Services ─────────────────────────────────────────────────────────────────
export async function getServices() {
  const res = await fetch(`${API}/api/services`)
  if (!res.ok) throw new Error('Erro ao carregar serviços')
  return res.json()
}

// ─── Availability ─────────────────────────────────────────────────────────────
export async function getAvailability(barberId: string, date: string, serviceId: string) {
  const res = await request(`/api/availability?barberId=${barberId}&date=${date}&serviceId=${serviceId}`)
  if (!res.ok) throw new Error('Erro ao carregar disponibilidade')
  return res.json()
}

// ─── Bookings (Barber) ────────────────────────────────────────────────────────
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

// ─── Bookings (Admin) ─────────────────────────────────────────────────────────
export async function getAllBookings() {
  const res = await request('/api/bookings')
  if (!res.ok) throw new Error('Erro ao carregar marcações')
  return res.json()
}

export async function getAllBookingsByDate(date: string) {
  const res = await request(`/api/bookings?date=${date}`)
  if (!res.ok) {
    // fallback: tentar sem filtro de data
    const res2 = await request('/api/bookings')
    if (!res2.ok) throw new Error('Erro ao carregar marcações')
    const all = await res2.json()
    // filtrar no cliente por data
    return all.filter((b: { bookingDate: string }) => b.bookingDate === date)
  }
  return res.json()
}

// ─── Booking actions ──────────────────────────────────────────────────────────
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

export async function createBooking(data: {
  barberId: string
  serviceId: string
  bookingDate: string
  bookingTime: string
  clientName: string
  clientPhone: string
}) {
  const res = await request('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (res.status === 409) throw new Error('Horário já ocupado')
  if (!res.ok) throw new Error('Erro ao criar marcação')
  return res.json()
}

export async function deleteBooking(id: string) {
  const res = await request(`/api/bookings/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Erro ao apagar')
}

// ─── Lookup público ───────────────────────────────────────────────────────────
export async function lookupBooking(phone: string) {
  const res = await fetch(`${API}/api/bookings/lookup?phone=${encodeURIComponent(phone)}`)
  if (!res.ok) throw new Error('Marcação não encontrada')
  return res.json()
}