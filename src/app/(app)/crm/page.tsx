'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  Calendar,
  Sparkles,
  MoreVertical,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ExternalLink,
} from 'lucide-react'

interface Oportunidade {
  id: string
  etapa: string
  valor_estimado?: number | null
  data_criacao?: string
  contato?: {
    id?: string
    nome_empresa?: string
    cidade?: string
    telefone?: string
  }
}

const etapas = [
  { id: 'novo', nome: 'Novo', color: 'bg-blue-500', borderColor: 'border-l-blue-500' },
  { id: 'contato_feito', nome: 'Contato Feito', color: 'bg-purple-500', borderColor: 'border-l-purple-500' },
  { id: 'proposta', nome: 'Interessados', color: 'bg-yellow-500', borderColor: 'border-l-yellow-500' },
  { id: 'negociacao', nome: 'Negociação', color: 'bg-orange-500', borderColor: 'border-l-orange-500' },
  { id: 'fechado', nome: 'Fechado', color: 'bg-green-500', borderColor: 'border-l-green-500' },
  { id: 'perdido', nome: 'Perdido', color: 'bg-red-500', borderColor: 'border-l-red-500' },
]

const formatCurrency = (value: number | null | undefined) => {
  if (!value) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function CRMKanbanPage() {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(etapas[0].id)

  useEffect(() => {
    api.get<{ oportunidades: Oportunidade[] } | Oportunidade[]>('/crm/oportunidades')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).oportunidades ?? []
        setOportunidades(list)
      })
      .catch(() => setOportunidades([]))
      .finally(() => setLoading(false))
  }, [])

  const getByEtapa = (etapa: string) =>
    oportunidades.filter((o) => o.etapa === etapa)

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const novaEtapa = destination.droppableId
    setOportunidades((prev) =>
      prev.map((o) => (o.id === draggableId ? { ...o, etapa: novaEtapa } : o))
    )

    try {
      await api.patch(`/crm/oportunidades/${draggableId}`, { etapa: novaEtapa })
      toast.success('Etapa atualizada!')
    } catch {
      toast.error('Erro ao mover oportunidade.')
      // Revert
      api.get<Oportunidade[]>('/crm/oportunidades')
        .then((data) => setOportunidades(Array.isArray(data) ? data : (data as any).oportunidades ?? []))
        .catch(() => {})
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await api.delete(`/crm/oportunidades/${deletingId}`)
      setOportunidades((prev) => prev.filter((o) => o.id !== deletingId))
      toast.success('Oportunidade removida.')
    } catch {
      toast.error('Erro ao remover.')
    } finally {
      setDeletingId(null)
    }
  }

  const totalOportunidades = oportunidades.length
  const valorTotal = oportunidades.reduce((acc, o) => acc + (o.valor_estimado ?? 0), 0)

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 md:px-6 md:py-5 border-b border-border bg-card shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Pipeline de Vendas (CRM)</h1>
              <p className="text-muted-foreground text-sm">Gerencie suas oportunidades</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Card className="flex items-center gap-2 px-4 py-2 border-none bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
              <div className="text-right">
                <p className="text-[9px] uppercase font-medium text-blue-600 dark:text-blue-400 tracking-widest opacity-80">Total</p>
                <p className="text-lg font-semibold text-blue-700 dark:text-blue-200">{totalOportunidades}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-2 px-4 py-2 border-none bg-green-50 dark:bg-emerald-900/30 rounded-2xl">
              <div className="text-right">
                <p className="text-[9px] uppercase font-medium text-green-600 dark:text-emerald-400 tracking-widest opacity-80">Valor Pipeline</p>
                <p className="text-lg font-semibold text-green-700 dark:text-emerald-200">{formatCurrency(valorTotal) ?? 'R$ 0,00'}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="lg:hidden px-4 py-3 border-b bg-card grid grid-cols-3 gap-2 shrink-0">
        {etapas.map((etapa) => (
          <button
            key={etapa.id}
            onClick={() => setActiveTab(etapa.id)}
            className={`px-1 py-2 rounded-lg text-[10px] font-medium transition-all flex flex-col items-center justify-center gap-1 border h-14 ${
              activeTab === etapa.id
                ? `border-transparent text-white shadow-md ${etapa.color}`
                : 'bg-card border-border text-muted-foreground'
            }`}
          >
            <span className="leading-tight text-center px-1">{etapa.nome}</span>
            <span className={`flex h-4 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[9px] font-medium ${
              activeTab === etapa.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {getByEtapa(etapa.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto p-4 md:p-6">
          <div className="flex gap-4 min-w-max lg:min-w-0 h-full pb-4 lg:grid lg:grid-cols-6 lg:gap-4">
            {etapas.map((etapa) => {
              const opps = getByEtapa(etapa.id)
              const isHiddenOnMobile = activeTab !== etapa.id

              return (
                <div
                  key={etapa.id}
                  className={`flex flex-col w-[85vw] sm:w-[300px] lg:w-full shrink-0 ${
                    isHiddenOnMobile ? 'hidden lg:flex' : 'flex'
                  }`}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-border bg-card shadow-sm mb-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${etapa.color}`} />
                      <h2 className="font-medium text-[11px] md:text-xs uppercase tracking-[0.15em] text-muted-foreground">{etapa.nome}</h2>
                    </div>
                    <Badge variant="outline" className="bg-muted border-none font-medium text-[10px] text-muted-foreground px-2.5 py-0.5 rounded-lg">
                      {opps.length}
                    </Badge>
                  </div>

                  <Droppable droppableId={etapa.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 rounded-xl p-2 space-y-3 transition-colors duration-200 overflow-y-auto max-h-[calc(100vh-300px)] ${
                          snapshot.isDraggingOver ? 'bg-primary/5' : 'bg-muted/20'
                        }`}
                      >
                        {loading ? (
                          <div className="space-y-3">
                            {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                          </div>
                        ) : (
                          opps.map((opp, index) => (
                            <Draggable key={opp.id} draggableId={opp.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`group relative ${snapshot.isDragging ? 'z-50' : ''}`}
                                >
                                  <Card className={`border border-border shadow-sm hover:shadow-lg transition-all rounded-2xl overflow-hidden border-l-4 ${etapa.borderColor} ${
                                    snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary/20 rotate-1 scale-[1.02]' : ''
                                  } bg-card`}>
                                    <div className="p-4 space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="space-y-1 max-w-[80%]">
                                          <h3 className="font-medium text-sm leading-normal line-clamp-2 mb-1">
                                            {opp.contato?.nome_empresa ?? 'Sem Nome'}
                                          </h3>
                                          {opp.contato?.cidade && (
                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                              <MapPin className="h-3 w-3 shrink-0" />
                                              <span className="truncate">{opp.contato.cidade}</span>
                                            </div>
                                          )}
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-48">
                                            {opp.contato?.id && (
                                              <DropdownMenuItem onClick={() => window.open(`/conversas?contato=${opp.contato?.id}`, '_self')}>
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                Abrir Conversa
                                              </DropdownMenuItem>
                                            )}
                                            {opp.contato?.telefone && (
                                              <DropdownMenuItem onClick={() => window.open(`https://wa.me/55${opp.contato?.telefone?.replace(/\D/g, '')}`, '_blank')}>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                WhatsApp Externo
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                              className="text-destructive focus:text-destructive"
                                              onClick={() => setDeletingId(opp.id)}
                                            >
                                              Remover
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>

                                      <div className="flex flex-wrap gap-1.5">
                                        {opp.valor_estimado ? (
                                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-none font-medium text-[10px]">
                                            {formatCurrency(opp.valor_estimado)}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="bg-muted text-muted-foreground border-none text-[10px]">
                                            R$ —
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="pt-2 border-t border-border flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                          <Calendar className="h-3 w-3" />
                                          {opp.data_criacao ? new Date(opp.data_criacao).toLocaleDateString('pt-BR') : '—'}
                                        </div>
                                        {opp.etapa === 'fechado' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                        {opp.etapa === 'perdido' && <AlertCircle className="h-4 w-4 text-red-500" />}
                                      </div>
                                    </div>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                        {!loading && opps.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-10 opacity-40">
                            <Sparkles className="h-8 w-8 mb-2" />
                            <p className="text-xs font-medium">Solte aqui</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </div>
      </DragDropContext>

      {/* Delete confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Oportunidade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A oportunidade será removida permanentemente do pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
