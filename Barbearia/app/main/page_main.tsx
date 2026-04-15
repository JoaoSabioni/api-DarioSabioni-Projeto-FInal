'use client'

import Image from 'next/image'
import Link from 'next/link'
import Navbar from '../components/Navbar'

const SERVICES = [
  { num: '01', name: 'CORTE Simples', desc: 'Execução técnica superior com acabamento à navalha.', price: '10€' },
  { num: '02', name: 'CORTE & BARBA', desc: 'Corte e barba com tratamento completo.', price: '17€' },
]

const ROW1 = [
  '/Fotos_Abreu/abreu2.png', '/Fotos_Abreu/abreu3.png',
  '/Fotos_Abreu/abreu4.png', '/Fotos_Abreu/abreu5.png', '/Fotos_Abreu/abreu6.png',
  '/Fotos_Abreu/abreu7.png', '/Fotos_Abreu/abreu8.png',
  '/Fotos_edi/edi3.png', '/Fotos_edi/edi4.png', '/Fotos_edi/edi5.png', '/Fotos_edi/edi6.png',
]

const ROW2 = [
  '/Fotos_edi/edi7.png', '/Fotos_edi/edi8.png',
  '/Fotos_Tomas/tomas3.png', '/Fotos_Tomas/tomas4.png', '/Fotos_Tomas/tomas5.png',
  '/Fotos_Tomas/tomas6.png', '/Fotos_Tomas/tomas7.png', '/Fotos_Tomas/tomas8.png', '/Fotos_Tomas/tomas9.png',
]

export default function PageMain() {
  return (
    <div className="bg-black text-white font-sans selection:bg-white selection:text-black min-h-screen overflow-x-hidden">

      <Navbar activePage="main" />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center px-6 md:px-8 pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute inset-0 md:hidden">
          <Image src="/Fotos_loja/loja1.png" alt="Elegance Studio" fill className="object-cover object-center" priority />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[45%] hidden md:block">
          <Image src="/Fotos_loja/loja1.png" alt="Elegance Studio" fill className="object-cover object-center" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-4 text-zinc-600 text-[11px] tracking-[0.5em] uppercase mb-8 md:mb-10">
              <span className="w-12 h-px bg-zinc-800" /> PINHAL NOVO · EST. 2025
            </div>
            <h1 className="font-serif text-[clamp(3.5rem,12vw,140px)] leading-[0.85] font-medium uppercase mb-8 md:mb-10 tracking-tighter">
              ELEGANCE<br /><span className="text-zinc-700">STUDIO</span>
            </h1>
            <Link href="/marcar" className="inline-block border border-white/20 px-10 md:px-14 py-5 md:py-6 text-[11px] tracking-[0.5em] uppercase hover:bg-white hover:text-black font-bold transition-all duration-500">MARCAR AGORA</Link>
          </div>
        </div>
      </section>

      {/* Preçário */}
      <section id="servicos" className="border-t border-white/5 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5 border-x border-white/5">
          <div className="p-10 md:p-12 lg:p-20 flex flex-col justify-center bg-black min-h-[240px] md:min-h-[400px]">
            <h2 className="font-serif text-4xl md:text-5xl uppercase leading-tight mb-6 md:mb-8">Preçário</h2>
            <Link href="/servicos" className="text-[11px] tracking-[0.3em] text-zinc-400 uppercase hover:text-white flex items-center gap-4 group">
              <span className="w-8 h-px bg-zinc-800 group-hover:w-12 transition-all" /> Ver Detalhes
            </Link>
          </div>
          {SERVICES.map((s) => (
            <div key={s.num} className="p-10 md:p-12 lg:p-20 hover:bg-white/[0.02] transition-all group flex flex-col justify-between min-h-[240px] md:min-h-[400px]">
              <div>
                <div className="text-[11px] text-zinc-800 mb-8 md:mb-12 tracking-widest font-mono">{s.num}</div>
                <h3 className="font-serif text-3xl md:text-4xl font-light mb-4 md:mb-6 uppercase group-hover:translate-x-2 transition-all">{s.name}</h3>
                <p className="text-[11px] text-zinc-500 tracking-wider uppercase italic opacity-60">{s.desc}</p>
              </div>
              <div className="text-3xl md:text-4xl font-serif text-zinc-200 border-t border-white/5 pt-6 md:pt-8 mt-6">{s.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Carrossel */}
      <section className="bg-black border-b border-white/5 py-16 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[10px] tracking-[0.8em] text-zinc-600 uppercase mb-4">Trabalhos Recentes</p>
          <h2 className="font-serif text-[clamp(2rem,5vw,56px)] uppercase tracking-tighter">O Nosso Trabalho</h2>
          <div className="w-16 h-px bg-zinc-700 mx-auto mt-6" />
        </div>
        <div style={{ overflow: 'hidden', marginBottom: '4px' }}>
          <div className="carousel-ltr">
            {[...ROW1, ...ROW1].map((img, i) => (
              <div key={i} className="carousel-card">
                <Image src={img} alt="" fill style={{ objectFit: 'cover' }} sizes="200px" />
              </div>
            ))}
          </div>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div className="carousel-rtl">
            {[...ROW2, ...ROW2].map((img, i) => (
              <div key={i} className="carousel-card">
                <Image src={img} alt="" fill style={{ objectFit: 'cover' }} sizes="200px" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 md:py-20 px-6 md:px-8 border-t border-white/5 text-center bg-zinc-950/30">
        <p className="text-[10px] tracking-[0.6em] md:tracking-[0.8em] text-zinc-700 uppercase mb-4">ELEGANCE STUDIO © 2026 · PINHAL NOVO · PORTUGAL</p>
        <Link href="/politica-privacidade" className="text-[9px] tracking-[0.4em] text-zinc-800 uppercase hover:text-zinc-600 transition-colors">Política de Privacidade</Link>
      </footer>

      <style jsx global>{`
        @keyframes scrollLeft { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes scrollRight { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .carousel-ltr { display: flex; width: max-content; animation: scrollLeft 70s linear infinite; }
        .carousel-rtl { display: flex; width: max-content; animation: scrollRight 70s linear infinite; }
        .carousel-card { position: relative; flex-shrink: 0; width: 200px; height: 260px; margin-right: 4px; overflow: hidden; filter: grayscale(1); transition: filter 0.6s ease; }
        @media (min-width: 768px) { .carousel-card { width: 300px; height: 380px; } }
        .carousel-card:hover { filter: grayscale(0); }
      `}</style>
    </div>
  )
}
