'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  FileSpreadsheet,
  Search,
  Phone,
  Globe,
  Users,
} from 'lucide-react'

interface Lista {
  id: string
  nome: string
  origem: string
  segmento?: string
  cidade?: string
  estado?: string
}

interface Contato {
  id: string
  nome_empresa: string
  telefone?: string
  status_whatsapp?: string
  status?: string
  website?: string
  cidade?: string
  estado?: string
}

interface ContatosResponse {
  contatos?: Contato[]
  data?: Contato[]
  total?: number
}

function getWhatsappBadge(status: string | undefined) {
  switch (status) {
    case 'valido':
      return <Badge className="bg-green-500/10 text-green-500 border-none text-xs">Válido</Badge>
    case 'invalido':
      return <Badge variant="destructive" className="text-xs">Inválido</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">Não validado</Badge>
  }
}

export default function ListaResultadosPage() {
  const params = useParams()
  const id = params.id as string

  const [lista, setLista] = useState<Lista | null>(null)
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loadingLista, setLoadingLista] = useState(true)
  const [loadingContatos, setLoadingContatos] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    api.get<Lista | { lista: Lista }>(`/listas/${id}`)
      .then((data) => {
        const lista = (data as any).lista ?? (data as Lista)
        setLista(lista)
      })
      .catch(() => toast.error('Erro ao carregar lista'))
      .finally(() => setLoadingLista(false))
  }, [id])

  useEffect(() => {
    api.get<ContatosResponse>(`/listas/${id}/contatos?page=1&limit=50`)
      .then((data) => {
        const list = (data as any).contatos ?? (data as any).data ?? []
        setContatos(Array.isArray(list) ? list : [])
      })
      .catch(() => setContatos([]))
      .finally(() => setLoadingContatos(false))
  }, [id])

  const handleExportCSV = () => {
    if (contatos.length === 0) {
      toast.error('Nenhum contato para exportar.')
      return
    }
    const headers = ['Empresa', 'Telefone', 'WhatsApp', 'Cidade', 'Estado', 'Website']
    const rows = contatos.map((c) => [
      c.nome_empresa ?? '',
      c.telefone ?? '',
      c.status_whatsapp ?? '',
      c.cidade ?? '',
      c.estado ?? '',
      c.website ?? '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lista?.nome ?? 'lista'}-contatos.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exportação concluída!')
  }

  const filtered = contatos.filter((c) =>
    c.nome_empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone?.includes(searchTerm)
  )

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="mb-4">
        <Link href="/listas" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Listas
        </Link>
        {loadingLista ? (
          <Skeleton className="h-10 w-64 mb-2" />
        ) : (
          <h1 className="text-4xl font-bold">{lista?.nome ?? 'Resultados da Lista'}</h1>
        )}
        {lista?.origem && (
          <p className="text-muted-foreground mt-1">
            Origem: {lista.origem.replace(/_/g, ' ')}
            {lista.cidade && ` • ${lista.cidade}`}
            {lista.estado && `/${lista.estado}`}
          </p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold text-primary">{contatos.length}</span>
            <span className="text-sm text-muted-foreground">Contatos</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
            <span className="text-2xl font-bold text-green-500">
              {contatos.filter((c) => c.status_whatsapp === 'valido').length}
            </span>
            <span className="text-sm text-muted-foreground">WhatsApp Válidos</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Website</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingContatos ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((contato) => (
                <TableRow key={contato.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{contato.nome_empresa}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{contato.telefone ?? '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getWhatsappBadge(contato.status_whatsapp)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {contato.status ?? 'novo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contato.website ? (
                      <a
                        href={contato.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline text-sm"
                      >
                        <Globe className="h-3 w-3" />
                        <span className="max-w-[150px] truncate">
                          {contato.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="space-y-2">
                    <Search className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Nenhum contato encontrado para esse filtro.' : 'Nenhum contato nesta lista ainda.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
