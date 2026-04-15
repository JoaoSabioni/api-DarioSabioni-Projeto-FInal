'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/api'
import { saveAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      saveAuth(data)
      router.push('/dashboard')
    } catch {
      setError('Credenciais inválidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="font-serif text-[clamp(2.5rem,8vw,64px)] uppercase tracking-tighter leading-[0.85] mb-3">
            ELEGANCE<br /><span className="text-zinc-700">STUDIO</span>
          </h1>
          <p className="text-[10px] tracking-[0.6em] text-zinc-500 uppercase">Área de Gestão</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] tracking-[0.4em] text-zinc-400 uppercase mb-2 block">Utilizador</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="username"
              className="w-full bg-transparent border border-white/20 focus:border-white/60 outline-none px-5 py-4 text-[13px] text-white transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.4em] text-zinc-400 uppercase mb-2 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="w-full bg-transparent border border-white/20 focus:border-white/60 outline-none px-5 py-4 text-[13px] text-white transition-all"
            />
          </div>

          {error && (
            <p className="text-[11px] tracking-wider text-red-400 text-center">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={!username || !password || loading}
            className={`mt-2 w-full flex items-center justify-center px-6 py-5 border text-[11px] tracking-[0.3em] uppercase font-semibold transition-all duration-300 ${
              username && password && !loading
                ? 'border-white/20 hover:bg-white hover:text-black cursor-pointer'
                : 'border-white/5 text-zinc-700 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border border-current border-t-transparent animate-spin" />
            ) : (
              'Entrar'
            )}
          </button>
        </div>

        <p className="text-[9px] tracking-[0.4em] text-zinc-800 uppercase text-center mt-12">
          ELEGANCE STUDIO © 2026
        </p>
      </div>
    </div>
  )
}