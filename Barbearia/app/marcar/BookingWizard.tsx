'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '../components/Navbar'

// ─── Config ──────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5134'

// ─── Types ───────────────────────────────────────────────────────────────────
type Barber = { id: string; name: string; specialty: string; phone: string }
type Service = { id: string; name: string; price: number; durationMinutes: number }
type Step = 1 | 2 | 3 | 4 | 5 | 6

// ─── Fotos dos barbeiros (mapear por nome) ───────────────────────────────────
const BARBER_PHOTOS: Record<string, string> = {
  'Edi': '/Fotos_edi/edi2.png',
  'Tomas': '/Fotos_Tomas/tomas2.png',
  'Abreu': '/Fotos_Abreu/abreuPrincipal.jpg',
}

const BARBER_ROLES: Record<string, string> = {
  'Edi': 'Fundador',
  'Tomas': 'Colaborador',
  'Abreu': 'Colaborador',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDateApi = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function BookingWizard() {
  // ─── State ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())

  // ─── Fetch barbers ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/barbers`)
      .then(r => r.json())
      .then(setBarbers)
      .catch(() => setError('Erro ao carregar barbeiros.'))
  }, [])

  // ─── Fetch services ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/services`)
      .then(r => r.json())
      .then(setServices)
      .catch(() => setError('Erro ao carregar serviços.'))
  }, [])

  // ─── Fetch slots ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedBarber || !selectedService || !selectedDate) return
    setLoading(true)
    setSlots([])
    setSelectedSlot(null)

    const dateStr = formatDateApi(selectedDate)
    fetch(`${API}/api/availability?barberId=${selectedBarber.id}&serviceId=${selectedService.id}&date=${dateStr}`)
      .then(r => r.json())
      .then(data => {
        setSlots(data.availableSlots || [])
        setLoading(false)
      })
      .catch(() => {
        setError('Erro ao carregar horários.')
        setLoading(false)
      })
  }, [selectedBarber, selectedService, selectedDate])

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedSlot) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: selectedBarber.id,
          serviceId: selectedService.id,
          bookingDate: formatDateApi(selectedDate),
          bookingTime: selectedSlot,
          clientName,
          clientPhone,
        }),
      })

      if (res.status === 201) {
        setSuccess(true)
        setStep(6)
      } else if (res.status === 409) {
        setError('Este horário já foi reservado. Escolha outro.')
        setSlots(prev => prev.filter(s => s !== selectedSlot))
        setSelectedSlot(null)
        setStep(4)
      } else {
        setError('Erro ao criar marcação. Tente novamente.')
      }
    } catch {
      setError('Erro de ligação ao servidor.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Calendar ────────────────────────────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 60)

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay()

  const canGoBack = calendarYear > today.getFullYear() ||
    (calendarYear === today.getFullYear() && calendarMonth > today.getMonth())
  const canGoForward = new Date(calendarYear, calendarMonth + 1, 1) <= maxDate

  const isDateSelectable = (day: number) => {
    const d = new Date(calendarYear, calendarMonth, day)
    d.setHours(0, 0, 0, 0)
    return d >= today && d <= maxDate
  }

  const isDateSelected = (day: number) =>
    selectedDate?.getFullYear() === calendarYear &&
    selectedDate?.getMonth() === calendarMonth &&
    selectedDate?.getDate() === day

  // ─── Steps config ────────────────────────────────────────────────────────
  const STEPS = [
    { num: 1, label: 'Barbeiro' },
    { num: 2, label: 'Serviço' },
    { num: 3, label: 'Data' },
    { num: 4, label: 'Hora' },
    { num: 5, label: 'Dados' },
    { num: 6, label: 'Confirmação' },
  ]

  return (
    <div className="bg-black text-white font-sans selection:bg-white selection:text-black min-h-screen overflow-x-hidden">
      <Navbar activePage="marcar" />

      {/* Header */}
      <section className="pt-36 md:pt-44 pb-12 md:pb-16 px-6 md:px-8 border-b border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 text-zinc-400 text-[11px] tracking-[0.5em] uppercase mb-8">
            <span className="w-12 h-px bg-zinc-500" /> MARCAÇÃO ONLINE
          </div>
          <h1 className="font-serif text-[clamp(3rem,10vw,90px)] leading-[0.85] font-medium uppercase tracking-tighter">MARCAR</h1>
        </div>
      </section>

      {/* Progress */}
      <div className="px-6 md:px-8 py-8 border-b border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 flex items-center justify-center border text-[10px] font-semibold transition-all duration-300 ${
                  step >= s.num ? 'border-white bg-white text-black' : 'border-white/20 text-zinc-600'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`text-[8px] tracking-[0.2em] uppercase mt-2 hidden sm:block transition-colors ${
                  step >= s.num ? 'text-zinc-300' : 'text-zinc-700'
                }`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 sm:w-12 md:w-20 h-px mx-1 sm:mx-2 transition-colors ${
                  step > s.num ? 'bg-white/40' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 md:px-8 pt-6">
          <div className="max-w-3xl mx-auto border border-red-500/30 bg-red-500/5 px-6 py-4 flex items-center justify-between">
            <span className="text-[11px] tracking-wider text-red-400">{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-white text-[16px] ml-4">×</button>
          </div>
        </div>
      )}

      {/* Content */}
      <section className="px-6 md:px-8 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">

          {/* STEP 1: Barbeiro */}
          {step === 1 && (
            <div>
              <p className="text-[10px] tracking-[0.8em] text-zinc-300 uppercase mb-8">01 · Escolhe o teu barbeiro</p>
              <div className="flex flex-col gap-3">
                {barbers.map(b => (
                  <button
                    key={b.id}
                    onClick={() => { setSelectedBarber(b); setStep(2) }}
                    className={`flex items-center gap-5 px-6 py-5 border transition-all duration-300 group ${
                      selectedBarber?.id === b.id ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="relative w-14 h-14 overflow-hidden flex-shrink-0">
                      <Image src={BARBER_PHOTOS[b.name] || '/logo.png'} alt={b.name} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-[14px] tracking-[0.15em] uppercase font-semibold group-hover:text-white transition-colors">{b.name}</p>
                      <p className="text-[10px] tracking-[0.4em] text-zinc-400 uppercase">{BARBER_ROLES[b.name] || 'Barbeiro'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Serviço */}
          {step === 2 && (
            <div>
              <p className="text-[10px] tracking-[0.8em] text-zinc-300 uppercase mb-8">02 · Escolhe o serviço</p>
              <div className="flex flex-col gap-2">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedService(s); setStep(3) }}
                    className={`flex items-center justify-between px-6 py-5 border text-left transition-all duration-300 group ${
                      selectedService?.id === s.id ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div>
                      <p className="text-[13px] tracking-[0.15em] uppercase font-semibold group-hover:text-white transition-colors">{s.name}</p>
                      <p className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase mt-1">{s.durationMinutes} min</p>
                    </div>
                    <span className="font-serif text-[28px] text-zinc-400 group-hover:text-white transition-colors">{s.price}€</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="mt-8 text-[10px] tracking-[0.3em] text-zinc-500 uppercase hover:text-white flex items-center gap-3 transition-colors">
                <span className="w-6 h-px bg-zinc-700" /> Voltar
              </button>
            </div>
          )}

          {/* STEP 3: Data */}
          {step === 3 && (
            <div>
              <p className="text-[10px] tracking-[0.8em] text-zinc-300 uppercase mb-8">03 · Escolhe a data</p>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1) } else setCalendarMonth(m => m - 1) }}
                  disabled={!canGoBack}
                  className={`w-10 h-10 flex items-center justify-center border transition-all ${canGoBack ? 'border-white/20 hover:border-white/50 text-zinc-400 hover:text-white' : 'border-white/5 text-zinc-800 cursor-not-allowed'}`}
                >‹</button>
                <span className="text-[12px] tracking-[0.4em] uppercase text-zinc-300">{MESES[calendarMonth]} {calendarYear}</span>
                <button
                  onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1) } else setCalendarMonth(m => m + 1) }}
                  disabled={!canGoForward}
                  className={`w-10 h-10 flex items-center justify-center border transition-all ${canGoForward ? 'border-white/20 hover:border-white/50 text-zinc-400 hover:text-white' : 'border-white/5 text-zinc-800 cursor-not-allowed'}`}
                >›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DIAS_SEMANA.map(d => (
                  <div key={d} className="text-center text-[9px] tracking-[0.2em] text-zinc-600 uppercase py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const selectable = isDateSelectable(day)
                  const selected = isDateSelected(day)
                  return (
                    <button key={day} disabled={!selectable}
                      onClick={() => { setSelectedDate(new Date(calendarYear, calendarMonth, day)); setStep(4) }}
                      className={`py-3 text-[12px] border transition-all duration-200 ${
                        selected ? 'border-white bg-white text-black font-semibold'
                          : selectable ? 'border-white/10 text-zinc-300 hover:border-white/40 hover:text-white'
                          : 'border-transparent text-zinc-800 cursor-not-allowed'
                      }`}>{day}</button>
                  )
                })}
              </div>
              <button onClick={() => setStep(2)} className="mt-8 text-[10px] tracking-[0.3em] text-zinc-500 uppercase hover:text-white flex items-center gap-3 transition-colors">
                <span className="w-6 h-px bg-zinc-700" /> Voltar
              </button>
            </div>
          )}

          {/* STEP 4: Hora */}
          {step === 4 && (
            <div>
              <p className="text-[10px] tracking-[0.8em] text-zinc-300 uppercase mb-4">04 · Escolhe o horário</p>
              {selectedDate && selectedService && (
                <p className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase mb-8">
                  {selectedDate.getDate()} de {MESES[selectedDate.getMonth()]} · {selectedService.name} · {selectedService.durationMinutes} min
                </p>
              )}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border border-white/30 border-t-white animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="border border-white/10 px-6 py-12 text-center">
                  <p className="text-[11px] tracking-[0.3em] text-zinc-500 uppercase">Sem horários disponíveis para este dia</p>
                  <button onClick={() => setStep(3)} className="mt-6 text-[10px] tracking-[0.3em] text-zinc-400 uppercase hover:text-white transition-colors">Escolher outra data</button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map(slot => {
                    const [h, m] = slot.split(':').map(Number)
                    const endMin = h * 60 + m + (selectedService?.durationMinutes || 30)
                    const endStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
                    return (
                      <button key={slot}
                        onClick={() => { setSelectedSlot(slot); setStep(5) }}
                        className={`py-4 border text-center transition-all duration-200 group ${
                          selectedSlot === slot ? 'border-white bg-white text-black' : 'border-white/15 text-zinc-300 hover:border-white/40 hover:text-white'
                        }`}>
                        <span className="text-[13px] font-semibold">{slot}</span>
                        <span className="block text-[9px] tracking-wider text-zinc-500 group-hover:text-zinc-300 mt-1">{slot}–{endStr}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              <button onClick={() => setStep(3)} className="mt-8 text-[10px] tracking-[0.3em] text-zinc-500 uppercase hover:text-white flex items-center gap-3 transition-colors">
                <span className="w-6 h-px bg-zinc-700" /> Voltar
              </button>
            </div>
          )}

          {/* STEP 5: Dados */}
          {step === 5 && (
            <div>
              <p className="text-[10px] tracking-[0.8em] text-zinc-300 uppercase mb-8">05 · Os teus dados</p>
              <div className="border border-white/10 px-6 py-5 mb-10 bg-white/[0.02]">
                <p className="text-[9px] tracking-[0.6em] text-zinc-500 uppercase mb-4">Resumo</p>
                <div className="grid grid-cols-2 gap-y-3 text-[11px]">
                  <span className="text-zinc-500 uppercase tracking-wider">Barbeiro</span>
                  <span className="text-zinc-200 text-right">{selectedBarber?.name}</span>
                  <span className="text-zinc-500 uppercase tracking-wider">Serviço</span>
                  <span className="text-zinc-200 text-right">{selectedService?.name}</span>
                  <span className="text-zinc-500 uppercase tracking-wider">Data</span>
                  <span className="text-zinc-200 text-right">{selectedDate?.getDate()} de {MESES[selectedDate?.getMonth() || 0]} {selectedDate?.getFullYear()}</span>
                  <span className="text-zinc-500 uppercase tracking-wider">Hora</span>
                  <span className="text-zinc-200 text-right">{selectedSlot}</span>
                  <span className="text-zinc-500 uppercase tracking-wider">Duração</span>
                  <span className="text-zinc-200 text-right">{selectedService?.durationMinutes} min</span>
                  <span className="text-zinc-500 uppercase tracking-wider">Preço</span>
                  <span className="text-zinc-200 text-right">{selectedService?.price}€</span>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="text-[10px] tracking-[0.4em] text-zinc-400 uppercase mb-3 block">Nome completo</label>
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="O teu nome" maxLength={100}
                    className="w-full bg-transparent border border-white/20 focus:border-white/60 outline-none px-6 py-4 text-[13px] text-white transition-all" />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.4em] text-zinc-400 uppercase mb-3 block">Telemóvel</label>
                  <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+351XXXXXXXXX"
                    className="w-full bg-transparent border border-white/20 focus:border-white/60 outline-none px-6 py-4 text-[13px] text-white transition-all" />
                  <p className="text-[9px] text-zinc-600 tracking-wider mt-2">Formato: +351 seguido de 9 dígitos</p>
                </div>
              </div>
              <button onClick={handleSubmit}
                disabled={!clientName.trim() || !/^\+351\d{9}$/.test(clientPhone) || submitting}
                className={`mt-10 w-full flex items-center justify-between px-8 py-6 border transition-all duration-300 ${
                  clientName.trim() && /^\+351\d{9}$/.test(clientPhone) && !submitting
                    ? 'border-white/20 hover:bg-white hover:text-black cursor-pointer' : 'border-white/5 text-zinc-700 cursor-not-allowed'
                }`}>
                <span className="text-[11px] tracking-[0.3em] uppercase font-semibold">{submitting ? 'A processar...' : 'Confirmar Marcação'}</span>
                {submitting
                  ? <div className="w-4 h-4 border border-current border-t-transparent animate-spin" />
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                }
              </button>
              <button onClick={() => setStep(4)} className="mt-6 text-[10px] tracking-[0.3em] text-zinc-500 uppercase hover:text-white flex items-center gap-3 transition-colors">
                <span className="w-6 h-px bg-zinc-700" /> Voltar
              </button>
            </div>
          )}

          {/* STEP 6: Confirmação */}
          {step === 6 && success && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border border-white bg-white text-black flex items-center justify-center mx-auto mb-8 text-[24px]">✓</div>
              <h2 className="font-serif text-[clamp(2rem,5vw,48px)] uppercase tracking-tighter mb-4">Marcação Recebida</h2>
              <p className="text-[12px] text-zinc-400 tracking-wider leading-relaxed max-w-md mx-auto mb-4">
                Enviámos um SMS para <span className="text-zinc-200">{clientPhone}</span> com um link de confirmação.
              </p>
              <p className="text-[11px] text-zinc-500 tracking-wider mb-12">
                O link é válido durante 15 minutos. Após confirmar, o barbeiro será notificado.
              </p>
              <div className="border border-white/10 px-6 py-5 max-w-sm mx-auto bg-white/[0.02] mb-12">
                <div className="grid grid-cols-2 gap-y-3 text-[11px]">
                  <span className="text-zinc-500 uppercase tracking-wider">Barbeiro</span>
                  <span className="text-zinc-200 text-right">{selectedBarber?.name}</span>
                  <span className="text-zinc-500 uppercase tracking-wider">Serviço</span>
                  <span className="text-zinc-200 text-right">{selectedService?.name}</span>
                  <span className="text-zinc-500 uppercase tracking-wider">Data</span>
                  <span className="text-zinc-200 text-right">{selectedDate?.getDate()} de {MESES[selectedDate?.getMonth() || 0]}</span>
                  <span className="text-zinc-500 uppercase tracking-wider">Hora</span>
                  <span className="text-zinc-200 text-right">{selectedSlot}</span>
                  <span className="text-zinc-500 uppercase tracking-wider">Estado</span>
                  <span className="text-yellow-500 text-right uppercase tracking-wider">Pendente</span>
                </div>
              </div>
              <Link href="/main" className="inline-block border border-white/20 px-12 py-5 text-[11px] tracking-[0.5em] uppercase hover:bg-white hover:text-black font-bold transition-all duration-500">
                Voltar ao Início
              </Link>
            </div>
          )}

        </div>
      </section>

      {step !== 6 && (
        <footer className="py-14 px-6 md:px-8 border-t border-white/5 text-center bg-zinc-950/30">
          <p className="text-[10px] tracking-[0.6em] md:tracking-[0.8em] text-zinc-500 uppercase mb-4">ELEGANCE STUDIO © 2026 · PINHAL NOVO · PORTUGAL</p>
          <Link href="/politica-privacidade" className="text-[9px] tracking-[0.4em] text-zinc-700 uppercase hover:text-zinc-500 transition-colors">Política de Privacidade</Link>
        </footer>
      )}
    </div>
  )
}
