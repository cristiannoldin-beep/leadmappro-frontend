'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Play, Pause, Eye, Sparkles, Trash2, Loader2 } from 'lucide-react'

interface Campanha {
  id: string
  nome: string
  ativo: boolean
  lista_id?: string
  lista_nome?: string
  limite_envios_dia?: number
  tipo?: string
}

interface Lista {
  id: string
  nome: string
}

export default function CampanhasPage() {
  const router = useRouter()
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [listas, setListas] = useState<Lista[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formNome, setFormNome] = useState('')
  const [formListaId, setFormListaId] = useState('')
  const [formLimite, setFormLimite] = useState('30')

  const fetchCampanhas = () => {
    api.get<{ campanhas: Campanha[] } | Campanha[]>('/campanhas')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).campanhas ?? []
        setCampanhas(list)
      })
      .catch(() => setCampanhas([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCampanhas()
    api.get<{ listas: Lista[] } | Lista[]>('/listas')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).listas ?? []
        setListas(list)
      })
      .catch(() => setListas([]))
  }, [])

  const toggleCampanha = async (id: string, ativo: boolean) => {
    try {
      await api.patch(`/campanhas/${id}`, { ativo: !ativo })
      toast.success(!ativo ? 'Campanha ativada!' : 'Campanha pausada!')
      setCampanhas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ativo: !ativo } : c))
      )
    } catch {
      toast.error('Erro ao atualizar campanha.')
    }
  }

  const deleteCampanha = async (id: string) => {
    try {
      await api.delete(`/campanhas/${id}`)
      toast.success('Campanha excluída com sucesso!')
      setCampanhas((prev) => prev.filter((c) => c.id !== id))
    } catch {
      toast.error('Erro ao excluir campanha.')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNome.trim() || !formListaId) {
      toast.error('Preencha nome e lista.')
      return
    }
    setSaving(true)
    try {
      const data = await api.post<{ campanha?: Campanha }>('/campanhas', {
        nome: formNome,
        lista_id: formListaId,
        limite_envios_dia: parseInt(formLimite) || 30,
        ativo: false,
      })
      const nova = (data as any).campanha ?? data
      setCampanhas((prev) => [nova, ...prev])
      toast.success('Campanha criada!')
      setModalOpen(false)
      setFormNome('')
      setFormListaId('')
      setFormLimite('30')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar campanha.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Campanhas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas campanhas de prospecção
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Todas as Campanhas
          </CardTitle>
          <CardDescription>Lista de todas as campanhas criadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Lista Associada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Limite Diário</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : campanhas.length > 0 ? (
                  campanhas.map((campanha) => (
                    <TableRow
                      key={campanha.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/campanhas/${campanha.id}`)}
                    >
                      <TableCell className="font-medium">{campanha.nome}</TableCell>
                      <TableCell>{campanha.lista_nome ?? 'N/A'}</TableCell>
                      <TableCell>
                        {campanha.ativo ? (
                          <Badge className="bg-green-500/10 text-green-500 border-none">Ativa</Badge>
                        ) : (
                          <Badge variant="secondary">Pausada</Badge>
                        )}
                      </TableCell>
                      <TableCell>{campanha.limite_envios_dia ?? 30} envios/dia</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleCampanha(campanha.id, campanha.ativo)}
                            title={campanha.ativo ? 'Pausar' : 'Ativar'}
                          >
                            {campanha.ativo ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/campanhas/${campanha.id}`)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Campanha</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Deseja excluir a campanha "{campanha.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCampanha(campanha.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="space-y-3">
                        <div className="inline-flex p-4 rounded-full bg-muted">
                          <Sparkles className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Nenhuma campanha criada ainda</p>
                        <Button onClick={() => setModalOpen(true)} size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Criar Primeira Campanha
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
            <DialogDescription>
              Configure uma nova campanha de prospecção via WhatsApp
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="camp-nome">Nome da Campanha *</Label>
              <Input
                id="camp-nome"
                placeholder="Ex: Prospecção Clínicas SP"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-lista">Lista de Contatos *</Label>
              <Select value={formListaId} onValueChange={setFormListaId} required>
                <SelectTrigger id="camp-lista">
                  <SelectValue placeholder="Selecione uma lista" />
                </SelectTrigger>
                <SelectContent>
                  {listas.map((lista) => (
                    <SelectItem key={lista.id} value={lista.id}>
                      {lista.nome}
                    </SelectItem>
                  ))}
                  {listas.length === 0 && (
                    <SelectItem value="_empty" disabled>
                      Nenhuma lista disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-limite">Limite de envios por dia</Label>
              <Input
                id="camp-limite"
                type="number"
                min={1}
                max={500}
                value={formLimite}
                onChange={(e) => setFormLimite(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Campanha'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
