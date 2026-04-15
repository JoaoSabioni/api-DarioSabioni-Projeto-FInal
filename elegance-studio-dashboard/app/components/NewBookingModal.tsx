'use client'

import { useState, useEffect } from 'react'
import { getUser } from '@/lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5134'
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

type Service = { id: string; name: string; price: number; durationMinutes: number }
type ModalStep = 'service' | 'datetime' | 'client' | 'success'

const formatDateApi = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function NewBookingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const user = getUser()
  const [step, setStep] = useState<ModalStep>('service')
  const [services, setServices] = useState<Service[]>([])
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 60)

  // Fetch services
  useEffect(() => {
    fetch(`${API}/api/services`)
      .then(r => r.json())
      .then(setServices)
      .catch(() => setError('Erro ao carregar serviços.'))
  }, [])

  // Fetch slots when service + date chosen
  useEffect(() => {
    if (!selectedService || !selectedDate || !user?.barberId) return
    setLoading(true)
    setSlots([])
    setSelectedSlot(null)

    fetch(`${API}/api/availability?barberId=${user.barberId}&serviceId=${selectedService.id}&date=${formatDateApi(selectedDate)}`)
      .then(r => r.json())
      .then(data => { setSlots(data.availableSlots || []); setLoading(false) })
      .catch(() => { setError('Erro ao carregar horários.'); setLoading(false) })
  }, [selectedService, selectedDate, user?.barberId])

  // Submit
  const handleSubmit = async () => {
    if (!user?.barberId || !selectedService || !selectedDate || !selectedSlot) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: user.barberId,
          serviceId: selectedService.id,
          bookingDate: formatDateApi(selectedDate),
          bookingTime: selectedSlot,
          clientName,
          clientPhone,
        }),
      })
      if (res.status === 201) {
        setStep('success')
        onCreated()
      } else if (res.status === 409) {
        setError('Horário já ocupado. Escolha outro.')
        setSlots(prev => prev.filter(s => s !== selectedSlot))
        setSelectedSlot(null)
      } else {
        setError('Erro ao criar marcação.')
      }
    } catch {
      setError('Erro de ligação.')
    } finally {
      setSubmitting(false)
    }
  }

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay()
  const canGoBack = calYear > today.getFullYear() || (calYear === today.getFullYear() && calMonth > today.getMonth())
  const canGoForward = new Date(calYear, calMonth + 1, 1) <= maxDate

  const isSelectable = (day: number) => {
    const d = new Date(calYear, calMonth, day)
    d.setHours(0, 0, 0, 0)
    return d >= today && d <= maxDate
  }

  const isSelected = (day: number) =>
    selectedDate?.getFullYear() === calYear && selectedDate?.getMonth() === calMonth && selectedDate?.getDate() === day

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-black border border-white/20 w-full max-w-lg max-h-[90vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] tracking-[0.6em] text-zinc-400 uppercase">
            {step === 'success' ? 'Marcação Criada' : 'Nova Marcação Manual'}
          </p>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-[14px]">✕</button>
        </div>

        {/* Error */}
        {error && (
          <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 mb-6">
            <span className="text-[10px] tracking-wider text-red-400">{error}</span>
          </div>
        )}

        {/* STEP: Service */}
        {step === 'service' && (
          <div>
            <p className="text-[10px] tracking-[0.4em] text-zinc-300 uppercase mb-4">Serviço</p>
            <div className="flex flex-col gap-2">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep('datetime') }}
                  className={`flex items-center justify-between px-5 py-4 border text-left transition-all group ${
                    selectedService?.id === s.id ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div>
                    <p className="text-[12px] tracking-[0.1em] uppercase font-semibold group-hover:text-white transition-colors">{s.name}</p>
                    <p className="text-[9px] tracking-[0.3em] text-zinc-500 uppercase mt-1">{s.durationMinutes} min</p>
                  </div>
                  <span className="font-serif text-[22px] text-zinc-400 group-hover:text-white transition-colors">{s.price}€</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Date + Time */}
        {step === 'datetime' && (
          <div>
            <p className="text-[10px] tracking-[0.4em] text-zinc-300 uppercase mb-4">
              {selectedSlot ? 'Hora selecionada' : selectedDate ? 'Escolhe a hora' : 'Escolhe a data'}
            </p>

            {/* Mini calendar */}
            {!selectedSlot && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                    disabled={!canGoBack}
                    className={`w-8 h-8 flex items-center justify-center border text-[12px] ${canGoBack ? 'border-white/20 text-zinc-400 hover:text-white' : 'border-white/5 text-zinc-800 cursor-not-allowed'}`}
                  >‹</button>
                  <span className="text-[11px] tracking-[0.3em] uppercase text-zinc-300">{MESES[calMonth]} {calYear}</span>
                  <button
                    onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                    disabled={!canGoForward}
                    className={`w-8 h-8 flex items-center justify-center border text-[12px] ${canGoForward ? 'border-white/20 text-zinc-400 hover:text-white' : 'border-white/5 text-zinc-800 cursor-not-allowed'}`}
                  >›</button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DIAS_SEMANA.map(d => <div key={d} className="text-center text-[8px] tracking-wider text-zinc-600 uppercase py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1
                    const ok = isSelectable(day)
                    const sel = isSelected(day)
                    return (
                      <button key={day} disabled={!ok}
                        onClick={() => setSelectedDate(new Date(calYear, calMonth, day))}
                        className={`py-2 text-[11px] border transition-all ${
                          sel ? 'border-white bg-white text-black font-semibold'
                            : ok ? 'border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
                            : 'border-transparent text-zinc-800 cursor-not-allowed'
                        }`}>{day}</button>
                    )
                  })}
                </div>
              </>
            )}

            {/* Slots */}
            {selectedDate && !selectedSlot && (
              <>
                <p className="text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-3">
                  {selectedDate.getDate()} {MESES[selectedDate.getMonth()]} · {selectedService?.name} · {selectedService?.durationMinutes} min
                </p>
                {loading ? (
                  <div className="flex justify-center py-10"><div className="w-5 h-5 border border-white/30 border-t-white animate-spin" /></div>
                ) : slots.length === 0 ? (
                  <p className="text-[10px] text-zinc-600 text-center py-8 uppercase tracking-wider">Sem horários disponíveis</p>
                ) : (
                  <div className="grid grid-cols-4 gap-1">
                    {slots.map(slot => (
                      <button key={slot}
                        onClick={() => { setSelectedSlot(slot); setStep('client') }}
                        className="py-3 border border-white/10 text-[11px] text-zinc-300 hover:border-white/40 hover:text-white transition-all"
                      >{slot}</button>
                    ))}
                  </div>
                )}
              </>
            )}

            <button onClick={() => { setSelectedDate(null); setSelectedSlot(null); setStep('service') }}
              className="mt-6 text-[9px] tracking-[0.3em] text-zinc-600 uppercase hover:text-white flex items-center gap-2 transition-colors">
              <span className="w-4 h-px bg-zinc-700" /> Voltar
            </button>
          </div>
        )}

        {/* STEP: Client details */}
        {step === 'client' && (
          <div>
            <p className="text-[10px] tracking-[0.4em] text-zinc-300 uppercase mb-4">Dados do cliente</p>

            {/* Summary */}
            <div className="border border-white/10 px-4 py-3 mb-6 bg-white/[0.02]">
              <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                <span className="text-zinc-500 uppercase tracking-wider">Serviço</span>
                <span className="text-zinc-300 text-right">{selectedService?.name}</span>
                <span className="text-zinc-500 uppercase tracking-wider">Data</span>
                <span className="text-zinc-300 text-right">{selectedDate?.getDate()} {MESES[selectedDate?.getMonth() || 0]}</span>
                <span className="text-zinc-500 uppercase tracking-wider">Hora</span>
                <span className="text-zinc-300 text-right">{selectedSlot}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[9px] tracking-[0.4em] text-zinc-400 uppercase mb-2 block">Nome</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome do cliente" maxLength={100}
                  className="w-full bg-transparent border border-white/20 focus:border-white/60 outline-none px-4 py-3 text-[12px] text-white transition-all" />
              </div>
              <div>
                <label className="text-[9px] tracking-[0.4em] text-zinc-400 uppercase mb-2 block">Telemóvel</label>
                <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+351XXXXXXXXX"
                  className="w-full bg-transparent border border-white/20 focus:border-white/60 outline-none px-4 py-3 text-[12px] text-white transition-all" />
              </div>
            </div>

            <button onClick={handleSubmit}
              disabled={!clientName.trim() || !/^\+351\d{9}$/.test(clientPhone) || submitting}
              className={`mt-6 w-full py-4 border text-[10px] tracking-[0.3em] uppercase font-semibold transition-all ${
                clientName.trim() && /^\+351\d{9}$/.test(clientPhone) && !submitting
                  ? 'border-white/20 hover:bg-white hover:text-black cursor-pointer'
                  : 'border-white/5 text-zinc-700 cursor-not-allowed'
              }`}>
              {submitting ? 'A processar...' : 'Criar Marcação'}
            </button>

            <button onClick={() => { setSelectedSlot(null); setStep('datetime') }}
              className="mt-4 text-[9px] tracking-[0.3em] text-zinc-600 uppercase hover:text-white flex items-center gap-2 transition-colors">
              <span className="w-4 h-px bg-zinc-700" /> Voltar
            </button>
          </div>
        )}

        {/* STEP: Success */}
        {step === 'success' && (
          <div className="text-center py-6">
            <div className="w-12 h-12 border border-white bg-white text-black flex items-center justify-center mx-auto mb-6 text-[18px]">✓</div>
            <p className="text-[12px] text-zinc-300 tracking-wider mb-2">Marcação criada com sucesso!</p>
            <p className="text-[10px] text-zinc-500 tracking-wider mb-8">SMS enviado ao cliente para confirmação.</p>
            <button onClick={onClose} className="border border-white/20 px-8 py-3 text-[10px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}