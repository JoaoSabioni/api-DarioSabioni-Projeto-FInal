'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, isAuthenticated, clearAuth } from '@/lib/auth'
import {
  getBarberDayBookings,
  getAllBookingsByDate,
  confirmBooking,
  deleteBooking,
  getBarbers,
} from '@/lib/api'
import NewBookingModal from '../components/NewBookingModal'

type Booking = {
  id: string
  barberName: string
  serviceName: string
  serviceDurationMinutes: number
  bookingDate: string
  bookingTime: string
  status: string
  clientName: string
  clientPhone: string
  createdAt: string
  updatedAt: string | null
}

type Barber = {
  id: string
  name: string
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function statusColor(status: string) {
  switch (status) {
    case 'Pending':   return 'border-yellow-500/40 bg-yellow-500/5 text-yellow-400'
    case 'Confirmed': return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
    case 'Cancelled': return 'border-zinc-700/40 bg-zinc-900/30 text-zinc-600 line-through'
    default:          return 'border-white/10 text-zinc-400'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'Pending':   return 'Pendente'
    case 'Confirmed': return 'Confirmada'
    case 'Cancelled': return 'Cancelada'
    default:          return status
  }
}

function statusBadgeColor(status: string) {
  switch (status) {
    case 'Pending':   return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
    case 'Confirmed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'Cancelled': return 'bg-zinc-800 text-zinc-500 border border-zinc-700/30'
    default:          return 'bg-zinc-800 text-zinc-400'
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [filterBarber, setFilterBarber] = useState<string>('all')

  // Auth check
  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    const u = getUser()
    setUser(u)
  }, [router])

  // Fetch barbers (for admin filter)
  useEffect(() => {
    if (!user) return
    if (user.role === 'Admin') {
      getBarbers().then(setBarbers).catch(() => setBarbers([]))
    }
  }, [user])

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      let data: Booking[] = []
      if (user.role === 'Admin') {
        data = await getAllBookingsByDate(formatDate(selectedDate))
      } else if (user.barberId) {
        data = await getBarberDayBookings(user.barberId, formatDate(selectedDate))
      }
      setBookings(data)
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [user, selectedDate])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  // Actions
  const handleConfirm = async (id: string) => {
    setActionLoading(true)
    try { await confirmBooking(id); await fetchBookings(); setSelectedBooking(null) }
    catch { } finally { setActionLoading(false) }
  }

  // Cancelar = apagar permanentemente da base de dados
  const handleCancel = async (id: string) => {
    setActionLoading(true)
    try {
      await deleteBooking(id)
      setSelectedBooking(null)
      // Remove imediatamente da lista local sem esperar pelo fetch
      setBookings(prev => prev.filter(b => b.id !== id))
    }
    catch { } finally { setActionLoading(false) }
  }

  const handleLogout = () => { clearAuth(); router.push('/login') }

  // Week navigation
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedDate)
    const dayOfWeek = d.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    d.setDate(d.getDate() + mondayOffset + i)
    return new Date(d)
  })

  const prevWeek = () => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  const nextWeek = () => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
  const goToday  = () => setSelectedDate(new Date())

  const isToday    = (d: Date) => formatDate(d) === formatDate(new Date())
  const isSelected = (d: Date) => formatDate(d) === formatDate(selectedDate)

  // Filtered bookings (excluir canceladas — foram apagadas)
  const visibleBookings = bookings.filter(b =>
    b.status !== 'Cancelled' &&
    (filterBarber === 'all' || b.barberName === filterBarber)
  )

  // Stats
  const stats = {
    total:     visibleBookings.length,
    confirmed: visibleBookings.filter(b => b.status === 'Confirmed').length,
    pending:   visibleBookings.filter(b => b.status === 'Pending').length,
  }

  // Barber display name
  const barberDisplayName = user?.role === 'Admin'
    ? 'Administrador'
    : barbers.find(b => b.id === user?.barberId)?.name ?? 'Barbeiro'

  const isAdmin = user?.role === 'Admin'

  if (!user) return null

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-zinc-950/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div>
            {/* FIX: text-white explícito para garantir visibilidade */}
            <h1 className="font-serif text-xl uppercase tracking-tight text-white">
              Elegance Studio
            </h1>
            <p className="text-[9px] tracking-[0.4em] text-zinc-500 uppercase mt-0.5">
              {barberDisplayName}
              {isAdmin && (
                <span className="ml-2 text-zinc-700">· Admin</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Admin não cria marcações — só barbeiros */}
            {!isAdmin && (
              <button
                onClick={() => setShowNewBooking(true)}
                className="text-[10px] tracking-[0.2em] uppercase text-black bg-white px-4 py-2 font-bold hover:bg-zinc-200 transition-all"
              >
                + Nova Marcação
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-[10px] tracking-[0.3em] text-zinc-600 uppercase hover:text-zinc-300 transition-colors px-2 py-2"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Week navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevWeek}
              className="w-9 h-9 flex items-center justify-center border border-white/15 hover:border-white/40 text-zinc-400 hover:text-white transition-all text-lg"
            >‹</button>
            <div className="flex items-center gap-4">
              <span className="text-[12px] tracking-[0.3em] uppercase text-zinc-300">
                {MESES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </span>
              <button
                onClick={goToday}
                className="text-[9px] tracking-[0.3em] uppercase text-zinc-600 hover:text-white border border-white/10 hover:border-white/25 px-3 py-1 transition-all"
              >Hoje</button>
            </div>
            <button
              onClick={nextWeek}
              className="w-9 h-9 flex items-center justify-center border border-white/15 hover:border-white/40 text-zinc-400 hover:text-white transition-all text-lg"
            >›</button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 gap-1.5 mb-8">
            {weekDays.map(d => (
              <button
                key={formatDate(d)}
                onClick={() => setSelectedDate(new Date(d))}
                className={`py-3 border text-center transition-all duration-200 ${
                  isSelected(d)
                    ? 'border-white bg-white text-black'
                    : isToday(d)
                    ? 'border-white/30 text-white bg-white/5'
                    : 'border-white/8 text-zinc-500 hover:border-white/25 hover:text-zinc-300'
                }`}
              >
                <span className="block text-[8px] tracking-[0.2em] uppercase">{DIAS[d.getDay()]}</span>
                <span className="block text-[15px] font-semibold mt-1">{d.getDate()}</span>
              </button>
            ))}
          </div>

          {/* Stats bar — sem "Canceladas" porque são apagadas */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Total',       value: stats.total,     color: 'text-white' },
              { label: 'Confirmadas', value: stats.confirmed, color: 'text-emerald-400' },
              { label: 'Pendentes',   value: stats.pending,   color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="border border-white/8 px-4 py-4 bg-zinc-900/30">
                <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] tracking-[0.3em] text-zinc-600 uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Admin barber filter */}
          {isAdmin && barbers.length > 0 && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[9px] tracking-[0.3em] text-zinc-600 uppercase mr-2">Filtrar:</span>
              <button
                onClick={() => setFilterBarber('all')}
                className={`text-[9px] tracking-[0.2em] uppercase px-3 py-1.5 border transition-all ${
                  filterBarber === 'all'
                    ? 'border-white/40 text-white bg-white/5'
                    : 'border-white/10 text-zinc-500 hover:border-white/25'
                }`}
              >Todos</button>
              {barbers.map(b => (
                <button
                  key={b.id}
                  onClick={() => setFilterBarber(b.name)}
                  className={`text-[9px] tracking-[0.2em] uppercase px-3 py-1.5 border transition-all ${
                    filterBarber === b.name
                      ? 'border-white/40 text-white bg-white/5'
                      : 'border-white/10 text-zinc-500 hover:border-white/25'
                  }`}
                >{b.name}</button>
              ))}
            </div>
          )}

          {/* Date label */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] tracking-[0.5em] text-zinc-500 uppercase">
              {selectedDate.getDate()} {MESES[selectedDate.getMonth()]} {selectedDate.getFullYear()} · {DIAS[selectedDate.getDay()]}
            </p>
          </div>

          {/* Bookings list */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 border border-white/5 bg-zinc-900/20 animate-pulse" />
              ))}
            </div>
          ) : visibleBookings.length === 0 ? (
            <div className="border border-white/8 px-6 py-16 text-center bg-zinc-900/10">
              <p className="text-[11px] tracking-[0.3em] text-zinc-700 uppercase mb-5">
                Sem marcações para este dia
              </p>
              {/* Admin não pode criar marcações */}
              {!isAdmin && (
                <button
                  onClick={() => setShowNewBooking(true)}
                  className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase hover:text-white border border-white/10 hover:border-white/25 px-6 py-3 transition-all"
                >
                  + Adicionar marcação
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {visibleBookings
                .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime))
                .map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`flex items-center justify-between px-6 py-4 border transition-all duration-150 text-left hover:brightness-110 ${statusColor(b.status)}`}
                  >
                    <div className="flex items-center gap-5">
                      <span className="text-[15px] font-semibold w-14 shrink-0 tabular-nums">
                        {b.bookingTime}
                      </span>
                      <div>
                        <p className="text-[12px] tracking-[0.08em] uppercase font-semibold leading-tight">
                          {b.clientName}
                        </p>
                        <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase mt-0.5">
                          {b.serviceName} · {b.serviceDurationMinutes} min
                          {isAdmin && b.barberName && (
                            <span className="ml-2 text-zinc-600">· {b.barberName}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[8px] tracking-[0.3em] uppercase px-2.5 py-1 shrink-0 ${statusBadgeColor(b.status)}`}>
                      {statusLabel(b.status)}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </main>

      {/* Booking detail modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm px-6"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-zinc-950 border border-white/15 w-full max-w-md p-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <p className="text-[9px] tracking-[0.6em] text-zinc-500 uppercase">Detalhe da Marcação</p>
              <button onClick={() => setSelectedBooking(null)} className="text-zinc-600 hover:text-white transition-colors text-sm">✕</button>
            </div>

            <div className={`inline-flex items-center px-3 py-1 mb-6 text-[9px] tracking-[0.3em] uppercase ${statusBadgeColor(selectedBooking.status)}`}>
              {statusLabel(selectedBooking.status)}
            </div>

            <div className="space-y-3 mb-8">
              {[
                { label: 'Cliente',  value: selectedBooking.clientName },
                { label: 'Telefone', value: selectedBooking.clientPhone },
                { label: 'Serviço',  value: selectedBooking.serviceName },
                { label: 'Duração',  value: `${selectedBooking.serviceDurationMinutes} min` },
                { label: 'Data',     value: selectedBooking.bookingDate },
                { label: 'Hora',     value: selectedBooking.bookingTime },
                ...(isAdmin ? [{ label: 'Barbeiro', value: selectedBooking.barberName }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase">{row.label}</span>
                  <span className="text-[12px] text-zinc-200">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Actions — admin só pode cancelar (apagar), barbeiro pode confirmar e cancelar */}
            <div className="flex gap-2">
              {!isAdmin && selectedBooking.status === 'Pending' && (
                <button
                  onClick={() => handleConfirm(selectedBooking.id)}
                  disabled={actionLoading}
                  className="flex-1 py-3.5 border border-emerald-500/30 text-emerald-400 text-[10px] tracking-[0.3em] uppercase hover:bg-emerald-500/10 transition-all disabled:opacity-40"
                >
                  {actionLoading ? '...' : 'Confirmar'}
                </button>
              )}
              <button
                onClick={() => handleCancel(selectedBooking.id)}
                disabled={actionLoading}
                className="flex-1 py-3.5 border border-red-500/20 text-red-400 text-[10px] tracking-[0.3em] uppercase hover:bg-red-500/8 transition-all disabled:opacity-40"
              >
                {actionLoading ? '...' : 'Apagar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New booking modal — só para barbeiros */}
      {showNewBooking && !isAdmin && (
        <NewBookingModal
          onClose={() => setShowNewBooking(false)}
          onCreated={() => { fetchBookings(); setShowNewBooking(false) }}
        />
      )}
    </div>
  )
}