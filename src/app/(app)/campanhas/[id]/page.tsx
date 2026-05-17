'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2, Play, Pause, List, Zap, Send } from 'lucide-react'

interface Campanha {
  id: string
  nome: string
  ativo: boolean
  listaId?: string
  lista?: { id: string; nome: string }
  limiteEnviosDia?: number
  tipo?: string
  mensagemBase?: string
  createdAt?: string
  totalContatos?: number
  totalEnviados?: number
  totalPendentes?: number
}

export default function CampanhaDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [campanha, setCampanha] = useState<Campanha | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [iniciando, setIniciando] = useState(false)
  const [disparando, setDisparando] = useState(false)

  const [editNome, setEditNome] = useState('')
  const [editMensagem, setEditMensagem] = useState('')

  const handleDisparar = async () => {
    setDisparando(true)
    try {
      const result = await api.post<{ enviados: number; erros: number; ignorados: number }>(`/campanhas/${id}/disparar`, {})
      toast.success(`Disparo concluído! ${result.enviados} enviados, ${result.erros} erros.`)
      const refreshed = await api.get<{ campanha: Campanha }>(`/campanhas/${id}`)
      setCampanha(refreshed.campanha)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro no disparo.')
    } finally {
      setDisparando(false)
    }
  }

  const handleIniciar = async () => {
    setIniciando(true)
    try {
      const result = await api.post<{ inseridos: number; message?: string }>(`/campanhas/${id}/iniciar`, {})
      toast.success(result.message ?? `${result.inseridos} contatos adicionados à campanha!`)
      const refreshed = await api.get<{ campanha: Campanha }>(`/campanhas/${id}`)
      setCampanha(refreshed.campanha)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar campanha.')
    } finally {
      setIniciando(false)
    }
  }

  useEffect(() => {
    api.get<{ campanha: Campanha }>(`/campanhas/${id}`)
      .then((data) => {
        const c = data.campanha
        setCampanha(c)
        setEditNome(c.nome ?? '')
        setEditMensagem(c.mensagemBase ?? '')
      })
      .catch(() => {
        toast.error('Erro ao carregar campanha.')
        router.push('/campanhas')
      })
      .finally(() => setLoading(false))
  }, [id, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/campanhas/${id}`, {
        nome: editNome,
        mensagemBase: editMensagem,
      })
      toast.success('Campanha atualizada!')
      setCampanha((prev) => prev ? { ...prev, nome: editNome, mensagemBase: editMensagem } : prev)
    } catch (err) {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async () => {
    if (!campanha) return
    try {
      await api.patch(`/campanhas/${id}`, { ativo: !campanha.ativo })
      toast.success(campanha.ativo ? 'Campanha pausada!' : 'Campanha ativada!')
      setCampanha((prev) => prev ? { ...prev, ativo: !prev.ativo } : prev)
    } catch {
      toast.error('Erro ao atualizar status.')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!campanha) return null

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-3xl">
      <div>
        <Link href="/campanhas" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Campanhas
        </Link>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">{campanha.nome}</h1>
          <div className="flex items-center gap-2">
            {campanha.ativo ? (
              <Badge className="bg-green-500/10 text-green-500 border-none">Ativa</Badge>
            ) : (
              <Badge variant="secondary">Pausada</Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleToggle} className="gap-2">
              {campanha.ativo ? <><Pause className="h-4 w-4" /> Pausar</> : <><Play className="h-4 w-4 text-green-500" /> Ativar</>}
            </Button>
            <Button size="sm" onClick={handleIniciar} disabled={iniciando} variant="outline" className="gap-2">
              {iniciando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {iniciando ? 'Carregando…' : 'Carregar Contatos'}
            </Button>
            <Button size="sm" onClick={handleDisparar} disabled={disparando || !campanha?.ativo} className="gap-2 bg-green-600 hover:bg-green-700">
              {disparando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {disparando ? 'Disparando…' : 'Disparar Agora'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-widest">Lista</p>
            <p className="text-sm font-semibold mt-1 truncate flex items-center gap-1">
              <List className="h-4 w-4 text-primary" />
              {campanha.lista?.nome ?? 'N/A'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-widest">Limite/dia</p>
            <p className="text-2xl font-bold mt-1">{campanha.limiteEnviosDia ?? 30}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-widest">Enviados</p>
            <p className="text-2xl font-bold mt-1 text-green-500">{campanha.totalEnviados ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-widest">Pendentes</p>
            <p className="text-2xl font-bold mt-1 text-amber-500">{campanha.totalPendentes ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>Editar Campanha</CardTitle>
          <CardDescription>Atualize o nome e a mensagem base da campanha</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="camp-nome">Nome da Campanha</Label>
            <Input
              id="camp-nome"
              value={editNome}
              onChange={(e) => setEditNome(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="camp-msg">Mensagem Base</Label>
            <Textarea
              id="camp-msg"
              value={editMensagem}
              onChange={(e) => setEditMensagem(e.target.value)}
              rows={5}
              placeholder="Olá {nome_empresa}, ..."
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Variáveis: {'{nome_empresa}'}, {'{cidade}'}, {'{segmento}'}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
