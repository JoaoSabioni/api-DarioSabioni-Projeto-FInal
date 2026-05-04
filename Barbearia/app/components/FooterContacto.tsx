'use client'

export default function FooterContacto() {
  return (
    <footer id="contacto" className="py-24 px-12 bg-black border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 relative z-10">
        <div className="space-y-8">
          <h2 className="font-display text-5xl uppercase leading-none">ELEGANCE<br/><span className="text-silver-dim">STUDIO</span></h2>
          <div className="space-y-4 text-[11px] tracking-[0.3em] uppercase text-silver-dim">
            <p>Pinhal Novo, Portugal</p>
            <p>Seg — Sáb: 09:00 — 20:00</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] tracking-[0.5em] uppercase text-white/40">Contacto</p>
            <a
              href="tel:+351933320269"
              className="text-[11px] tracking-[0.3em] uppercase text-silver-dim hover:text-white transition-colors"
            >
              +351 933 320 269
            </a>
          </div>
        </div>
        <div className="flex flex-col justify-end md:items-end text-right space-y-4">
          <p className="text-[9px] tracking-[0.5em] text-white/40 uppercase">© 2026 Rigor Técnico</p>
          <div className="flex gap-6 text-[10px] tracking-[0.2em] uppercase font-bold">
            <a href="#" className="hover:text-silver-dim transition-colors">Instagram</a>
            <a href="#" className="hover:text-silver-dim transition-colors">WhatsApp</a>
          </div>
        </div>
      </div>
    </footer>
  )
}