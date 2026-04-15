'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '../components/Navbar'

const BARBEIROS = [
  { nome: 'Edi', cargo: 'Fundador', foto: '/Fotos_edi/edi2.png', whatsapp: '351933320269', instagram: 'edisimoess' },
  { nome: 'Tomas', cargo: 'Colaborador', foto: '/Fotos_Tomas/tomas2.png', whatsapp: '351914302079', instagram: '_tomas21_' },
  { nome: 'Abreu', cargo: 'Colaborador', foto: '/Fotos_Abreu/abreuPrincipal.jpg', whatsapp: '351913388301', instagram: 'abreeubarber' },
]

const SERVICOS = [
  'Sobrancelhas — 3€',
  'Barba — 6€',
  'Corte Simples — 10€',
  'Corte / Degradê — 15€',
  'Corte & Barba — 17€',
]

const CONFLITOS: Record<string, string[]> = {
  'Corte Simples — 10€':    ['Corte / Degradê — 15€', 'Corte & Barba — 17€'],
  'Corte / Degradê — 15€':  ['Corte Simples — 10€',   'Corte & Barba — 17€'],
  'Corte & Barba — 17€':    ['Corte Simples — 10€',   'Corte / Degradê — 15€', 'Barba — 6€'],
  'Barba — 6€':             ['Corte & Barba — 17€'],
}

const HORARIOS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30',
  '19:00','19:30','20:00','20:30','21:00'
]

export default function PageContactar() {
  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtualNum = hoje.getMonth() + 1

  const [selectedBarbeiro, setSelectedBarbeiro] = useState<number | null>(null)
  const [selectedServicos, setSelectedServicos] = useState<string[]>([])
  const [nome, setNome] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [dia, setDia] = useState(String(hoje.getDate()).padStart(2, '0'))
  const [mes, setMes] = useState(String(mesAtualNum).padStart(2, '0'))
  const [ano] = useState(String(anoAtual))
  const [horario, setHorario] = useState('')
  const [horarioOpen, setHorarioOpen] = useState(false)

  const barbeiro = selectedBarbeiro !== null ? BARBEIROS[selectedBarbeiro] : null

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const DIAS_SEMANA = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado']

  const diasNoMes = (m: string, a: string) => (!m || !a) ? 31 : new Date(parseInt(a), parseInt(m), 0).getDate()

  const isDiaValido = (d: string, m: string, a: string) => {
    const dataSelecionada = new Date(parseInt(a), parseInt(m) - 1, parseInt(d))
    const hojeSemHoras = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    return dataSelecionada >= hojeSemHoras
  }

  const horariosFiltrados = (() => {
    const isHoje = dia === String(hoje.getDate()).padStart(2, '0') &&
                   mes === String(hoje.getMonth() + 1).padStart(2, '0') &&
                   ano === String(hoje.getFullYear())

    if (isHoje) {
      const agora = new Date()
      const margemMinutos = 60

      return HORARIOS.filter(h => {
        const [horaH, minH] = h.split(':').map(Number)
        const dataHorario = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), horaH, minH)
        if (agora.getHours() >= 12 && horaH < 15) return false
        const diffMinutos = (dataHorario.getTime() - agora.getTime()) / 1000 / 60
        return diffMinutos >= margemMinutos
      })
    }
    return HORARIOS
  })()

  const dataLabel = (() => {
    if (!dia || !mes || !ano) return ''
    const dt = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
    return `${DIAS_SEMANA[dt.getDay()]}, ${dia} de ${MESES[parseInt(mes)-1]} de ${ano}`
  })()

  const dataFormatada = dia && mes && ano ? `${dia}/${mes}/${ano}` : ''

  const isDisabled = (s: string) => (CONFLITOS[s] ?? []).some((c) => selectedServicos.includes(c))
  const toggleServico = (s: string) => {
    if (isDisabled(s)) return
    setSelectedServicos((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  const buildWhatsAppMsg = () => {
    const linhas = [
      `Olá ${barbeiro?.nome},`,
      ``,
      `O meu nome é *${nome || '(sem nome)'}*.`,
      selectedServicos.length > 0 ? `Tenho interesse nos serviços: *${selectedServicos.join(', ')}*` : '',
      dataFormatada ? `Data pretendida: *${dataFormatada}${horario ? ` às ${horario}` : ''}*` : '',
      mensagem ? `\n${mensagem}` : '',
      ``,
      `Aguardo a vossa confirmação. Obrigado.`,
    ].filter((l) => l !== '')
    return encodeURIComponent(linhas.join('\n'))
  }

  const handleWhatsApp = () => {
    if (!barbeiro) return
    window.open(`https://wa.me/${barbeiro.whatsapp}?text=${buildWhatsAppMsg()}`, '_blank')
  }

  return (
    <div className="bg-black text-white font-sans selection:bg-white selection:text-black min-h-screen overflow-x-hidden">
      <Navbar activePage="contactar" />

      <section className="pt-36 md:pt-44 pb-16 md:pb-20 px-6 md:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 text-zinc-400 text-[11px] tracking-[0.5em] uppercase mb-8">
            <span className="w-12 h-px bg-zinc-500" /> PINHAL NOVO · EST. 2025
          </div>
          <h1 className="font-serif text-[clamp(3rem,10vw,120px)] leading-[0.85] font-medium uppercase tracking-tighter">CONTACTAR</h1>
        </div>
      </section>

      <section className="px-6 md:px-8 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

          <div className="flex flex-col gap-12">
            {/* 01 Barbeiro */}
            <div>
              <p className="text-[10px] tracking-[0.8em] text-zinc-300 uppercase mb-6">01 · Escolhe o barbeiro</p>
              <div className="flex flex-col gap-3">
                {BARBEIROS.map((b, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedBarbeiro(i)}
                    
                    className={`flex items-center gap-5 px-6 py-4 border transition-all duration-300 text-left ${
                      selectedBarbeiro === i ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                  
                    <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-sm">
                      <Image
                        src={b.foto}
                        alt={b.nome}
                        fill
                        className="object-cover object-center"
                      />
                    </div>

                    <div>
                      <p className="font-serif text-lg uppercase tracking-tight">{b.nome}</p>
                      <p className="text-[10px] tracking-[0.4em] text-zinc-300 uppercase">{b.cargo}</p>
                    </div>
                    {selectedBarbeiro === i && (
                      <span className="ml-auto text-[10px] tracking-[0.3em] text-zinc-400 uppercase">Selecionado</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 02 Serviços */}
            <div>
              <p className="text-[10px] tracking-[0.8em] text-zinc-300 uppercase mb-6">02 · Serviço</p>
              <div className="flex flex-col gap-2">
                {SERVICOS.map((s, i) => {
                  const isSelected = selectedServicos.includes(s)
                  const disabled = isDisabled(s)
                  return (
                    <button key={i} onClick={() => toggleServico(s)} disabled={disabled} className={`flex items-center justify-between px-6 py-4 border text-left text-[12px] tracking-[0.1em] transition-all duration-300 ${isSelected ? 'border-white text-white bg-white/5' : disabled ? 'border-white/5 text-zinc-600 cursor-not-allowed opacity-40' : 'border-white/20 text-zinc-300 hover:border-white/50 hover:text-white cursor-pointer'}`}>
                      <span>{s}</span>
                      <span className={`w-4 h-4 border flex items-center justify-center transition-all ${isSelected ? 'border-white bg-white' : 'border-white/20'}`}>
                        {isSelected && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 03 Nome */}
            <div>
              <p className="text-[10px] tracking-[0.8em] text-zinc-300 uppercase mb-6">03 · O teu nome</p>
              <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-transparent border border-white/20 focus:border-white/60 outline-none px-6 py-4 text-[13px] text-white transition-all" />
            </div>

            {/* 04 Data */}
            <div>
            <p className="text-[10px] tracking-[0.8em] text-zinc-300 uppercase mb-6">04 · Data pretendida</p>
              <div className="grid grid-cols-3 gap-3">
                <select value={dia} onChange={(e) => setDia(e.target.value)} className="bg-black border border-white/20 px-4 py-4 text-[12px] text-white appearance-none cursor-pointer">
                  <option value="">Dia</option>
                  {Array.from({ length: diasNoMes(mes, ano) }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                    <option key={d} value={d} disabled={!isDiaValido(d, mes, ano)} className={isDiaValido(d, mes, ano) ? 'text-white' : 'text-zinc-600'}>{d}</option>
                  ))}
                </select>
                <select value={mes} onChange={(e) => { setMes(e.target.value); setDia('') }} className="bg-black border border-white/20 px-4 py-4 text-[12px] text-white appearance-none cursor-pointer">
                  <option value="">Mês</option>
                  {MESES.map((m, i) => {
                    const vMes = i + 1;
                    const mesPassou = vMes < mesAtualNum;
                    return (
                      <option key={i} value={String(vMes).padStart(2, '0')} disabled={mesPassou} className={mesPassou ? 'text-zinc-600' : 'text-white'}>{m}</option>
                    )
                  })}
                </select>
                <select value={ano} disabled className="bg-black border border-white/20 px-4 py-4 text-[12px] text-zinc-500 appearance-none cursor-not-allowed">
                  <option value={anoAtual}>{anoAtual}</option>
                </select>
              </div>
              {dataLabel && <p className="text-[10px] tracking-[0.3em] text-zinc-400 uppercase mt-3">{dataLabel}</p>}
            </div>

            {/* 05 Horário */}
            <div>
              <p className="text-[10px] tracking-[0.8em] text-zinc-300 uppercase mb-6">05 · Horário pretendido</p>
              <button onClick={() => setHorarioOpen(!horarioOpen)} className="w-full flex items-center justify-between px-6 py-5 border border-white/20 hover:border-white/40 transition-all group">
                <div className="flex items-center gap-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  <span className="text-[12px] tracking-[0.2em] uppercase text-zinc-300 group-hover:text-white">{horario || 'Escolher horário'}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform ${horarioOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <div className={`overflow-hidden transition-all duration-500 ${horarioOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="border border-t-0 border-white/20 px-6 py-5">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {horariosFiltrados.length > 0 ? (
                      horariosFiltrados.map((h) => (
                        <button key={h} onClick={() => { setHorario(h); setHorarioOpen(false) }} className={`py-3 border text-[11px] transition-all ${horario === h ? 'border-white bg-white text-black font-semibold' : 'border-white/15 text-zinc-400 hover:text-white'}`}>
                          {h}
                        </button>
                      ))
                    ) : (
                      <p className="col-span-full text-[10px] text-zinc-500 uppercase py-4 text-center">Sem horários disponíveis para hoje</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 06 Mensagem */}
            <div>
              <p className="text-[10px] tracking-[0.8em] text-zinc-300 uppercase mb-6">06 · Mensagem adicional</p>
              <textarea placeholder="Alguma informação..." value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={3} className="w-full bg-transparent border border-white/20 px-6 py-4 text-[13px] text-white resize-none" />
            </div>
          </div>

          {/* Direita - Preview e Envio */}
          <div className="flex flex-col justify-start lg:pt-14 gap-8">
            <div className="border-b border-white/5 pb-10">
              <h2 className="font-serif text-[clamp(2rem,4vw,48px)] uppercase tracking-tighter leading-tight mb-4 text-center lg:text-left">Envia a<br />tua mensagem</h2>
              <p className="text-[12px] text-zinc-300 tracking-wider text-center lg:text-left leading-relaxed">Seleciona o barbeiro, o serviço e envia via WhatsApp.</p>
            </div>

            {barbeiro && (
              <div className="border border-white/20 p-6 bg-white/[0.03]">
                <p className="text-[9px] tracking-[0.6em] text-zinc-400 uppercase mb-4 text-center lg:text-left">Pré-visualização</p>
                <p className="text-[12px] text-zinc-200 leading-relaxed whitespace-pre-line text-center lg:text-left">
                  {[
                    `Olá ${barbeiro.nome},`,
                    ``,
                    `O meu nome é ${nome || '(sem nome)'}.`,
                    selectedServicos.length > 0 ? `Tenho interesse nos serviços: ${selectedServicos.join(', ')}` : '',
                    dataLabel ? `Data pretendida: ${dataLabel}${horario ? ` às ${horario}` : ''}` : '',
                    mensagem || '',
                    ``,
                    `Aguardo a vossa confirmação. Obrigado.`,
                  ].filter((l) => l !== '').join('\n')}
                </p>
              </div>
            )}

            <button onClick={handleWhatsApp} disabled={!barbeiro} className={`flex items-center justify-between px-8 py-6 border transition-all duration-300 group ${barbeiro ? 'border-white/20 hover:bg-white hover:text-black cursor-pointer' : 'border-white/5 text-zinc-700 cursor-not-allowed'}`}>
              <div className="flex items-center gap-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                <span className="text-[11px] tracking-[0.3em] uppercase font-semibold">Enviar via WhatsApp</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>

            <footer className="mt-auto">
              <p className="text-[9px] text-zinc-700 tracking-wider leading-relaxed text-center lg:text-left uppercase">ELEGANCE STUDIO © {anoAtual} · PINHAL NOVO · PORTUGAL</p>
            </footer>
          </div>
        </div>
      </section>
    </div>
  )
}