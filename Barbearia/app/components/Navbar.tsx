'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type ActivePage = 'main' | 'servicos' | 'galeria' | 'marcar'

export default function Navbar({ activePage }: { activePage?: ActivePage }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = (page: ActivePage) =>
    `text-[12px] tracking-[0.2em] uppercase font-semibold transition-colors ${
      activePage === page ? 'text-white' : 'text-zinc-400 hover:text-white'
    }`

  const mobileLinkClass = (page: ActivePage) =>
    `text-[12px] tracking-[0.3em] uppercase font-semibold transition-colors ${
      activePage === page ? 'text-white' : 'text-zinc-400 hover:text-white'
    }`

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/10 bg-black/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 md:px-8 py-1">
        <Link href="/main" className="transition-all hover:opacity-70 flex items-center">
          <Image
            src="/logo.png"
            alt="Elegance Studio"
            height={90}
            width={90}
            className="h-[68px] md:h-[84px] w-auto"
          />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/servicos" className={linkClass('servicos')}>Serviços</Link>
          <Link href="/galeria"  className={linkClass('galeria')}>Galeria</Link>
          <Link href="/marcar" className="text-[11px] tracking-[0.2em] uppercase text-black bg-white px-6 py-2.5 font-bold hover:bg-zinc-200 transition-all">MARCAR</Link>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[6px]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`block w-6 h-px bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`block w-6 h-px bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-px bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-60' : 'max-h-0'} bg-black/98 border-t border-white/5`}>
        <div className="flex flex-col px-6 py-6 gap-6">
          <Link href="/servicos" onClick={() => setMenuOpen(false)} className={mobileLinkClass('servicos')}>Serviços</Link>
          <Link href="/galeria"  onClick={() => setMenuOpen(false)} className={mobileLinkClass('galeria')}>Galeria</Link>
          <Link href="/marcar"   onClick={() => setMenuOpen(false)} className="text-[11px] tracking-[0.3em] uppercase text-black bg-white px-6 py-3 font-bold text-center hover:bg-zinc-200 transition-all">MARCAR</Link>
        </div>
      </div>
    </nav>
  )
}