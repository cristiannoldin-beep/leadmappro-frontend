'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Loader2, Mail, Lock, User, Smartphone,
  MapPin, Hash, Home, Building2, Map,
  Search, MessageCircle, BarChart3, Zap,
} from 'lucide-react'

interface AddressForm {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

const FEATURES = [
  { icon: Search, text: 'Prospecção no Google Maps com IA' },
  { icon: MessageCircle, text: 'Disparos WhatsApp automatizados' },
  { icon: BarChart3, text: 'CRM completo e pipeline de vendas' },
  { icon: Zap, text: 'SDR com inteligência artificial 24h' },
]

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // Dados pessoais
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [celular, setCelular] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Endereço
  const [addr, setAddr] = useState<AddressForm>({
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  })
  const [loadingCep, setLoadingCep] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setA = (field: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddr(prev => ({ ...prev, [field]: e.target.value }))

  const handleCepBlur = async () => {
    const digits = addr.cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setAddr(prev => ({
          ...prev,
          logradouro: data.logradouro ?? prev.logradouro,
          bairro: data.bairro ?? prev.bairro,
          cidade: data.localidade ?? prev.cidade,
          estado: data.uf ?? prev.estado,
        }))
      }
    } catch {}
    finally { setLoadingCep(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const result = await signIn(email, password)
        if (result?.error) setError(result.error)
      } else {
        const result = await signUp(email, password, nomeCompleto, celular, addr)
        if (result?.error) setError(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-slate-950 flex-col justify-between p-12 overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-primary-foreground font-black text-lg">L</span>
          </div>
          <span className="text-white font-black text-xl tracking-tight">LeadMap Pro</span>
        </div>

        {/* Hero text */}
        <div className="relative space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Plataforma B2B de Prospecção</span>
            </div>
            <h2 className="text-4xl font-black text-white leading-tight tracking-tight">
              Encontre clientes.<br />
              Converta pelo WhatsApp.<br />
              <span className="text-primary">Escale suas vendas.</span>
            </h2>
            <p className="text-slate-400 text-base max-w-sm leading-relaxed">
              Do Google Maps ao fechamento — tudo numa só plataforma com IA integrada.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-slate-300 text-xs font-medium leading-snug">{text}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-2">
              {['FA', 'MS', 'RN', 'JC'].map((init) => (
                <div key={init} className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-blue-600/40 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white">
                  {init}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-sm font-bold">+1.200 empresas ativas</p>
              <p className="text-slate-500 text-xs">prospectando com LeadMap</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-xs text-slate-600">
          © {new Date().getFullYear()} LeadMap Pro · Todos os direitos reservados
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black">L</span>
            </div>
            <span className="font-black text-lg">LeadMap Pro</span>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {mode === 'login' ? 'Entrar na plataforma' : 'Criar sua conta'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'login'
                ? 'Bem-vindo de volta!'
                : 'Preencha seus dados para começar gratuitamente'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <>
                {/* ── Dados Pessoais ── */}
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Dados Pessoais</p>

                  <div className="space-y-1.5">
                    <Label htmlFor="nome" className="text-xs font-semibold text-muted-foreground">Nome completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="nome" type="text" placeholder="Seu nome completo" value={nomeCompleto}
                        onChange={(e) => setNomeCompleto(e.target.value)} className="pl-10 h-11" required minLength={2} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="celular" className="text-xs font-semibold text-muted-foreground">WhatsApp *</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="celular" type="tel" placeholder="(47) 9 9999-9999" value={celular}
                        onChange={(e) => setCelular(e.target.value)} className="pl-10 h-11" required minLength={10} />
                    </div>
                  </div>
                </div>

                {/* ── Endereço ── */}
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Endereço</p>

                  <div className="space-y-1.5">
                    <Label htmlFor="cep" className="text-xs font-semibold text-muted-foreground">CEP *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      {loadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                      <Input id="cep" type="text" placeholder="00000-000" value={addr.cep}
                        onChange={setA('cep')} onBlur={handleCepBlur}
                        className="pl-10 h-11" required maxLength={9} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Digite o CEP para preencher o endereço automaticamente</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="logradouro" className="text-xs font-semibold text-muted-foreground">Rua / Logradouro *</Label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="logradouro" type="text" placeholder="Rua, Avenida, Travessa..." value={addr.logradouro}
                        onChange={setA('logradouro')} className="pl-10 h-11" required minLength={2} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="numero" className="text-xs font-semibold text-muted-foreground">Número *</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="numero" type="text" placeholder="123" value={addr.numero}
                          onChange={setA('numero')} className="pl-10 h-11" required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="complemento" className="text-xs font-semibold text-muted-foreground">Complemento</Label>
                      <Input id="complemento" type="text" placeholder="Apto, Sala..." value={addr.complemento}
                        onChange={setA('complemento')} className="h-11" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bairro" className="text-xs font-semibold text-muted-foreground">Bairro *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="bairro" type="text" placeholder="Bairro" value={addr.bairro}
                        onChange={setA('bairro')} className="pl-10 h-11" required minLength={2} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="cidade" className="text-xs font-semibold text-muted-foreground">Cidade *</Label>
                      <div className="relative">
                        <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="cidade" type="text" placeholder="Cidade" value={addr.cidade}
                          onChange={setA('cidade')} className="pl-10 h-11" required minLength={2} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="estado" className="text-xs font-semibold text-muted-foreground">UF *</Label>
                      <Input id="estado" type="text" placeholder="SC" value={addr.estado}
                        onChange={setA('estado')} className="h-11 uppercase text-center font-bold" required maxLength={2} />
                    </div>
                  </div>
                </div>

                {/* ── Acesso ── */}
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Dados de Acesso</p>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">E-mail *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="seu@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11"
                  required autoComplete="email" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">Senha *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password"
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11" required minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium text-center bg-destructive/10 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 font-bold text-base">
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aguarde...</>
                : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <div className="text-center">
            <button type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
