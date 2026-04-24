'use client'

import { useState, useEffect } from 'react'
import { getBarbers, getServices, createBooking } from '@/lib/api'

interface NewBookingModalProps {
  onClose: () => void
  onCreated: () => void
}

type Barber = { id: string; name: string }
type Service = { id: string; name: string; durationMinutes: number }

export default function NewBookingModal({ onClose, onCreated }: NewBookingModalProps) {
  const [barbers, setBarbers]   = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [form, setForm] = useState({
    barberId:    '',
    serviceId:   '',
    clientName:  '',
    clientPhone: '',
    bookingDate: '',
    bookingTime: '',
  })

  useEffect(() => {
    getBarbers().then(setBarbers).catch(() => {})
    getServices().then(setServices).catch(() => {})
  }, [])

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    const { barberId, serviceId, clientName, clientPhone, bookingDate, bookingTime } = form
    if (!barberId || !serviceId || !clientName || !clientPhone || !bookingDate || !bookingTime) {
      setError('Preenche todos os campos.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createBooking({ barberId, serviceId, clientName, clientPhone, bookingDate, bookingTime })
      onCreated()
    } catch {
      setError('Erro ao criar marcação. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-white/15 w-full max-w-md p-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-[9px] tracking-[0.6em] text-zinc-500 uppercase">Nova Marcação</p>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">✕</button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {/* Barbeiro */}
          <div>
            <label className="block text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-1.5">Barbeiro</label>
            <select
              value={form.barberId}
              onChange={e => set('barberId', e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 text-white text-[12px] px-3 py-2.5 focus:outline-none focus:border-white/30"
            >
              <option value="">Selecionar...</option>
              {barbers.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Serviço */}
          <div>
            <label className="block text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-1.5">Serviço</label>
            <select
              value={form.serviceId}
              onChange={e => set('serviceId', e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 text-white text-[12px] px-3 py-2.5 focus:outline-none focus:border-white/30"
            >
              <option value="">Selecionar...</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes} min)</option>
              ))}
            </select>
          </div>

          {/* Nome do cliente */}
          <div>
            <label className="block text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-1.5">Nome do Cliente</label>
            <input
              type="text"
              value={form.clientName}
              onChange={e => set('clientName', e.target.value)}
              placeholder="Nome completo"
              className="w-full bg-zinc-900 border border-white/10 text-white text-[12px] px-3 py-2.5 focus:outline-none focus:border-white/30 placeholder:text-zinc-700"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-1.5">Telefone</label>
            <input
              type="tel"
              value={form.clientPhone}
              onChange={e => set('clientPhone', e.target.value)}
              placeholder="+351 912 345 678"
              className="w-full bg-zinc-900 border border-white/10 text-white text-[12px] px-3 py-2.5 focus:outline-none focus:border-white/30 placeholder:text-zinc-700"
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-1.5">Data</label>
              <input
                type="date"
                value={form.bookingDate}
                onChange={e => set('bookingDate', e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 text-white text-[12px] px-3 py-2.5 focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-[9px] tracking-[0.3em] text-zinc-500 uppercase mb-1.5">Hora</label>
              <input
                type="time"
                value={form.bookingTime}
                onChange={e => set('bookingTime', e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 text-white text-[12px] px-3 py-2.5 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-[10px] text-red-400 tracking-[0.2em]">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 border border-white/10 text-zinc-500 text-[10px] tracking-[0.3em] uppercase hover:border-white/25 hover:text-white transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3.5 bg-white text-black text-[10px] tracking-[0.3em] uppercase font-bold hover:bg-zinc-200 transition-all disabled:opacity-40"
          >
            {loading ? '...' : 'Criar Marcação'}
          </button>
        </div>
      </div>
    </div>
  )
}