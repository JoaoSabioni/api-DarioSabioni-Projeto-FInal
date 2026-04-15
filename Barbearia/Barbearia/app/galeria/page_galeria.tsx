'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '../components/Navbar'

const LOJA = ['/Fotos_loja/loja3.png', '/Fotos_loja/loja4.png']

const COLABORADORES = [
  {
    nome: 'Edi', cargo: 'Fundador', principal: '/Fotos_edi/edi2.png',
    instagram: '@edisimoess', instagramUrl: 'https://instagram.com/edisimoess',
    telefone: '+351 933 320 269', whatsapp: 'https://wa.me/351933320269',
    fotos: ['/Fotos_edi/edi2.png','/Fotos_edi/edi3.png','/Fotos_edi/edi4.png','/Fotos_edi/edi5.png','/Fotos_edi/edi6.png','/Fotos_edi/edi7.png','/Fotos_edi/edi8.png'],
  },
  {
    nome: 'Tomas', cargo: 'Colaborador', principal: '/Fotos_Tomas/tomas2.png',
    instagram: '@_tomas21_', instagramUrl: 'https://instagram.com/_tomas21_',
    telefone: '+351 914 302 079', whatsapp: 'https://wa.me/351914302079',
    fotos: ['/Fotos_Tomas/tomas2.png','/Fotos_Tomas/tomas3.png','/Fotos_Tomas/tomas4.png','/Fotos_Tomas/tomas5.png','/Fotos_Tomas/tomas6.png','/Fotos_Tomas/tomas7.png','/Fotos_Tomas/tomas8.png','/Fotos_Tomas/tomas9.png'],
  },
  {
    nome: 'Abreu', cargo: 'Colaborador', principal: '/Fotos_Abreu/abreuPrincipal.jpg',
    instagram: '@abreeubarber', instagramUrl: 'https://instagram.com/abreeubarber',
    telefone: '+351 913 388 301', whatsapp: 'https://wa.me/351913388301',
    fotos: ['/Fotos_Abreu/abreu1.png','/Fotos_Abreu/abreu2.png','/Fotos_Abreu/abreu3.png','/Fotos_Abreu/abreu4.png','/Fotos_Abreu/abreu5.png','/Fotos_Abreu/abreu6.png','/Fotos_Abreu/abreu7.png','/Fotos_Abreu/abreu8.png'],
  },
]

type LightboxState = { images: string[]; index: number } | null

export default function PageGaleria() {
  const [lightbox, setLightbox] = useState<LightboxState>(null)

  const openLightbox = (images: string[], index: number) => setLightbox({ images, index })
  const closeLightbox = () => setLightbox(null)

  const prev = useCallback(() => {
    if (!lightbox) return
    setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length })
  }, [lightbox])

  const next = useCallback(() => {
    if (!lightbox) return
    setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length })
  }, [lightbox])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [prev, next])

  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  return (
    <div className="bg-black text-white font-sans selection:bg-white selection:text-black min-h-screen overflow-x-hidden">

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-6 right-8 text-[11px] tracking-[0.3em] uppercase text-zinc-400 hover:text-white transition-colors z-10">Fechar ✕</button>
          <span className="absolute top-7 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.4em] text-zinc-500 uppercase">{lightbox.index + 1} / {lightbox.images.length}</span>
          {lightbox.images.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); prev() }} className="absolute left-4 md:left-10 text-zinc-400 hover:text-white transition-colors z-10 p-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          <div className="relative max-w-[85vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image src={lightbox.images[lightbox.index]} alt="Foto" width={1200} height={1200} className="max-w-[85vw] max-h-[85vh] w-auto h-auto object-contain" />
          </div>
          {lightbox.images.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); next() }} className="absolute right-4 md:right-10 text-zinc-400 hover:text-white transition-colors z-10 p-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          )}
        </div>
      )}

      <Navbar activePage="galeria" />

      <section className="pt-36 md:pt-44 pb-16 md:pb-20 px-6 md:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 text-zinc-400 text-[11px] tracking-[0.5em] uppercase mb-8">
            <span className="w-12 h-px bg-zinc-500" /> PINHAL NOVO · EST. 2025
          </div>
          <h1 className="font-serif text-[clamp(3rem,10vw,120px)] leading-[0.85] font-medium uppercase tracking-tighter">GALERIA</h1>
        </div>
      </section>

      <section className="px-6 md:px-8 py-14 md:py-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-10">
            <p className="text-[10px] tracking-[0.8em] text-zinc-400 uppercase mb-2">Espaço</p>
            <h2 className="font-serif text-[clamp(2rem,5vw,56px)] uppercase tracking-tighter">O Estúdio</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-3" style={{ height: 'clamp(260px, 50vw, 540px)' }}>
            <div className="relative overflow-hidden md:flex-[3] h-full"><Image src={LOJA[0]} alt="Loja" fill className="object-cover" /></div>
            <div className="relative overflow-hidden md:flex-[2] h-full"><Image src={LOJA[1]} alt="Loja" fill className="object-cover" /></div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14 md:mb-16">
            <p className="text-[10px] tracking-[0.8em] text-zinc-400 uppercase mb-2">Equipa</p>
            <h2 className="font-serif text-[clamp(2rem,5vw,56px)] uppercase tracking-tighter">Colaboradores</h2>
          </div>
          <div className="space-y-16 md:space-y-24">
            {COLABORADORES.map((colab, ci) => (
              <div key={ci}>
                <div className="flex items-baseline gap-6 mb-8 border-b border-white/5 pb-6">
                  <h3 className="font-serif text-[clamp(2.5rem,7vw,80px)] uppercase tracking-tighter leading-none">{colab.nome}</h3>
                  <span className="text-[11px] tracking-[0.4em] text-zinc-400 uppercase">{colab.cargo}</span>
                </div>
                <div className="flex flex-col md:flex-row">
                  <div className="relative overflow-hidden group cursor-pointer md:w-[55%] shrink-0" style={{ height: 'clamp(340px, 55vw, 680px)' }} onClick={() => openLightbox(colab.fotos, 0)}>
                    <Image src={colab.principal} alt={colab.nome} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-105" sizes="55vw" />
                    <div className="absolute bottom-5 right-5 bg-black/70 backdrop-blur-sm px-4 py-2 flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                      <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-300">{colab.fotos.length} fotos</span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                  </div>
                  <div className="flex flex-1 justify-end">
                    <div className="flex flex-col justify-center pl-10 md:pl-16 pr-0 py-10 md:py-0 gap-8 w-full md:max-w-[280px] border-t border-zinc-500/50 md:border-t-0 md:border-l md:border-zinc-500/50">
                      <a href={colab.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-2.5 group">
                        <span className="text-[9px] tracking-[0.6em] text-zinc-400 uppercase">Instagram</span>
                        <div className="flex items-center gap-3 text-zinc-100 group-hover:text-white transition-colors">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                          <span className="text-[12px] tracking-[0.15em]">{colab.instagram}</span>
                        </div>
                      </a>
                      <div className="w-10 h-px bg-zinc-500" />
                      <a href={`tel:${colab.telefone.replace(/\s/g, '')}`} className="flex flex-col gap-2.5 group">
                        <span className="text-[9px] tracking-[0.6em] text-zinc-400 uppercase">Telefone</span>
                        <div className="flex items-center gap-3 text-zinc-100 group-hover:text-white transition-colors">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                          <span className="text-[12px] tracking-[0.15em]">{colab.telefone}</span>
                        </div>
                      </a>
                      <div className="w-10 h-px bg-zinc-500" />
                      <a href={colab.whatsapp} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-2.5 group">
                        <span className="text-[9px] tracking-[0.6em] text-zinc-400 uppercase">WhatsApp</span>
                        <div className="flex items-center gap-3 text-zinc-100 group-hover:text-white transition-colors">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                          <span className="text-[12px] tracking-[0.15em]">Enviar mensagem</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-14 px-6 md:px-8 border-t border-white/5 text-center bg-zinc-950/30">
        <p className="text-[10px] tracking-[0.6em] md:tracking-[0.8em] text-zinc-500 uppercase mb-4">ELEGANCE STUDIO © 2026 · PINHAL NOVO · PORTUGAL</p>
        <Link href="/politica-privacidade" className="text-[9px] tracking-[0.4em] text-zinc-700 uppercase hover:text-zinc-500 transition-colors">Política de Privacidade</Link>
      </footer>
    </div>
  )
}
