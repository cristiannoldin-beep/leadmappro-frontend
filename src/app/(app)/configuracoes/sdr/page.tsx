'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bot,
  Clock,
  MessageSquare,
  Save,
  Loader2,
  Sparkles,
  Zap,
  ArrowLeft,
} from 'lucide-react'

interface SdrConfig {
  id?: string
  ativo: boolean
  mensagemFollowup1: string
  mensagemFollowup2: string
  delayFollowup1Horas: number
  delayFollowup2Horas: number
}

const DEFAULT_CONFIG: SdrConfig = {
  ativo: false,
  mensagemFollowup1: 'Oi {nome_empresa}! Queria saber se ficou alguma dúvida sobre o que conversamos. Posso te ajudar?',
  mensagemFollowup2: 'Olá {nome_empresa}, tudo certo? Caso ainda tenha interesse, estou à disposição para uma conversa rápida.',
  delayFollowup1Horas: 24,
  delayFollowup2Horas: 72,
}

export default function ConfiguracoesSdrPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SdrConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    api.get<{ config: SdrConfig | null }>('/sdr/configuracao')
      .then((data) => {
        if (data.config) {
          setConfig({
            ativo: data.config.ativo ?? false,
            mensagemFollowup1: data.config.mensagemFollowup1 ?? DEFAULT_CONFIG.mensagemFollowup1,
            mensagemFollowup2: data.config.mensagemFollowup2 ?? DEFAULT_CONFIG.mensagemFollowup2,
            delayFollowup1Horas: data.config.delayFollowup1Horas ?? DEFAULT_CONFIG.delayFollowup1Horas,
            delayFollowup2Horas: data.config.delayFollowup2Horas ?? DEFAULT_CONFIG.delayFollowup2Horas,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/sdr/configuracao', config)
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-3xl space-y-6">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl space-y-6 pb-12">
      <div>
        <Link href="/configuracoes" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Configurações
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="h-6 w-6 text-emerald-500" />
              SDR Autônomo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Follow-ups automáticos para leads que não responderam.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={config.ativo ? 'default' : 'secondary'} className={config.ativo ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' : ''}>
              {config.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Ativar SDR */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" />
                Ativar Follow-up Automático
              </CardTitle>
              <CardDescription className="mt-1">
                Quando ativo, o sistema envia follow-ups automáticos para contatos sem resposta.
              </CardDescription>
            </div>
            <Switch
              checked={config.ativo}
              onCheckedChange={(v) => setConfig((p) => ({ ...p, ativo: v }))}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Follow-up 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-500" /> Follow-up 1
          </CardTitle>
          <CardDescription>Enviado quando o contato não responde após a primeira mensagem.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <Label className="whitespace-nowrap text-sm">Enviar após</Label>
            <Input
              type="number"
              min={1}
              max={168}
              value={config.delayFollowup1Horas}
              onChange={(e) => setConfig((p) => ({ ...p, delayFollowup1Horas: Number(e.target.value) }))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">horas sem resposta</span>
          </div>
          <div className="space-y-1.5">
            <Label>Mensagem</Label>
            <Textarea
              value={config.mensagemFollowup1}
              onChange={(e) => setConfig((p) => ({ ...p, mensagemFollowup1: e.target.value }))}
              rows={4}
              placeholder="Mensagem do follow-up 1... Use {nome_empresa}"
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Variável disponível: <code className="bg-muted px-1 rounded">{'{nome_empresa}'}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" /> Follow-up 2
          </CardTitle>
          <CardDescription>Último contato antes de marcar como sem resposta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <Label className="whitespace-nowrap text-sm">Enviar após</Label>
            <Input
              type="number"
              min={1}
              max={720}
              value={config.delayFollowup2Horas}
              onChange={(e) => setConfig((p) => ({ ...p, delayFollowup2Horas: Number(e.target.value) }))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">horas desde o follow-up 1</span>
          </div>
          <div className="space-y-1.5">
            <Label>Mensagem</Label>
            <Textarea
              value={config.mensagemFollowup2}
              onChange={(e) => setConfig((p) => ({ ...p, mensagemFollowup2: e.target.value }))}
              rows={4}
              placeholder="Mensagem do follow-up 2... Use {nome_empresa}"
              className="resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Como funciona</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Follow-up 1 é enviado para contatos em etapa "primeira_msg" sem resposta</li>
                <li>Follow-up 2 é enviado para quem também não respondeu ao follow-up 1</li>
                <li>Após o follow-up 2, o lead é marcado como "sem_resposta" e finalizado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar configurações
        </Button>
      </div>
    </div>
  )
}
