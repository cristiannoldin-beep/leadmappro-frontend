'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, Loader2, Save, Settings, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface CredencialApi {
  chave: string
  ativa: boolean
  statusTeste?: string | null
}

const CREDENCIAL_GROUPS: { title: string; description: string; keys: { chave: string; label: string; placeholder: string }[] }[] = [
  {
    title: 'IA e Prospecção',
    description: 'APIs para geração de variações e enriquecimento de leads',
    keys: [
      { chave: 'OPENAI_API_KEY', label: 'OpenAI API Key', placeholder: 'sk-proj-...' },
      { chave: 'GOOGLE_MAPS_API_KEY', label: 'Google Maps API Key', placeholder: 'AIza...' },
      { chave: 'FIRECRAWL_API_KEY', label: 'Firecrawl API Key (Enriquecimento)', placeholder: 'fc-...' },
    ],
  },
  {
    title: 'WhatsApp',
    description: 'Configurações de conexão com a API do WhatsApp',
    keys: [
      { chave: 'UAZAPI_BASE_URL', label: 'UazAPI Base URL', placeholder: 'https://api.uazapi.com' },
    ],
  },
  {
    title: 'Pagamentos',
    description: 'Gateways de pagamento para cobrança de clientes',
    keys: [
      { chave: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', placeholder: 'sk_live_...' },
      { chave: 'ASAAS_API_KEY', label: 'Asaas API Key', placeholder: '$aact_...' },
    ],
  },
]

const ALL_KEYS = CREDENCIAL_GROUPS.flatMap((g) => g.keys.map((k) => k.chave))

export default function ConfiguracoesPage() {
  const [configuradas, setConfiguradas] = useState<Record<string, boolean>>({})
  const [valores, setValores] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    api.get<{ credenciais: CredencialApi[] }>('/credenciais')
      .then((data) => {
        const map: Record<string, boolean> = {}
        ;(data.credenciais ?? []).forEach((c) => {
          map[c.chave] = c.ativa
        })
        setConfiguradas(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (chave: string) => {
    const valor = valores[chave]?.trim()
    if (!valor) {
      toast.error('Insira um valor válido.')
      return
    }
    setSaving((prev) => ({ ...prev, [chave]: true }))
    try {
      await api.post('/credenciais', { chave, valor })
      toast.success('Credencial salva!')
      setConfiguradas((prev) => ({ ...prev, [chave]: true }))
      setValores((prev) => ({ ...prev, [chave]: '' }))
    } catch {
      toast.error('Erro ao salvar credencial.')
    } finally {
      setSaving((prev) => ({ ...prev, [chave]: false }))
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-8 min-h-screen">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" /> Configurações
        </h1>
        <p className="text-muted-foreground font-medium">Gerencie suas conexões e integrações</p>
      </header>

      {/* WhatsApp link */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold">Canais de Disparo (WhatsApp)</CardTitle>
          <CardDescription>Gerencie conexões Meta Cloud Oficial ou UazAPI.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="font-bold uppercase text-xs tracking-widest rounded-xl">
            <Link href="/configuracoes/whatsapp">
              Gerenciar Canais de Disparo →
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* SDR link */}
      <Card className="border-2 border-emerald-500/20 bg-emerald-500/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold">SDR Autônomo</CardTitle>
          <CardDescription>Configure follow-ups automáticos para leads sem resposta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="font-bold uppercase text-xs tracking-widest rounded-xl border-emerald-500/30">
            <Link href="/configuracoes/sdr">
              Configurar SDR →
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Credentials */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((k) => <Skeleton key={k} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {CREDENCIAL_GROUPS.map((group) => (
            <div key={group.title} className="space-y-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{group.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {group.keys.map(({ chave, label, placeholder }) => {
                  const isConfigurada = configuradas[chave]
                  const isVisible = showPassword[chave]
                  return (
                    <Card key={chave}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                          {isConfigurada && (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Configurada
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor={chave} className="text-xs">{isConfigurada ? 'Nova chave (para substituir)' : 'Chave'}</Label>
                          <div className="relative">
                            <Input
                              id={chave}
                              type={isVisible ? 'text' : 'password'}
                              value={valores[chave] ?? ''}
                              onChange={(e) => setValores((prev) => ({ ...prev, [chave]: e.target.value }))}
                              placeholder={isConfigurada ? '••••••••• (deixe em branco para manter)' : placeholder}
                              className="pr-10 text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              className="absolute right-1 top-1.5 h-7 w-7"
                              onClick={() => setShowPassword((prev) => ({ ...prev, [chave]: !prev[chave] }))}
                            >
                              {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSave(chave)}
                          disabled={saving[chave] || !valores[chave]?.trim()}
                          className="gap-2 h-8 text-xs"
                        >
                          {saving[chave] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Salvar
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
