'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/api'
import { saveAuth } from '@/lib/auth'

/* ── Scissors SVG Loader ──────────────────────────────────────────────────── */
function ScissorsLoader() {
  return (
    <div className="scissors-loader flex flex-col items-center gap-6">
      {/* Scissors icon */}
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Top blade */}
        <g className="scissors-blade-top">
          <line x1="20" y1="20" x2="4" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="4" cy="5" r="3" stroke="white" strokeWidth="1.2" fill="none"/>
        </g>
        {/* Bottom blade */}
        <g className="scissors-blade-bottom">
          <line x1="20" y1="20" x2="4" y2="34" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="4" cy="35" r="3" stroke="white" strokeWidth="1.2" fill="none"/>
        </g>
        {/* Handle */}
        <line x1="20" y1="20" x2="36" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3"/>
        {/* Pivot */}
        <circle cx="20" cy="20" r="2" fill="white" fillOpacity="0.6"/>
      </svg>

      {/* Sweep line */}
      <div className="w-32 h-px bg-zinc-800 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 right-0 bg-white animate-sweep" />
      </div>

      <p className="text-[9px] tracking-[0.5em] text-zinc-600 uppercase">A autenticar</p>
    </div>
  )
}

/* ── Decorative background lines ─────────────────────────────────────────── */
function BackgroundLines() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Diagonal lines */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(135deg, white 0px, white 1px, transparent 1px, transparent 60px)',
        }}
      />
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-white/8" />
      <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-white/8" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b border-l border-white/8" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-white/8" />

      {/* Centre cross hair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/[0.03] rotate-45" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/[0.03] rotate-45" />
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    // Small delay so stagger animations play on mount
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      saveAuth(data)
      router.push('/dashboard')
    } catch {
      setError('Credenciais inválidas.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">
      <BackgroundLines />

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in">
          <ScissorsLoader />
        </div>
      )}

      <div className={`w-full max-w-sm relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Logo */}
        <div className="text-center mb-14">
          {/* Decorative top line */}
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="h-px w-12 gold-line" />
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="6" y="0" width="2" height="14" fill="rgba(255,255,255,0.2)"/>
              <rect x="0" y="6" width="14" height="2" fill="rgba(255,255,255,0.2)"/>
            </svg>
            <div className="h-px w-12 gold-line" />
          </div>

          <h1
            className="font-serif text-[clamp(2.8rem,9vw,72px)] uppercase tracking-tighter leading-[0.85] mb-4"
            style={{ animationDelay: '100ms' }}
          >
            ELEGANCE<br />
            <span className="text-zinc-700">STUDIO</span>
          </h1>

          <div className="flex items-center gap-3 justify-center mt-6">
            <div className="h-px w-8 bg-zinc-800" />
            <p className="text-[9px] tracking-[0.7em] text-zinc-600 uppercase">Área de Gestão</p>
            <div className="h-px w-8 bg-zinc-800" />
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-5">

          {/* Username */}
          <div className={`animate-fade-slide-up delay-100 ${mounted ? '' : 'opacity-0'}`}
            style={{ animationFillMode: 'forwards' }}>
            <label className="text-[9px] tracking-[0.5em] text-zinc-500 uppercase mb-2 block">
              Utilizador
            </label>
            <div className="relative group">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="username"
                autoComplete="username"
                className="w-full bg-transparent border border-white/15 focus:border-white/50 outline-none px-5 py-4 text-[13px] text-white transition-all duration-300 placeholder:text-zinc-700"
              />
              {/* Bottom focus line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-white scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          </div>

          {/* Password */}
          <div className={`animate-fade-slide-up delay-200 ${mounted ? '' : 'opacity-0'}`}
            style={{ animationFillMode: 'forwards' }}>
            <label className="text-[9px] tracking-[0.5em] text-zinc-500 uppercase mb-2 block">
              Password
            </label>
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-transparent border border-white/15 focus:border-white/50 outline-none px-5 py-4 text-[13px] text-white transition-all duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-white scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="animate-fade-in border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-center gap-3">
              <div className="w-1 h-4 bg-red-500/60 shrink-0" />
              <p className="text-[10px] tracking-wider text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className={`animate-fade-slide-up delay-300 mt-1 ${mounted ? '' : 'opacity-0'}`}
            style={{ animationFillMode: 'forwards' }}>
            <button
              onClick={handleLogin}
              disabled={!username || !password || loading}
              className={`w-full relative overflow-hidden flex items-center justify-center px-6 py-5 border text-[11px] tracking-[0.35em] uppercase font-medium transition-all duration-400 group ${
                username && password && !loading
                  ? 'border-white/25 text-white cursor-pointer hover:border-white hover:bg-white hover:text-black'
                  : 'border-white/6 text-zinc-700 cursor-not-allowed'
              }`}
            >
              {/* Hover fill animation */}
              {username && password && !loading && (
                <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              )}
              <span className="relative z-10">Entrar</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-14 flex items-center gap-4 justify-center">
          <div className="h-px flex-1 bg-zinc-900" />
          <p className="text-[8px] tracking-[0.4em] text-zinc-800 uppercase">ES © 2026</p>
          <div className="h-px flex-1 bg-zinc-900" />
        </div>

      </div>
    </div>
  )
}