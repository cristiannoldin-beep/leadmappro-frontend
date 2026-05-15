'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  ListChecks,
  Plus,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  FileSpreadsheet,
  Map,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

interface Lista {
  id: string
  nome: string
  origem: string
  segmento?: string
  cidade?: string
  estado?: string
  createdAt: string
  totalContatos?: number
}

export default function ListasPage() {
  const [listas, setListas] = useState<Lista[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchListas = () => {
    setLoading(true)
    api.get<{ listas: Lista[] } | Lista[]>('/listas')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).listas ?? []
        setListas(list)
      })
      .catch(() => setListas([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchListas()
  }, [])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await api.delete(`/listas/${id}`)
      toast.success('Lista excluída com sucesso!')
      setListas((prev) => prev.filter((l) => l.id !== id))
    } catch (err) {
      toast.error('Erro ao excluir lista.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Minhas Listas</h1>
          <p className="text-muted-foreground text-lg font-medium italic">
            Gerencie suas listas de contatos
          </p>
        </div>
        <Link href="/listas/criar">
          <Button className="h-12 gap-2 font-bold px-6 rounded-xl">
            <Plus className="h-4 w-4" />
            Nova Lista
          </Button>
        </Link>
      </div>

      {/* Lists Grid */}
      {loading ? (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : listas.length > 0 ? (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {listas.map((lista) => {
            const isGoogleMaps = lista.origem === 'google_maps'

            return (
              <div key={lista.id} className="group relative">
                <Link href={`/listas/${lista.id}`}>
                  <Card className="h-full hover:shadow-lg border border-border transition-all cursor-pointer rounded-xl overflow-hidden">
                    <CardHeader className="pb-3 px-6 pt-6">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                          {lista.nome}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className={`flex-shrink-0 font-bold text-[10px] uppercase px-3 py-1 rounded-full tracking-widest border-none ${
                            isGoogleMaps
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-purple-500/10 text-purple-500'
                          }`}
                        >
                          {isGoogleMaps ? (
                            <Map className="h-3.5 w-3.5 mr-1.5 inline" />
                          ) : (
                            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 inline" />
                          )}
                          {isGoogleMaps ? 'Google Maps' : lista.origem}
                        </Badge>
                      </div>
                      {lista.segmento && (
                        <CardDescription className="line-clamp-1 font-bold italic uppercase text-[10px] tracking-tight">
                          {lista.segmento}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4 px-6 pb-6">
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {(lista.cidade || lista.estado) && (
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-xl">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-bold text-xs">
                              {[lista.cidade, lista.estado].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="h-4 w-4 text-primary/60" />
                            <span className="font-bold">{lista.totalContatos ?? 0}</span>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                              contatos
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-4 w-4 text-muted-foreground/50" />
                            <span className="text-xs font-bold text-muted-foreground">
                              {formatDate(lista.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Delete button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-lg hover:scale-110 transition-transform"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          Excluir esta lista?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação removerá a lista <strong>{lista.nome}</strong> permanentemente.
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => handleDelete(lista.id)}
                          disabled={deletingId === lista.id}
                        >
                          {deletingId === lista.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Confirmar Exclusão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="p-6 rounded-2xl bg-muted">
              <ListChecks className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">Nenhuma lista por aqui</h3>
              <p className="text-muted-foreground font-medium max-w-sm italic">
                Sua base de dados está pronta para crescer. Crie sua primeira lista!
              </p>
            </div>
            <Link href="/listas/criar">
              <Button className="h-14 gap-3 font-bold uppercase tracking-widest px-8 rounded-2xl">
                <Plus className="h-5 w-5" />
                Criar Primeira Lista
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
