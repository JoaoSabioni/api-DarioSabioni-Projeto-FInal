'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/api'
import { saveAuth } from '@/lib/auth'

function ScissorsLoader() {
  return (
    <div className="scissors-loader flex flex-col items-center gap-6">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <g className="scissors-blade-top">
          <line x1="20" y1="20" x2="4" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="4" cy="5" r="3" stroke="white" strokeWidth="1.2" fill="none"/>
        </g>
        <g className="scissors-blade-bottom">
          <line x1="20" y1="20" x2="4" y2="34" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="4" cy="35" r="3" stroke="white" strokeWidth="1.2" fill="none"/>
        </g>
        <line x1="20" y1="20" x2="36" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3"/>
        <circle cx="20" cy="20" r="2" fill="white" fillOpacity="0.6"/>
      </svg>
      <div className="w-32 h-px bg-zinc-800 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 right-0 bg-white animate-sweep" />
      </div>
      <p className="text-[9px] tracking-[0.5em] text-zinc-600 uppercase">A autenticar</p>
    </div>
  )
}

function BackgroundLines() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'repeating-linear-gradient(135deg, white 0px, white 1px, transparent 1px, transparent 60px)' }}
      />
      {/* Cantos */}
      <div className="absolute top-0 left-0 w-40 h-40 border-t-2 border-l-2 border-white/12" />
      <div className="absolute top-0 right-0 w-40 h-40 border-t-2 border-r-2 border-white/12" />
      <div className="absolute bottom-0 left-0 w-40 h-40 border-b-2 border-l-2 border-white/12" />
      <div className="absolute bottom-0 right-0 w-40 h-40 border-b-2 border-r-2 border-white/12" />
      {/* Círculos concêntricos no centro */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/[0.04] rotate-45" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/[0.04] rotate-45" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-white/[0.04] rotate-45" />
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
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

      {loading && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in">
          <ScissorsLoader />
        </div>
      )}

      <div className={`w-full max-w-sm relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* ── Logo ── */}
        <div className="text-center mb-12">
          {/* Linha decorativa branca com glow */}
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="h-px w-16 accent-line" />
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="5" y="0" width="2" height="12" fill="rgba(255,255,255,0.35)"/>
              <rect x="0" y="5" width="12" height="2" fill="rgba(255,255,255,0.35)"/>
            </svg>
            <div className="h-px w-16 accent-line" />
          </div>

          {/* Título com glow branco */}
          <h1
            className="font-serif text-[clamp(3rem,10vw,76px)] uppercase tracking-tighter leading-[0.85] mb-4 animate-title-glow"
            style={{ animationDelay: '100ms' }}
          >
            <span className="text-white" style={{
              textShadow: '0 0 40px rgba(255,255,255,0.15), 0 0 80px rgba(255,255,255,0.06)'
            }}>ELEGANCE</span><br />
            <span className="text-zinc-600">STUDIO</span>
          </h1>

          {/* Sublinha decorativa */}
          <div className="flex items-center gap-3 justify-center mt-5">
            <div className="h-px w-10 bg-white/20" />
            <p className="text-[9px] tracking-[0.8em] text-zinc-500 uppercase">Área de Gestão</p>
            <div className="h-px w-10 bg-white/20" />
          </div>
        </div>

        {/* ── Form ── */}
        <div className="flex flex-col gap-5">

          {/* Username */}
          <div className={`animate-fade-slide-up ${mounted ? '' : 'opacity-0'}`}
            style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <label className="text-[10px] font-semibold tracking-[0.5em] text-zinc-400 uppercase mb-2.5 block">
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
                className="input-elegant"
              />
              {/* Barra de foco animada */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          </div>

          {/* Password */}
          <div className={`animate-fade-slide-up ${mounted ? '' : 'opacity-0'}`}
            style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <label className="text-[10px] font-semibold tracking-[0.5em] text-zinc-400 uppercase mb-2.5 block">
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
                className="input-elegant"
              />
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="animate-fade-in border border-red-500/25 bg-red-500/8 px-4 py-3 flex items-center gap-3">
              <div className="w-1 h-4 bg-red-500/70 shrink-0" />
              <p className="text-[11px] font-medium tracking-wide text-red-400">{error}</p>
            </div>
          )}

          {/* Botão */}
          <div className={`animate-fade-slide-up mt-2 ${mounted ? '' : 'opacity-0'}`}
            style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <button
              onClick={handleLogin}
              disabled={!username || !password || loading}
              className={`w-full relative overflow-hidden flex items-center justify-center px-6 py-5 border text-[12px] font-semibold tracking-[0.4em] uppercase transition-all duration-300 group ${
                username && password && !loading
                  ? 'border-white/35 text-white hover:border-white hover:bg-white hover:text-black'
                  : 'border-white/8 text-zinc-700 cursor-not-allowed'
              }`}
            >
              {username && password && !loading && (
                <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              )}
              <span className="relative z-10">Entrar</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center gap-4 justify-center">
          <div className="h-px flex-1 bg-white/8" />
          <p className="text-[8px] tracking-[0.5em] text-zinc-800 uppercase">ES © 2026</p>
          <div className="h-px flex-1 bg-white/8" />
        </div>
      </div>
    </div>
  )
}