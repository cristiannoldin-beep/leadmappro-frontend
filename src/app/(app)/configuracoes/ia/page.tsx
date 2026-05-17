'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Save, Loader2, Sparkles, ArrowLeft, Bot } from 'lucide-react'

interface IaConfig {
  estiloResposta?: string
  exemplosMensagens?: string
}

export default function ConfiguracaoIaPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<IaConfig>({
    estiloResposta: 'Seja cordial, direto ao ponto e profissional.',
    exemplosMensagens: '',
  })
  const [testeMensagem, setTesteMensagem] = useState('')
  const [testando, setTestando] = useState(false)
  const [resultadoTeste, setResultadoTeste] = useState('')

  useEffect(() => {
    api.get<{ config: IaConfig | null }>('/ia/configuracao')
      .then((data) => {
        if (data.config) {
          setConfig({
            estiloResposta: data.config.estiloResposta ?? config.estiloResposta,
            exemplosMensagens: data.config.exemplosMensagens ?? '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/ia/configuracao', config)
      toast.success('Configuração de IA salva!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestar = async () => {
    if (!testeMensagem.trim()) return
    setTestando(true)
    setResultadoTeste('')
    try {
      const data = await api.post<{ mensagemMelhorada: string }>('/ia/melhorar-mensagem', {
        mensagem: testeMensagem,
      })
      setResultadoTeste(data.mensagemMelhorada)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao testar'
      toast.error(msg)
    } finally {
      setTestando(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-3xl space-y-6">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl space-y-6 pb-12">
      <div>
        <Link href="/configuracoes" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Configurações
        </Link>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          Configuração de IA
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Defina o estilo e tom das mensagens geradas pela IA.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-purple-500" /> Estilo de Resposta
          </CardTitle>
          <CardDescription>Instrução de tom e estilo que a IA usará ao melhorar mensagens.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Prompt de estilo</Label>
            <Textarea
              value={config.estiloResposta ?? ''}
              onChange={(e) => setConfig((p) => ({ ...p, estiloResposta: e.target.value }))}
              rows={4}
              placeholder="Ex: Seja direto, confiante e mostre autoridade no assunto. Use linguagem simples."
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Essa instrução é enviada para o modelo junto com cada solicitação de melhoria de mensagem.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Exemplos de mensagens (opcional)</Label>
            <Textarea
              value={config.exemplosMensagens ?? ''}
              onChange={(e) => setConfig((p) => ({ ...p, exemplosMensagens: e.target.value }))}
              rows={4}
              placeholder="Cole aqui exemplos de mensagens que já funcionaram para sua empresa..."
              className="resize-y font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" /> Testar Melhoria de Mensagem
          </CardTitle>
          <CardDescription>Simule como a IA vai melhorar uma mensagem com as configurações atuais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Mensagem original</Label>
            <Textarea
              value={testeMensagem}
              onChange={(e) => setTesteMensagem(e.target.value)}
              rows={3}
              placeholder="Ex: Olá, somos da empresa X e gostaríamos de apresentar nossos serviços..."
              className="resize-y"
            />
          </div>
          <Button
            onClick={handleTestar}
            disabled={testando || !testeMensagem.trim()}
            variant="outline"
            className="gap-2"
          >
            {testando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Melhorar com IA
          </Button>
          {resultadoTeste && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Mensagem Melhorada</p>
              <p className="text-sm whitespace-pre-wrap">{resultadoTeste}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="bg-purple-600 hover:bg-purple-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar configuração
        </Button>
      </div>
    </div>
  )
}
