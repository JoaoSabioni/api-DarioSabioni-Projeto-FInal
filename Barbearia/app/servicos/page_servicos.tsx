'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'

const SERVICES = [
  { num: '01', name: 'Sobrancelhas', desc: 'Definição e alinhamento com acabamento preciso.', price: '3€', detail: 'Tratamento de sobrancelhas com técnica apurada para um resultado natural e definido.' },
  { num: '02', name: 'Barba', desc: 'Modelação e tratamento completo da barba.', price: '6€', detail: 'Aparagem, definição e acabamento à navalha para uma barba impecável.' },
  { num: '03', name: 'Corte Simples', desc: 'Execução técnica superior com acabamento à navalha.', price: '10€', detail: 'Corte clássico com acabamento refinado, adaptado ao estilo de cada cliente.' },
  { num: '04', name: 'Corte / Degradê', desc: 'Degradê executado com precisão milimétrica.', price: '15€', detail: 'Fade técnico com transição perfeita, do zero ao comprimento desejado.' },
  { num: '05', name: 'Corte & Barba', desc: 'Experiência completa de barbearia premium.', price: '17€', detail: 'Corte e barba com tratamento total — o serviço mais completo do estúdio.' },
]

export default function ServicosPage() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="bg-black text-white font-sans selection:bg-white selection:text-black min-h-screen overflow-x-hidden">
      <Navbar activePage="servicos" />

      <section className="pt-36 md:pt-44 pb-16 md:pb-20 px-6 md:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 text-zinc-400 text-[11px] tracking-[0.5em] uppercase mb-8">
            <span className="w-12 h-px bg-zinc-500" /> PINHAL NOVO · EST. 2025
          </div>
          <h1 className="font-serif text-[clamp(3rem,10vw,120px)] leading-[0.85] font-medium uppercase tracking-tighter">SERVIÇOS</h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto border-x border-white/5">
        {SERVICES.map((s, i) => (
          <div
            key={s.num}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className={`border-b border-white/5 px-8 md:px-12 lg:px-20 transition-all duration-500 cursor-default ${hovered === i ? 'bg-white/[0.03]' : ''}`}
          >
            <div className="py-10 md:py-14 grid grid-cols-[auto_1fr_auto] md:grid-cols-[80px_1fr_auto_auto] items-center gap-6 md:gap-12">
              <span className="text-[11px] text-zinc-500 tracking-widest font-mono">{s.num}</span>
              <div>
                <h2 className={`font-serif text-[clamp(1.8rem,4vw,52px)] font-light uppercase tracking-tight transition-all duration-500 ${hovered === i ? 'translate-x-3' : ''}`}>{s.name}</h2>
                <p className={`text-[11px] text-zinc-400 tracking-wider uppercase italic mt-2 transition-all duration-500 ${hovered === i ? 'opacity-100' : 'opacity-0 md:opacity-60'}`}>{s.desc}</p>
              </div>
              <p className={`hidden md:block text-[11px] text-zinc-400 max-w-[220px] leading-relaxed transition-all duration-500 ${hovered === i ? 'opacity-100' : 'opacity-0'}`}>{s.detail}</p>
              <div className={`font-serif text-[clamp(2rem,4vw,56px)] transition-all duration-500 ${hovered === i ? 'text-white' : 'text-zinc-500'}`}>{s.price}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="py-24 md:py-32 px-6 md:px-8 text-center border-t border-white/5">
        <p className="text-[10px] tracking-[0.8em] text-zinc-400 uppercase mb-6">Pronto para marcar?</p>
        <Link href="/marcar" className="inline-block border border-white/20 px-12 md:px-20 py-5 md:py-6 text-[11px] tracking-[0.5em] uppercase hover:bg-white hover:text-black font-bold transition-all duration-500">MARCAR AGORA</Link>
      </section>

      <footer className="py-14 px-6 md:px-8 border-t border-white/5 text-center bg-zinc-950/30">
        <p className="text-[10px] tracking-[0.6em] md:tracking-[0.8em] text-zinc-500 uppercase mb-4">ELEGANCE STUDIO © 2026 · PINHAL NOVO · PORTUGAL</p>
        <Link href="/politica-privacidade" className="text-[9px] tracking-[0.4em] text-zinc-700 uppercase hover:text-zinc-500 transition-colors">Política de Privacidade</Link>
      </footer>
    </div>
  )
}
