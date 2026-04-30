'use client'

import { useState, useEffect, useMemo } from 'react'
import { getBarbers, getServices, createBooking } from '@/lib/api'
import { getUser } from '@/lib/auth'

interface NewBookingModalProps {
  onClose: () => void
  onCreated: () => void
}

type Barber  = { id: string; name: string }
type Service = { id: string; name: string; durationMinutes: number }

const MESES        = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DIAS_SEMANA  = ['D','S','T','Q','Q','S','S']

// Todos os slots possíveis 09:00–19:00 de 30 em 30 min
const ALL_SLOTS: string[] = []
for (let h = 9; h <= 19; h++) {
  ALL_SLOTS.push(`${String(h).padStart(2,'0')}:00`)
  if (h < 19) ALL_SLOTS.push(`${String(h).padStart(2,'0')}:30`)
}

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number)    { return new Date(y, m, 1).getDay() }
function pad2(n: number)                       { return String(n).padStart(2, '0') }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`
}

export default function NewBookingModal({ onClose, onCreated }: NewBookingModalProps) {
  const currentUser = getUser()
  const isBarber    = currentUser?.role === 'Barber'

  const [barbers,  setBarbers]  = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Serviços
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [pendingServiceId,   setPendingServiceId]   = useState('')

  // Barbeiro
  const [barberId, setBarberId] = useState(
    isBarber && currentUser?.barberId ? currentUser.barberId : ''
  )

  // Cliente
  const [clientName, setClientName] = useState('')
  const [phone,      setPhone]      = useState('+351 ')

  // Data — mini calendário
  const today = new Date()
  const [calYear,     setCalYear]     = useState(today.getFullYear())
  const [calMonth,    setCalMonth]    = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Hora
  const [selectedTime, setSelectedTime] = useState('')

  useEffect(() => {
    getBarbers().then(setBarbers).catch(() => {})
    getServices().then(setServices).catch(() => {})
  }, [])

  // ── Slots disponíveis — filtra horas passadas para o dia de hoje
  const availableSlots = useMemo(() => {
    if (!selectedDay) return ALL_SLOTS

    const chosen = toDateStr(calYear, calMonth, selectedDay)
    const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

    if (chosen !== todayStr) return ALL_SLOTS // dia futuro → todos os slots

    // Hoje: próximo bloco de 30 min a partir de agora
    const now = new Date()
    const totalMins = now.getHours() * 60 + now.getMinutes()
    const nextBlock = Math.ceil((totalMins + 1) / 30) * 30 // mínimo 1 min à frente

    return ALL_SLOTS.filter(slot => {
      const [h, m] = slot.split(':').map(Number)
      return h * 60 + m >= nextBlock
    })
  }, [selectedDay, calYear, calMonth])

  // Se o slot seleccionado desapareceu (mudou o dia para hoje), limpa
  useEffect(() => {
    if (selectedTime && !availableSlots.includes(selectedTime)) {
      setSelectedTime('')
    }
  }, [availableSlots, selectedTime])

  // ── Telefone
  const handlePhone = (val: string) => {
    if (!val.startsWith('+351')) { setPhone('+351 '); return }
    setPhone(val)
  }

  // ── Serviços
  const addService    = () => {
    if (!pendingServiceId || selectedServiceIds.includes(pendingServiceId)) return
    setSelectedServiceIds(prev => [...prev, pendingServiceId])
    setPendingServiceId('')
  }
  const removeService = (id: string) =>
    setSelectedServiceIds(prev => prev.filter(s => s !== id))

  const availableServices = services.filter(s => !selectedServiceIds.includes(s.id))
  const totalDuration     = selectedServiceIds.reduce(
    (acc, id) => acc + (services.find(s => s.id === id)?.durationMinutes ?? 0), 0
  )

  // ── Calendário
  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay    = getFirstDay(calYear, calMonth)

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
    setSelectedDay(null)
  }

  const calCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (calCells.length % 7 !== 0) calCells.push(null)

  const bookingDate = selectedDay ? toDateStr(calYear, calMonth, selectedDay) : ''

  // ── Submit
  const handleSubmit = async () => {
    if (!barberId || selectedServiceIds.length === 0 || !clientName ||
        !phone || phone.trim() === '+351' || !bookingDate || !selectedTime) {
      setError('Preenche todos os campos e adiciona pelo menos um serviço.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createBooking({
        barberId,
        serviceIds: selectedServiceIds,
        clientName,
        clientPhone: phone.replace(/\s+/g, '').trim(),
        bookingDate,
        bookingTime: selectedTime + ':00', // garantir formato HH:mm:ss
      })
      onCreated()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      setError(msg === 'Horário já ocupado'
        ? 'Esse horário já está ocupado.'
        : 'Erro ao criar marcação. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  const autoBarberName = barbers.find(b => b.id === barberId)?.name

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-white/15 w-full max-w-lg p-7 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <p className="text-[9px] tracking-[0.6em] text-zinc-500 uppercase">Nova Marcação</p>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">✕</button>
        </div>

        <div className="space-y-5">

          {/* Barbeiro */}
          <div>
            <label className="block text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-1.5">Barbeiro</label>
            {isBarber ? (
              <div className="w-full bg-zinc-900/50 border border-white/8 text-zinc-300 text-[12px] px-3 py-2.5 flex items-center justify-between">
                <span>{autoBarberName ?? '...'}</span>
                <span className="text-[9px] text-zinc-700 uppercase tracking-wider">Auto</span>
              </div>
            ) : (
              <select
                value={barberId}
                onChange={e => setBarberId(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 text-white text-[12px] px-3 py-2.5 focus:outline-none focus:border-white/30"
              >
                <option value="">Selecionar...</option>
                {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
          </div>

          {/* Serviços */}
          <div>
            <label className="block text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-1.5">
              Serviços
              {totalDuration > 0 && (
                <span className="ml-2 text-zinc-600 normal-case tracking-normal text-[10px]">
                  — {totalDuration} min total
                </span>
              )}
            </label>

            {selectedServiceIds.length > 0 && (
              <div className="mb-2 space-y-1.5">
                {selectedServiceIds.map(id => {
                  const s = services.find(s => s.id === id)
                  if (!s) return null
                  return (
                    <div key={id} className="flex items-center justify-between px-3 py-2 bg-zinc-900/60 border border-white/10">
                      <span className="text-[11px] text-zinc-300">
                        {s.name}
                        <span className="ml-2 text-zinc-600 text-[10px]">{s.durationMinutes} min</span>
                      </span>
                      <button onClick={() => removeService(id)} className="text-zinc-600 hover:text-red-400 transition-colors ml-3">✕</button>
                    </div>
                  )
                })}
              </div>
            )}

            {availableServices.length > 0 ? (
              <div className="flex gap-2">
                <select
                  value=""
                  onChange={e => {
                    const id = e.target.value
                    if (id && !selectedServiceIds.includes(id))
                      setSelectedServiceIds(prev => [...prev, id])
                  }}
                  className="w-full bg-zinc-900 border border-white/10 text-white text-[12px] px-3 py-2.5 focus:outline-none focus:border-white/30"
                >
                  <option value="">Adicionar serviço...</option>
                  {availableServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            ) : selectedServiceIds.length > 0 && (
              <p className="text-[10px] text-zinc-600 tracking-[0.2em] uppercase mt-1">Todos os serviços adicionados</p>
            )}
            {selectedServiceIds.length === 0 && (
              <p className="text-[10px] text-zinc-700 mt-1">Seleciona e adiciona pelo menos um serviço.</p>
            )}
          </div>

          {/* Nome */}
          <div>
            <label className="block text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-1.5">Nome do Cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Nome completo"
              className="w-full bg-zinc-900 border border-white/10 text-white text-[12px] px-3 py-2.5 focus:outline-none focus:border-white/30 placeholder:text-zinc-700"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-1.5">Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => handlePhone(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 text-white text-[12px] px-3 py-2.5 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Calendário */}
          <div>
            <label className="block text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-2">Data</label>
            <div className="border border-white/10 bg-zinc-900/40 p-3">
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white transition-colors text-lg">‹</button>
                <div className="text-center">
                  <span className="text-[11px] tracking-[0.3em] text-zinc-200 uppercase">{MESES[calMonth]}</span>
                  <span className="ml-2 text-[11px] text-zinc-600 font-mono">{calYear}</span>
                </div>
                <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white transition-colors text-lg">›</button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {DIAS_SEMANA.map((d, i) => (
                  <div key={i} className="text-center text-[9px] text-zinc-700 py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {calCells.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} />
                  const isSelected = day === selectedDay
                  const cellDate = new Date(calYear, calMonth, day)
                  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                  const isPast = cellDate < todayDate

                  // Para hoje: verificar se ainda há slots disponíveis
                  const isToday = cellDate.getTime() === todayDate.getTime()
                  const todaySlots = isToday ? (() => {
                    const now = new Date()
                    const totalMins = now.getHours() * 60 + now.getMinutes()
                    const nextBlock = Math.ceil((totalMins + 1) / 30) * 30
                    return ALL_SLOTS.filter(slot => {
                      const [h, m] = slot.split(':').map(Number)
                      return h * 60 + m >= nextBlock
                    })
                  })() : ALL_SLOTS
                  const noSlots = isToday && todaySlots.length === 0

                  return (
                    <button
                      key={day}
                      onClick={() => !isPast && !noSlots && setSelectedDay(day)}
                      disabled={isPast || noSlots}
                      className={`h-8 text-[11px] font-mono flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-white text-black font-semibold'
                          : isPast || noSlots
                          ? 'text-zinc-800 cursor-not-allowed'
                          : 'text-zinc-400 hover:bg-white/8 hover:text-white'
                      }`}
                    >{day}</button>
                  )
                })}
              </div>

              {selectedDay && (
                <p className="text-center text-[10px] text-zinc-500 mt-2 tracking-wider font-mono">
                  {pad2(selectedDay)} / {pad2(calMonth + 1)} / {calYear}
                </p>
              )}
            </div>
          </div>

          {/* Slots de hora — só os disponíveis, sem blackout */}
          <div>
            <label className="block text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-2">
              Hora
              {!selectedDay && (
                <span className="ml-2 text-zinc-700 normal-case tracking-normal text-[10px]">— seleciona primeiro uma data</span>
              )}
            </label>
            <div className="border border-white/10 bg-zinc-900/40 p-3">
              {availableSlots.length === 0 ? (
                <p className="text-center text-[10px] text-zinc-700 py-4">
                  Sem horários disponíveis para hoje.<br/>
                  <span className="text-zinc-800">Seleciona outro dia.</span>
                </p>
              ) : (
                <div className="grid grid-cols-6 gap-1">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot === selectedTime ? '' : slot)}
                      className={`py-2 font-mono text-[10px] tracking-wide transition-all border ${
                        selectedTime === slot
                          ? 'bg-white text-black border-white font-semibold'
                          : 'border-white/8 text-zinc-500 hover:border-white/30 hover:text-zinc-200'
                      }`}
                    >{slot}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {error && (
          <p className="mt-4 text-[10px] text-red-400 tracking-[0.2em]">{error}</p>
        )}

        <div className="flex gap-2 mt-7">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 border border-white/10 text-zinc-500 text-[10px] tracking-[0.3em] uppercase hover:border-white/25 hover:text-white transition-all"
          >Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3.5 bg-white text-black text-[10px] tracking-[0.3em] uppercase font-bold hover:bg-zinc-200 transition-all disabled:opacity-40"
          >{loading ? '...' : 'Criar Marcação'}</button>
        </div>
      </div>
    </div>
  )
}