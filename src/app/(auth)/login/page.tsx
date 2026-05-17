'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, User, Smartphone } from 'lucide-react'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [celular, setCelular] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const result = await signIn(email, password)
        if (result?.error) setError(result.error)
      } else {
        const result = await signUp(email, password, nomeCompleto, celular)
        if (result?.error) setError(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <span className="text-primary-foreground font-black text-xl">L</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">LeadMap Pro</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta gratuitamente'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Nome completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Seu nome completo"
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      className="pl-10 h-11"
                      required
                      minLength={2}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="celular" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    WhatsApp
                  </Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="celular"
                      type="tel"
                      placeholder="(47) 9 9999-9999"
                      value={celular}
                      onChange={(e) => setCelular(e.target.value)}
                      className="pl-10 h-11"
                      required
                      minLength={10}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Usado para suporte e notificações via WhatsApp</p>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium text-center bg-destructive/10 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 font-bold text-base mt-2">
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aguarde...</>
                : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === 'login'
                ? <>Não tem conta? <span className="font-semibold text-primary">Criar agora</span></>
                : <>Já tem conta? <span className="font-semibold text-primary">Entrar</span></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
