'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, isAuthenticated, clearAuth } from '@/lib/auth'
import { getBarberDayBookings, confirmBooking, cancelBooking } from '@/lib/api'
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

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function statusColor(status: string) {
  switch (status) {
    case 'Pending': return 'border-yellow-500/40 bg-yellow-500/5 text-yellow-400'
    case 'Confirmed': return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
    case 'Cancelled': return 'border-zinc-600/40 bg-zinc-800/20 text-zinc-500 line-through'
    default: return 'border-white/10 text-zinc-400'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'Pending': return 'PENDENTE'
    case 'Confirmed': return 'CONFIRMADA'
    case 'Cancelled': return 'CANCELADA'
    default: return status
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showNewBooking, setShowNewBooking] = useState(false)

  // Auth check
  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    setUser(getUser())
  }, [router])

  // Fetch bookings for selected date
  const fetchBookings = useCallback(async () => {
    if (!user?.barberId) return
    setLoading(true)
    try {
      const data = await getBarberDayBookings(user.barberId, formatDate(selectedDate))
      setBookings(data)
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [user?.barberId, selectedDate])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  // Actions
  const handleConfirm = async (id: string) => {
    setActionLoading(true)
    try {
      await confirmBooking(id)
      await fetchBookings()
      setSelectedBooking(null)
    } catch { }
    finally { setActionLoading(false) }
  }

  const handleCancel = async (id: string) => {
    setActionLoading(true)
    try {
      await cancelBooking(id)
      await fetchBookings()
      setSelectedBooking(null)
    } catch { }
    finally { setActionLoading(false) }
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
  const goToday = () => setSelectedDate(new Date())

  const isToday = (d: Date) => formatDate(d) === formatDate(new Date())
  const isSelected = (d: Date) => formatDate(d) === formatDate(selectedDate)

  if (!user) return null

  return (
    <div className="min-h-screen bg-black text-white font-sans">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-serif text-xl uppercase tracking-tight">Elegance Studio</h1>
            <p className="text-[9px] tracking-[0.4em] text-zinc-500 uppercase mt-1">
              {user.role === 'Admin' ? 'Administrador' : `Barbeiro — ${user.barberId?.slice(0, 8)}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNewBooking(true)}
              className="text-[10px] tracking-[0.2em] uppercase text-black bg-white px-4 py-2 font-bold hover:bg-zinc-200 transition-all"
            >
              + Nova Marcação
            </button>
            <button onClick={handleLogout} className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase hover:text-white transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Week navigation */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={prevWeek} className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-white/50 text-zinc-400 hover:text-white transition-all">‹</button>
            <div className="flex items-center gap-4">
              <span className="text-[12px] tracking-[0.3em] uppercase text-zinc-300">
                {MESES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </span>
              <button onClick={goToday} className="text-[9px] tracking-[0.3em] uppercase text-zinc-600 hover:text-white border border-white/10 px-3 py-1 transition-all">Hoje</button>
            </div>
            <button onClick={nextWeek} className="w-10 h-10 flex items-center justify-center border border-white/20 hover:border-white/50 text-zinc-400 hover:text-white transition-all">›</button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 gap-2 mb-10">
            {weekDays.map(d => (
              <button
                key={formatDate(d)}
                onClick={() => setSelectedDate(d)}
                className={`py-3 border text-center transition-all duration-200 ${
                  isSelected(d)
                    ? 'border-white bg-white text-black'
                    : isToday(d)
                      ? 'border-white/30 text-white'
                      : 'border-white/10 text-zinc-400 hover:border-white/30'
                }`}
              >
                <span className="block text-[9px] tracking-[0.2em] uppercase">{DIAS[d.getDay()]}</span>
                <span className="block text-[16px] font-semibold mt-1">{d.getDate()}</span>
              </button>
            ))}
          </div>

          {/* Date label */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="w-8 h-px bg-zinc-800" />
              <p className="text-[10px] tracking-[0.6em] text-zinc-400 uppercase">
                {selectedDate.getDate()} {MESES[selectedDate.getMonth()]} {selectedDate.getFullYear()} · {DIAS[selectedDate.getDay()]}
              </p>
            </div>
            <p className="text-[9px] tracking-[0.3em] text-zinc-600 uppercase">
              {bookings.filter(b => b.status !== 'Cancelled').length} marcações
            </p>
          </div>

          {/* Bookings list */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border border-white/30 border-t-white animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="border border-white/10 px-6 py-16 text-center">
              <p className="text-[11px] tracking-[0.3em] text-zinc-600 uppercase mb-4">Sem marcações para este dia</p>
              <button
                onClick={() => setShowNewBooking(true)}
                className="text-[10px] tracking-[0.3em] text-zinc-400 uppercase hover:text-white border border-white/15 px-6 py-3 transition-all"
              >
                + Adicionar marcação
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {bookings.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className={`flex items-center justify-between px-6 py-5 border transition-all duration-200 text-left hover:bg-white/[0.02] ${statusColor(b.status)}`}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-[16px] font-semibold w-14">{b.bookingTime}</span>
                    <div>
                      <p className="text-[13px] tracking-[0.1em] uppercase font-semibold">{b.clientName}</p>
                      <p className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase mt-1">{b.serviceName} · {b.serviceDurationMinutes} min</p>
                    </div>
                  </div>
                  <span className="text-[9px] tracking-[0.3em] uppercase">{statusLabel(b.status)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Booking detail modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm px-6" onClick={() => setSelectedBooking(null)}>
          <div className="bg-black border border-white/20 w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] tracking-[0.6em] text-zinc-400 uppercase">Detalhe da Marcação</p>
              <button onClick={() => setSelectedBooking(null)} className="text-zinc-500 hover:text-white text-[14px]">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-y-4 text-[11px] mb-8">
              <span className="text-zinc-500 uppercase tracking-wider">Cliente</span>
              <span className="text-zinc-200 text-right">{selectedBooking.clientName}</span>
              <span className="text-zinc-500 uppercase tracking-wider">Telefone</span>
              <span className="text-zinc-200 text-right">{selectedBooking.clientPhone}</span>
              <span className="text-zinc-500 uppercase tracking-wider">Serviço</span>
              <span className="text-zinc-200 text-right">{selectedBooking.serviceName}</span>
              <span className="text-zinc-500 uppercase tracking-wider">Duração</span>
              <span className="text-zinc-200 text-right">{selectedBooking.serviceDurationMinutes} min</span>
              <span className="text-zinc-500 uppercase tracking-wider">Data</span>
              <span className="text-zinc-200 text-right">{selectedBooking.bookingDate}</span>
              <span className="text-zinc-500 uppercase tracking-wider">Hora</span>
              <span className="text-zinc-200 text-right">{selectedBooking.bookingTime}</span>
              <span className="text-zinc-500 uppercase tracking-wider">Estado</span>
              <span className={`text-right uppercase tracking-wider ${
                selectedBooking.status === 'Pending' ? 'text-yellow-400'
                  : selectedBooking.status === 'Confirmed' ? 'text-emerald-400'
                  : 'text-zinc-500'
              }`}>{statusLabel(selectedBooking.status)}</span>
            </div>

            {selectedBooking.status !== 'Cancelled' && (
              <div className="flex gap-3">
                {selectedBooking.status === 'Pending' && (
                  <button
                    onClick={() => handleConfirm(selectedBooking.id)}
                    disabled={actionLoading}
                    className="flex-1 py-4 border border-emerald-500/30 text-emerald-400 text-[10px] tracking-[0.3em] uppercase hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? '...' : 'Confirmar'}
                  </button>
                )}
                <button
                  onClick={() => handleCancel(selectedBooking.id)}
                  disabled={actionLoading}
                  className="flex-1 py-4 border border-red-500/30 text-red-400 text-[10px] tracking-[0.3em] uppercase hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  {actionLoading ? '...' : 'Cancelar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New booking modal */}
      {showNewBooking && (
        <NewBookingModal
          onClose={() => setShowNewBooking(false)}
          onCreated={() => fetchBookings()}
        />
      )}
    </div>
  )
}