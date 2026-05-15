'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, EyeOff, Loader2, Save, Settings } from 'lucide-react'
import Link from 'next/link'

interface Credencial {
  chave: string
  valor?: string
  configurada?: boolean
}

const CREDENCIAL_LABELS: Record<string, { label: string; placeholder: string }> = {
  GOOGLE_MAPS_API_KEY: { label: 'Google Maps API Key', placeholder: 'AIza...' },
  OPENAI_API_KEY: { label: 'OpenAI API Key', placeholder: 'sk-proj-...' },
}

const DEFAULT_CREDENCIAIS = Object.keys(CREDENCIAL_LABELS)

export default function ConfiguracoesPage() {
  const [credenciais, setCredenciais] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    api.get<{ credenciais: Credencial[] } | Credencial[]>('/credenciais')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).credenciais ?? []
        const map: Record<string, string> = {}
        list.forEach((c: Credencial) => {
          if (c.chave) map[c.chave] = c.configurada ? '••••••••' : (c.valor ?? '')
        })
        setCredenciais(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (chave: string) => {
    const valor = credenciais[chave]
    if (!valor || valor.includes('•') || !valor.trim()) {
      toast.error('Insira um valor válido.')
      return
    }
    setSaving((prev) => ({ ...prev, [chave]: true }))
    try {
      await api.put(`/credenciais/${chave}`, { valor })
      toast.success('Credencial salva com sucesso!')
      setCredenciais((prev) => ({ ...prev, [chave]: '••••••••' }))
    } catch (err) {
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
          <CardDescription>Configure o agente de vendas automático.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="font-bold uppercase text-xs tracking-widest rounded-xl border-emerald-500/30">
            <Link href="/configuracoes/sdr">
              Configurar SDR →
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* API Credentials */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Integrações</h2>
        {loading ? (
          <div className="space-y-4">
            {DEFAULT_CREDENCIAIS.map((k) => <Skeleton key={k} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {DEFAULT_CREDENCIAIS.map((chave) => {
              const meta = CREDENCIAL_LABELS[chave]
              const isVisible = showPassword[chave]
              return (
                <Card key={chave}>
                  <CardHeader>
                    <CardTitle className="text-base">{meta.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={chave}>API Key</Label>
                      <div className="relative">
                        <Input
                          id={chave}
                          type={isVisible ? 'text' : 'password'}
                          value={credenciais[chave] ?? ''}
                          onChange={(e) =>
                            setCredenciais((prev) => ({ ...prev, [chave]: e.target.value }))
                          }
                          placeholder={meta.placeholder}
                          className="pr-10"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1.5 h-8 w-8"
                          onClick={() =>
                            setShowPassword((prev) => ({ ...prev, [chave]: !prev[chave] }))
                          }
                        >
                          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSave(chave)}
                      disabled={saving[chave]}
                      className="gap-2"
                    >
                      {saving[chave] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Salvar
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
