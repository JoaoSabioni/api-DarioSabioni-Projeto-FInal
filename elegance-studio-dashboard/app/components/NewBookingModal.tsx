'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, isAuthenticated, clearAuth } from '@/lib/auth'
import {
  getBarberDayBookings,
  getAllBookingsByDate,
  confirmBooking,
  cancelBooking,
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

type Barber = { id: string; name: string }
type ViewMode = 'list' | 'calendar'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab']

const HOUR_START  = 9
const HOUR_END    = 19
const TOTAL_HOURS = HOUR_END - HOUR_START
const HOUR_HEIGHT = 80 // px per hour

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function statusColor(status: string) {
  switch (status) {
    case 'Pending':   return 'border-yellow-500/40 bg-yellow-500/5 text-yellow-400'
    case 'Confirmed': return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
    case 'Cancelled': return 'border-zinc-700/40 bg-zinc-900/30 text-zinc-600 line-through'
    default:          return 'border-white/10 text-zinc-400'
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

function calendarBlockColor(status: string) {
  switch (status) {
    case 'Pending':   return 'bg-yellow-500/15 border-l-2 border-yellow-400 text-yellow-200 hover:bg-yellow-500/25'
    case 'Confirmed': return 'bg-emerald-500/15 border-l-2 border-emerald-400 text-emerald-200 hover:bg-emerald-500/25'
    case 'Cancelled': return 'bg-zinc-800/40 border-l-2 border-zinc-600 text-zinc-500 hover:bg-zinc-800/60'
    default:          return 'bg-zinc-700/20 border-l-2 border-zinc-500 text-zinc-400'
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

// ── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({
  bookings,
  isAdmin,
  filterBarber,
  onBookingClick,
}: {
  bookings: Booking[]
  isAdmin: boolean
  filterBarber: string
  onBookingClick: (b: Booking) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const visible = bookings.filter(b =>
    filterBarber === 'all' || b.barberName === filterBarber
  )

  useEffect(() => {
    if (!containerRef.current) return
    const first = visible.find(b => b.status !== 'Cancelled')
    if (first) {
      const mins = timeToMinutes(first.bookingTime) - HOUR_START * 60
      containerRef.current.scrollTop = Math.max(0, (mins / 60) * HOUR_HEIGHT - 40)
    }
  }, [bookings])

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i)

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowTop = ((nowMinutes - HOUR_START * 60) / 60) * HOUR_HEIGHT
  const showNow = nowMinutes >= HOUR_START * 60 && nowMinutes <= HOUR_END * 60

  return (
    <div ref={containerRef} className="overflow-y-auto" style={{ maxHeight: `${TOTAL_HOURS * HOUR_HEIGHT + 40}px` }}>
      <div className="relative flex" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>

        {/* Hour labels */}
        <div className="shrink-0 w-14 relative select-none">
          {hours.map(h => (
            <div key={h} className="absolute right-3 text-[10px] text-zinc-600 tabular-nums"
              style={{ top: `${(h - HOUR_START) * HOUR_HEIGHT - 7}px` }}>
              {String(h).padStart(2,'0')}:00
            </div>
          ))}
        </div>

        {/* Grid area */}
        <div className="relative flex-1 border-l border-white/8">

          {/* Full hour lines */}
          {hours.map(h => (
            <div key={h} className="absolute left-0 right-0 border-t border-white/6"
              style={{ top: `${(h - HOUR_START) * HOUR_HEIGHT}px` }} />
          ))}

          {/* Half-hour dashed lines */}
          {hours.slice(0,-1).map(h => (
            <div key={`h-${h}`} className="absolute left-0 right-0 border-t border-white/3 border-dashed"
              style={{ top: `${(h - HOUR_START) * HOUR_HEIGHT + HOUR_HEIGHT/2}px` }} />
          ))}

          {/* Now indicator */}
          {showNow && (
            <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
              style={{ top: `${nowTop}px` }}>
              <div className="w-2 h-2 rounded-full bg-red-400 -ml-1 shrink-0" />
              <div className="flex-1 border-t border-red-400/50" />
            </div>
          )}

          {/* Booking blocks */}
          {visible.map(b => {
            const startMins = timeToMinutes(b.bookingTime) - HOUR_START * 60
            const topPx     = (startMins / 60) * HOUR_HEIGHT
            const heightPx  = Math.max((b.serviceDurationMinutes / 60) * HOUR_HEIGHT, 28)

            return (
              <button key={b.id} onClick={() => onBookingClick(b)}
                className={`absolute left-2 right-2 px-2.5 py-1.5 text-left transition-all z-10 overflow-hidden ${calendarBlockColor(b.status)}`}
                style={{ top: `${topPx}px`, height: `${heightPx}px` }}>
                <p className="text-[11px] font-semibold leading-tight truncate">
                  {b.bookingTime} · {b.clientName}
                </p>
                {heightPx > 36 && (
                  <p className="text-[9px] opacity-60 truncate mt-0.5">
                    {b.serviceName}{isAdmin && b.barberName ? ` · ${b.barberName}` : ''}
                  </p>
                )}
              </button>
            )
          })}

          {visible.filter(b => b.status !== 'Cancelled').length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[10px] tracking-[0.3em] text-zinc-700 uppercase">Sem marcacoes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser]                       = useState<ReturnType<typeof getUser>>(null)
  const [barbers, setBarbers]                 = useState<Barber[]>([])
  const [selectedDate, setSelectedDate]       = useState(new Date())
  const [bookings, setBookings]               = useState<Booking[]>([])
  const [loading, setLoading]                 = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [actionLoading, setActionLoading]     = useState(false)
  const [showNewBooking, setShowNewBooking]   = useState(false)
  const [filterBarber, setFilterBarber]       = useState<string>('all')
  const [viewMode, setViewMode]               = useState<ViewMode>('list')

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    setUser(getUser())
  }, [router])

  useEffect(() => {
    if (user?.role === 'Admin') getBarbers().then(setBarbers).catch(() => {})
  }, [user])

  const fetchBookings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = user.role === 'Admin'
        ? await getAllBookingsByDate(formatDate(selectedDate))
        : user.barberId
          ? await getBarberDayBookings(user.barberId, formatDate(selectedDate))
          : []
      setBookings(data)
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [user, selectedDate])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const handleConfirm = async (id: string) => {
    setActionLoading(true)
    try { await confirmBooking(id); await fetchBookings(); setSelectedBooking(null) }
    catch {} finally { setActionLoading(false) }
  }

  const handleCancel = async (id: string) => {
    setActionLoading(true)
    try { await cancelBooking(id); await fetchBookings(); setSelectedBooking(null) }
    catch {} finally { setActionLoading(false) }
  }

  const handleLogout = () => { clearAuth(); router.push('/login') }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedDate)
    const dow = d.getDay()
    d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow) + i)
    return new Date(d)
  })

  const prevWeek = () => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n })
  const nextWeek = () => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n })
  const goToday  = () => setSelectedDate(new Date())

  const isToday    = (d: Date) => formatDate(d) === formatDate(new Date())
  const isSelected = (d: Date) => formatDate(d) === formatDate(selectedDate)

  const visibleBookings = bookings.filter(b =>
    filterBarber === 'all' || b.barberName === filterBarber
  )

  const stats = {
    total:     visibleBookings.filter(b => b.status !== 'Cancelled').length,
    confirmed: visibleBookings.filter(b => b.status === 'Confirmed').length,
    pending:   visibleBookings.filter(b => b.status === 'Pending').length,
    cancelled: visibleBookings.filter(b => b.status === 'Cancelled').length,
  }

  const barberDisplayName = user?.role === 'Admin'
    ? 'Administrador'
    : barbers.find(b => b.id === user?.barberId)?.name ?? 'Barbeiro'

  if (!user) return null

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-zinc-950/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-serif text-xl uppercase tracking-tight">Elegance Studio</h1>
            <p className="text-[9px] tracking-[0.4em] text-zinc-500 uppercase mt-0.5">
              {barberDisplayName}
              {user.role === 'Admin' && <span className="ml-2 text-zinc-700">Admin</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNewBooking(true)}
              className="text-[10px] tracking-[0.2em] uppercase text-black bg-white px-4 py-2 font-bold hover:bg-zinc-200 transition-all">
              + Nova Marcacao
            </button>
            <button onClick={handleLogout}
              className="text-[10px] tracking-[0.3em] text-zinc-600 uppercase hover:text-zinc-300 transition-colors px-2 py-2">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Week nav */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevWeek}
              className="w-9 h-9 flex items-center justify-center border border-white/15 hover:border-white/40 text-zinc-400 hover:text-white transition-all text-lg">
              &lsaquo;
            </button>
            <div className="flex items-center gap-4">
              <span className="text-[12px] tracking-[0.3em] uppercase text-zinc-300">
                {MESES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </span>
              <button onClick={goToday}
                className="text-[9px] tracking-[0.3em] uppercase text-zinc-600 hover:text-white border border-white/10 hover:border-white/25 px-3 py-1 transition-all">
                Hoje
              </button>
            </div>
            <button onClick={nextWeek}
              className="w-9 h-9 flex items-center justify-center border border-white/15 hover:border-white/40 text-zinc-400 hover:text-white transition-all text-lg">
              &rsaquo;
            </button>
          </div>

          {/* Week strip */}
          <div className="grid grid-cols-7 gap-1.5 mb-8">
            {weekDays.map(d => (
              <button key={formatDate(d)} onClick={() => setSelectedDate(new Date(d))}
                className={`py-3 border text-center transition-all duration-200 ${
                  isSelected(d) ? 'border-white bg-white text-black'
                  : isToday(d)  ? 'border-white/30 text-white bg-white/5'
                  : 'border-white/8 text-zinc-500 hover:border-white/25 hover:text-zinc-300'
                }`}>
                <span className="block text-[8px] tracking-[0.2em] uppercase">{DIAS[d.getDay()]}</span>
                <span className="block text-[15px] font-semibold mt-1">{d.getDate()}</span>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total',      value: stats.total,     color: 'text-white' },
              { label: 'Confirm.',   value: stats.confirmed, color: 'text-emerald-400' },
              { label: 'Pendentes',  value: stats.pending,   color: 'text-yellow-400' },
              { label: 'Canceladas', value: stats.cancelled, color: 'text-zinc-600' },
            ].map(s => (
              <div key={s.label} className="border border-white/8 px-4 py-3 bg-zinc-900/30">
                <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] tracking-[0.3em] text-zinc-600 uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {user.role === 'Admin' && barbers.length > 0 && (
                <>
                  <span className="text-[9px] tracking-[0.3em] text-zinc-600 uppercase">Barbeiro:</span>
                  <button onClick={() => setFilterBarber('all')}
                    className={`text-[9px] tracking-[0.2em] uppercase px-3 py-1.5 border transition-all ${
                      filterBarber === 'all' ? 'border-white/40 text-white bg-white/5' : 'border-white/10 text-zinc-500 hover:border-white/25'
                    }`}>Todos</button>
                  {barbers.map(b => (
                    <button key={b.id} onClick={() => setFilterBarber(b.name)}
                      className={`text-[9px] tracking-[0.2em] uppercase px-3 py-1.5 border transition-all ${
                        filterBarber === b.name ? 'border-white/40 text-white bg-white/5' : 'border-white/10 text-zinc-500 hover:border-white/25'
                      }`}>{b.name}</button>
                  ))}
                </>
              )}
              <span className="text-[10px] tracking-[0.4em] text-zinc-600 uppercase">
                {selectedDate.getDate()} {MESES[selectedDate.getMonth()]} {selectedDate.getFullYear()} {DIAS[selectedDate.getDay()]}
              </span>
            </div>

            {/* View toggle */}
            <div className="flex border border-white/10 shrink-0">
              <button onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-[9px] tracking-[0.2em] uppercase transition-all ${
                  viewMode === 'list' ? 'bg-white text-black font-bold' : 'text-zinc-500 hover:text-white'
                }`}>
                Lista
              </button>
              <button onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-[9px] tracking-[0.2em] uppercase transition-all border-l border-white/10 ${
                  viewMode === 'calendar' ? 'bg-white text-black font-bold' : 'text-zinc-500 hover:text-white'
                }`}>
                Calendario
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 border border-white/5 bg-zinc-900/20 animate-pulse" />)}
            </div>

          ) : viewMode === 'list' ? (
            visibleBookings.length === 0 ? (
              <div className="border border-white/8 px-6 py-16 text-center bg-zinc-900/10">
                <p className="text-[11px] tracking-[0.3em] text-zinc-700 uppercase mb-5">Sem marcacoes para este dia</p>
                <button onClick={() => setShowNewBooking(true)}
                  className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase hover:text-white border border-white/10 hover:border-white/25 px-6 py-3 transition-all">
                  + Adicionar marcacao
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {[...visibleBookings]
                  .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime))
                  .map(b => (
                    <button key={b.id} onClick={() => setSelectedBooking(b)}
                      className={`flex items-center justify-between px-6 py-4 border transition-all duration-150 text-left hover:brightness-110 ${statusColor(b.status)}`}>
                      <div className="flex items-center gap-5">
                        <span className="text-[15px] font-semibold w-14 shrink-0 tabular-nums">{b.bookingTime}</span>
                        <div>
                          <p className="text-[12px] tracking-[0.08em] uppercase font-semibold leading-tight">{b.clientName}</p>
                          <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase mt-0.5">
                            {b.serviceName} {b.serviceDurationMinutes} min
                            {user.role === 'Admin' && b.barberName && <span className="ml-2 text-zinc-600">{b.barberName}</span>}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[8px] tracking-[0.3em] uppercase px-2.5 py-1 shrink-0 ${statusBadgeColor(b.status)}`}>
                        {statusLabel(b.status)}
                      </span>
                    </button>
                  ))}
              </div>
            )

          ) : (
            <div className="border border-white/8 bg-zinc-900/10 p-4">
              <CalendarView
                bookings={bookings}
                isAdmin={user.role === 'Admin'}
                filterBarber={filterBarber}
                onBookingClick={setSelectedBooking}
              />
            </div>
          )}

        </div>
      </main>

      {/* Detail modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm px-6"
          onClick={() => setSelectedBooking(null)}>
          <div className="bg-zinc-950 border border-white/15 w-full max-w-md p-8 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[9px] tracking-[0.6em] text-zinc-500 uppercase">Detalhe da Marcacao</p>
              <button onClick={() => setSelectedBooking(null)} className="text-zinc-600 hover:text-white transition-colors">x</button>
            </div>

            <div className={`inline-flex items-center px-3 py-1 mb-6 text-[9px] tracking-[0.3em] uppercase ${statusBadgeColor(selectedBooking.status)}`}>
              {statusLabel(selectedBooking.status)}
            </div>

            <div className="space-y-3 mb-8">
              {[
                { label: 'Cliente',  value: selectedBooking.clientName },
                { label: 'Telefone', value: selectedBooking.clientPhone },
                { label: 'Servico',  value: selectedBooking.serviceName },
                { label: 'Duracao',  value: `${selectedBooking.serviceDurationMinutes} min` },
                { label: 'Data',     value: selectedBooking.bookingDate },
                { label: 'Hora',     value: selectedBooking.bookingTime },
                ...(user.role === 'Admin' ? [{ label: 'Barbeiro', value: selectedBooking.barberName }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase">{row.label}</span>
                  <span className="text-[12px] text-zinc-200">{row.value}</span>
                </div>
              ))}
            </div>

            {selectedBooking.status !== 'Cancelled' && (
              <div className="flex gap-2">
                {selectedBooking.status === 'Pending' && (
                  <button onClick={() => handleConfirm(selectedBooking.id)} disabled={actionLoading}
                    className="flex-1 py-3.5 border border-emerald-500/30 text-emerald-400 text-[10px] tracking-[0.3em] uppercase hover:bg-emerald-500/10 transition-all disabled:opacity-40">
                    {actionLoading ? '...' : 'Confirmar'}
                  </button>
                )}
                <button onClick={() => handleCancel(selectedBooking.id)} disabled={actionLoading}
                  className="flex-1 py-3.5 border border-red-500/20 text-red-400 text-[10px] tracking-[0.3em] uppercase hover:bg-red-500/10 transition-all disabled:opacity-40">
                  {actionLoading ? '...' : 'Cancelar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showNewBooking && (
        <NewBookingModal
          onClose={() => setShowNewBooking(false)}
          onCreated={() => { fetchBookings(); setShowNewBooking(false) }}
        />
      )}
    </div>
  )
}