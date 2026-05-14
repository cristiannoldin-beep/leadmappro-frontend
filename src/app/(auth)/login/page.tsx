'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [celular, setCelular] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, nomeCompleto, celular)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 rounded-2xl border border-border bg-card shadow-lg">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h1>
          <p className="text-sm text-muted-foreground">LeadMap Pro</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <input
                type="text"
                placeholder="Nome completo"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                required
              />
              <input
                type="tel"
                placeholder="Celular (opcional)"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
        >
          {mode === 'login' ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
