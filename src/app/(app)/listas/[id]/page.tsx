'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft, FileSpreadsheet, Search, Phone, Globe,
  Users, MapPin, Loader2, ChevronDown,
} from 'lucide-react'

interface Lista {
  id: string
  nome: string
  origem: string
  segmento?: string
  cidade?: string
  estado?: string
  googleNextPageToken?: string | null
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

function WhatsappBadge({ status }: { status: string | undefined }) {
  if (status === 'valido') return <Badge className="bg-green-500/10 text-green-500 border-none text-xs">Válido</Badge>
  if (status === 'invalido') return <Badge variant="destructive" className="text-xs">Inválido</Badge>
  return <Badge variant="secondary" className="text-xs">Não validado</Badge>
}

export default function ListaResultadosPage() {
  const params = useParams()
  const id = params.id as string

  const [lista, setLista] = useState<Lista | null>(null)
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loadingLista, setLoadingLista] = useState(true)
  const [loadingContatos, setLoadingContatos] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Prospecção
  const [buscarQuery, setBuscarQuery] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)

  const fetchContatos = useCallback(() => {
    setLoadingContatos(true)
    api.get<{ contatos: Contato[] }>(`/listas/${id}/contatos?page=1&limit=200`)
      .then((data) => setContatos((data as any).contatos ?? []))
      .catch(() => setContatos([]))
      .finally(() => setLoadingContatos(false))
  }, [id])

  useEffect(() => {
    api.get<{ lista: Lista }>(`/listas/${id}`)
      .then((data) => {
        const l = data.lista
        setLista(l)
        setBuscarQuery(l.segmento ?? '')
        setNextPageToken(l.googleNextPageToken ?? null)
      })
      .catch(() => toast.error('Erro ao carregar lista'))
      .finally(() => setLoadingLista(false))
  }, [id])

  useEffect(() => { fetchContatos() }, [fetchContatos])

  const handleBuscar = async (pageToken?: string) => {
    if (!buscarQuery.trim()) { toast.error('Informe o que buscar.'); return }
    setBuscando(true)
    try {
      const result = await api.post<{ inseridos: number; ignorados: number; nextPageToken: string | null }>(
        '/prospeccao/google-maps',
        { listaId: id, query: buscarQuery.trim(), ...(pageToken ? { nextPageToken: pageToken } : {}) }
      )
      toast.success(`${result.inseridos} empresas adicionadas à lista!`)
      setNextPageToken(result.nextPageToken)
      fetchContatos()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro na busca.'
      toast.error(msg)
    } finally {
      setBuscando(false)
    }
  }

  const handleExportCSV = () => {
    if (contatos.length === 0) { toast.error('Nenhum contato para exportar.'); return }
    const headers = ['Empresa', 'Telefone', 'WhatsApp', 'Cidade', 'Estado', 'Website']
    const rows = contatos.map((c) => [
      c.nome_empresa ?? '', c.telefone ?? '', c.status_whatsapp ?? '',
      c.cidade ?? '', c.estado ?? '', c.website ?? '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `${lista?.nome ?? 'lista'}-contatos.csv`; a.click()
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
      <div className="mb-2">
        <Link href="/listas" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Listas
        </Link>
        {loadingLista ? (
          <Skeleton className="h-10 w-64 mb-2" />
        ) : (
          <h1 className="text-4xl font-bold">{lista?.nome ?? 'Resultados da Lista'}</h1>
        )}
        {lista && (
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <p className="text-muted-foreground text-sm">
              Origem: {lista.origem.replace(/_/g, ' ')}
            </p>
            {(lista.cidade || lista.estado) && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="h-3.5 w-3.5" />
                <span>{[lista.cidade, lista.estado].filter(Boolean).join('/')}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xl font-bold text-primary">{contatos.length}</span>
            <span className="text-sm text-muted-foreground">Contatos</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
            <span className="text-xl font-bold text-green-500">
              {contatos.filter((c) => c.status_whatsapp === 'valido').length}
            </span>
            <span className="text-sm text-muted-foreground">WhatsApp Válidos</span>
          </div>
        </div>
      </div>

      {/* ── Busca Google Maps ── */}
      {lista?.origem === 'google_maps' && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Buscar Empresas no Google Maps</p>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="query" className="text-xs text-muted-foreground">O que buscar</Label>
              <Input
                id="query"
                placeholder='Ex: funerárias, clínicas médicas, confecções...'
                value={buscarQuery}
                onChange={(e) => setBuscarQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !buscando && handleBuscar()}
                disabled={buscando}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => handleBuscar()} disabled={buscando} className="h-10 gap-2">
                {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {buscando ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>
          {lista.cidade && (
            <p className="text-xs text-muted-foreground">
              A busca será filtrada para: <strong>{[lista.cidade, lista.estado].filter(Boolean).join(', ')}</strong>
            </p>
          )}
          {nextPageToken && (
            <Button variant="outline" size="sm" onClick={() => handleBuscar(nextPageToken)} disabled={buscando} className="gap-2">
              <ChevronDown className="h-4 w-4" />
              Carregar mais resultados
            </Button>
          )}
        </div>
      )}

      {/* Filter + Export */}
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
      <div className="rounded-lg border bg-card overflow-hidden">
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
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
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
                  <TableCell><WhatsappBadge status={contato.status_whatsapp} /></TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{contato.status ?? 'novo'}</Badge>
                  </TableCell>
                  <TableCell>
                    {contato.website ? (
                      <a href={contato.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline text-sm">
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
                      {searchTerm ? 'Nenhum contato encontrado para esse filtro.' : 'Nenhum contato ainda. Use a busca acima para encontrar empresas.'}
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
