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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bot,
  Clock,
  Calendar,
  MessageSquare,
  Plus,
  Trash2,
  Save,
  Loader2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Target,
  Users,
  Zap,
  ArrowLeft,
} from 'lucide-react'

interface FollowupStep {
  dia: number
  mensagem: string
}

interface SdrConfig {
  id?: string
  sdr_ativo: boolean
  nome_sdr: string
  prompt_sistema: string
  horario_inicio: string
  horario_fim: string
  dias_semana: number[]
  followup_sequencia: FollowupStep[]
  max_respostas_auto_dia: number
  icp_criterios: { nicho: string; porte: string; cargo: string; regiao: string }
}

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

const DEFAULT_CONFIG: SdrConfig = {
  sdr_ativo: false,
  nome_sdr: 'Ana',
  prompt_sistema:
    'Você é um assistente comercial profissional respondendo em nome de um ser humano real. Seja cordial, direto e nunca mencione que é um bot ou IA. Máximo 2 parágrafos por resposta. Sempre finalize com uma pergunta ou call-to-action.',
  horario_inicio: '08:00',
  horario_fim: '18:00',
  dias_semana: [1, 2, 3, 4, 5],
  followup_sequencia: [
    { dia: 1, mensagem: 'Olá {nome_empresa}! Queria saber se ficou alguma dúvida sobre o que conversamos. Posso te ajudar com algo?' },
    { dia: 3, mensagem: 'Oi {nome_empresa}, tudo bem? Tenho um case de sucesso no seu segmento que pode te interessar. Vale uma troca rápida?' },
    { dia: 7, mensagem: 'Boa semana, {nome_empresa}! Só queria saber se o momento é oportuno. 15 minutos são suficientes para te mostrar os resultados que estamos gerando.' },
  ],
  max_respostas_auto_dia: 50,
  icp_criterios: { nicho: '', porte: '', cargo: '', regiao: '' },
}

export default function ConfiguracoesSdrPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SdrConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    api.get<SdrConfig | { configuracao: SdrConfig }>('/sdr/configuracao')
      .then((data) => {
        const c = (data as any).configuracao ?? data
        if (c && c.sdr_ativo !== undefined) {
          setConfig({ ...DEFAULT_CONFIG, ...c })
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleDia = (dia: number) => {
    setConfig((prev) => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter((d) => d !== dia)
        : [...prev.dias_semana, dia].sort(),
    }))
  }

  const addStep = () => {
    const lastDia = config.followup_sequencia[config.followup_sequencia.length - 1]?.dia ?? 0
    setConfig((prev) => ({
      ...prev,
      followup_sequencia: [...prev.followup_sequencia, { dia: lastDia + 7, mensagem: '' }],
    }))
  }

  const removeStep = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      followup_sequencia: prev.followup_sequencia.filter((_, i) => i !== idx),
    }))
  }

  const updateStep = (idx: number, field: keyof FollowupStep, value: string | number) => {
    setConfig((prev) => ({
      ...prev,
      followup_sequencia: prev.followup_sequencia.map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      ),
    }))
  }

  const moveStep = (idx: number, dir: -1 | 1) => {
    const newSeq = [...config.followup_sequencia]
    const swap = idx + dir
    if (swap < 0 || swap >= newSeq.length) return
    ;[newSeq[idx], newSeq[swap]] = [newSeq[swap], newSeq[idx]]
    setConfig((prev) => ({ ...prev, followup_sequencia: newSeq }))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-6 pb-12">
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
              Configure o agente de vendas que responde e faz follow-up automaticamente.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={config.sdr_ativo ? 'default' : 'secondary'} className={config.sdr_ativo ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' : ''}>
              {config.sdr_ativo ? 'Ativo' : 'Inativo'}
            </Badge>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
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
                Ativar SDR Autônomo
              </CardTitle>
              <CardDescription className="mt-1">
                Quando ativo, o SDR responde automaticamente e envia follow-ups programados.
              </CardDescription>
            </div>
            <Switch
              checked={config.sdr_ativo}
              onCheckedChange={(v) => setConfig((p) => ({ ...p, sdr_ativo: v }))}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Persona */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-500" /> Persona do SDR
          </CardTitle>
          <CardDescription>Como o agente vai se apresentar e se comportar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome do SDR</Label>
            <Input
              value={config.nome_sdr}
              onChange={(e) => setConfig((p) => ({ ...p, nome_sdr: e.target.value }))}
              placeholder="Ex: Ana, Carlos, Sofia..."
              className="max-w-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Prompt do sistema</Label>
            <Textarea
              value={config.prompt_sistema}
              onChange={(e) => setConfig((p) => ({ ...p, prompt_sistema: e.target.value }))}
              rows={5}
              placeholder="Descreva como o SDR deve se comportar..."
              className="resize-y font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Variáveis: <code className="bg-muted px-1 rounded text-xs">{'{nome_empresa}'}</code>{' '}
              <code className="bg-muted px-1 rounded text-xs">{'{segmento}'}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Horário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-500" /> Horário Comercial
          </CardTitle>
          <CardDescription>O SDR só envia mensagens dentro deste período.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-1.5">
              <Label>Início</Label>
              <Input type="time" value={config.horario_inicio} onChange={(e) => setConfig((p) => ({ ...p, horario_inicio: e.target.value }))} className="w-36" />
            </div>
            <div className="space-y-1.5">
              <Label>Fim</Label>
              <Input type="time" value={config.horario_fim} onChange={(e) => setConfig((p) => ({ ...p, horario_fim: e.target.value }))} className="w-36" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Dias da semana</Label>
            <div className="flex gap-2 flex-wrap">
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia.value}
                  type="button"
                  onClick={() => toggleDia(dia.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    config.dias_semana.includes(dia.value)
                      ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                      : 'bg-muted text-muted-foreground border-border hover:border-emerald-500/30'
                  }`}
                >
                  {dia.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Limite de respostas automáticas por dia</Label>
            <Input
              type="number"
              min={1} max={500}
              value={config.max_respostas_auto_dia}
              onChange={(e) => setConfig((p) => ({ ...p, max_respostas_auto_dia: Number(e.target.value) }))}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Sequence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-500" /> Sequência de Follow-up
              </CardTitle>
              <CardDescription>Mensagens enviadas quando o lead não responde.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addStep}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar etapa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.followup_sequencia.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma etapa configurada.</p>
          )}
          {config.followup_sequencia.map((step, idx) => (
            <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs shrink-0">Etapa {idx + 1}</Badge>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Enviar após</Label>
                  <Input
                    type="number" min={1}
                    value={step.dia}
                    onChange={(e) => updateStep(idx, 'dia', Number(e.target.value))}
                    className="w-16 h-7 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">dias sem resposta</span>
                </div>
                <div className="ml-auto flex gap-1">
                  <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0} className="p-1 rounded hover:bg-accent disabled:opacity-30">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === config.followup_sequencia.length - 1} className="p-1 rounded hover:bg-accent disabled:opacity-30">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => removeStep(idx)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Textarea
                value={step.mensagem}
                onChange={(e) => updateStep(idx, 'mensagem', e.target.value)}
                rows={3}
                placeholder="Mensagem da etapa... Use {nome_empresa}, {cidade}, {segmento}"
                className="text-sm resize-y"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ICP */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-500" /> Perfil Ideal de Cliente (ICP)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {(['nicho', 'porte', 'cargo', 'regiao'] as const).map((field) => (
              <div key={field} className="space-y-1.5">
                <Label className="capitalize">{field === 'regiao' ? 'Região' : field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                <Input
                  value={config.icp_criterios[field]}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, icp_criterios: { ...p.icp_criterios, [field]: e.target.value } }))
                  }
                  placeholder={field === 'nicho' ? 'Ex: Clínicas, Construtoras...' : field === 'porte' ? 'Ex: Pequena, Média...' : field === 'cargo' ? 'Ex: Diretor, Proprietário...' : 'Ex: Sul, SP, Nacional...'}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Como funciona o SDR Autônomo</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Quando um lead responde, o SDR gera uma resposta personalizada com IA</li>
                <li>Se o lead não responde, o CRON diário envia os follow-ups conforme a sequência</li>
                <li>Após a última etapa sem resposta, o lead é marcado como "sem_resposta"</li>
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
