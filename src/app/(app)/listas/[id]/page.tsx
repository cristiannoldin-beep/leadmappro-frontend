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
import { Progress } from '@/components/ui/progress'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft, FileSpreadsheet, Search, Phone, Globe,
  Users, MapPin, Loader2, Play, RefreshCw,
  CheckCircle2, MessageCircle, Sparkles, ChevronDown, UserPlus,
} from 'lucide-react'

interface Lista {
  id: string
  nome: string
  origem: string
  segmento?: string
  cidade?: string
  estado?: string
  googleVariacoesIa?: string[]
  googleQueriesUsadas?: string[]
}

interface Contato {
  id: string
  nome_empresa: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  cnpj?: string
  atividade?: string
  website?: string
  status_whatsapp?: string
  status?: string
}

function WhatsappBadge({ status }: { status?: string }) {
  if (status === 'valido') return <Badge className="bg-green-500/10 text-green-500 border-none text-xs">Válido</Badge>
  if (status === 'invalido') return <Badge variant="destructive" className="text-xs">Inválido</Badge>
  if (status === 'telefone_invalido') return <Badge variant="outline" className="text-xs text-orange-500">Tel. Inválido</Badge>
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
  const [filtroWhatsapp, setFiltroWhatsapp] = useState<'todos' | 'valido' | 'nao_validado' | 'invalido'>('todos')
  const [filtroSite, setFiltroSite] = useState<'todos' | 'com_site' | 'sem_site'>('todos')

  // Estados de prospecção
  const [variacoes, setVariacoes] = useState<string[]>([])
  const [buscando, setBuscando] = useState(false)
  const [buscaProgress, setBuscaProgress] = useState(0)
  const [buscaStatus, setBuscaStatus] = useState('')
  const [validando, setValidando] = useState(false)
  const [queryManual, setQueryManual] = useState('')

  const fetchContatos = useCallback(() => {
    setLoadingContatos(true)
    api.get<{ contatos: unknown[]; total: number }>(`/listas/${id}/contatos?page=1&limit=200`)
      .then((data) => {
        // A API retorna cada item como ListaContato com o contato aninhado em `.contatos`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: Contato[] = (data.contatos ?? []).map((lc: any) => ({
          id: lc.contato_id ?? lc.id,
          nome_empresa: lc.contatos?.nome_empresa ?? lc.nome_empresa ?? '',
          telefone: lc.contatos?.telefone ?? lc.telefone,
          endereco: lc.contatos?.endereco ?? lc.endereco,
          cidade: lc.contatos?.cidade ?? lc.cidade,
          estado: lc.contatos?.estado ?? lc.estado,
          cnpj: lc.contatos?.cnpj ?? lc.cnpj,
          atividade: lc.contatos?.atividade ?? lc.atividade,
          website: lc.contatos?.website ?? lc.website,
          status_whatsapp: lc.status_whatsapp,
          status: lc.status,
        }))
        setContatos(mapped)
      })
      .catch(() => setContatos([]))
      .finally(() => setLoadingContatos(false))
  }, [id])

  const fetchLista = useCallback(() => {
    api.get<{ lista: Lista }>(`/listas/${id}`)
      .then((data) => {
        const l = data.lista
        setLista(l)
        setVariacoes(l.googleVariacoesIa ?? [])
        setQueryManual(l.segmento ?? '')
      })
      .catch(() => toast.error('Erro ao carregar lista'))
      .finally(() => setLoadingLista(false))
  }, [id])

  useEffect(() => { fetchLista() }, [fetchLista])
  useEffect(() => { fetchContatos() }, [fetchContatos])

  // Buscar no Google Maps — gera variações automaticamente (até 15) se não existirem
  const handleBuscar = async () => {
    const segmento = lista?.segmento || queryManual.trim()
    if (variacoes.length === 0 && !segmento) {
      toast.error('Informe um segmento para buscar.')
      return
    }
    setBuscando(true)
    setBuscaProgress(0)
    let vars = variacoes

    try {
      if (vars.length === 0) {
        setBuscaStatus('Gerando variações de busca…')
        const result = await api.post<{ variacoes: string[]; quantidade: number }>(
          '/prospeccao/gerar-variacoes',
          { listaId: id, segmento, cidade: lista?.cidade, estado: lista?.estado, limite: 15 }
        )
        vars = result.variacoes.slice(0, 15)
        setVariacoes(vars)
      }

      const rounds = vars.length || 1
      let acumulado = 0

      for (let i = 0; i < rounds; i++) {
        setBuscaStatus(`Buscando variação ${i + 1} de ${rounds}…`)
        setBuscaProgress(Math.round((i / rounds) * 100))
        const result = await api.post<{
          inseridos: number; duplicados: number; queryUtilizada: string;
          todasQueriesUsadas: boolean; queriesRestantes: number
        }>(
          '/prospeccao/google-maps',
          { listaId: id, ...(vars.length === 0 ? { query: segmento } : {}) }
        )
        acumulado += result.inseridos
        setBuscaProgress(Math.round(((i + 1) / rounds) * 100))
        if (result.todasQueriesUsadas) break
        if (i < rounds - 1) await new Promise(r => setTimeout(r, 500))
      }

      toast.success(`${acumulado} empresas adicionadas à lista!`)
      fetchContatos()
      fetchLista()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro na busca.')
    } finally {
      setBuscando(false)
      setBuscaProgress(100)
      setBuscaStatus('')
    }
  }

  // Validar WhatsApp
  const handleValidarWhatsApp = async () => {
    const naoValidados = contatos.filter(c => !c.status_whatsapp || c.status_whatsapp === 'nao_validado').length
    if (naoValidados === 0) { toast.info('Todos os contatos já foram validados.'); return }
    setValidando(true)
    try {
      let remaining = naoValidados
      let totalValidos = 0
      while (remaining > 0) {
        const result = await api.post<{ validos: number; hasMore: boolean; remaining: number }>(
          '/prospeccao/validar-whatsapp',
          { listaId: id, limit: 20 }
        )
        totalValidos += result.validos
        remaining = result.remaining
        fetchContatos()
        if (!result.hasMore) break
        await new Promise(r => setTimeout(r, 1000))
      }
      toast.success(`Validação concluída! ${totalValidos} WhatsApps válidos encontrados.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro na validação.')
    } finally {
      setValidando(false)
    }
  }

  const handleRevalidarTudo = async () => {
    setValidando(true)
    try {
      let remaining = contatos.length
      let totalValidos = 0
      while (remaining > 0) {
        const result = await api.post<{ validos: number; hasMore: boolean; remaining: number }>(
          '/prospeccao/validar-whatsapp',
          { listaId: id, limit: 20, force: true }
        )
        totalValidos += result.validos
        remaining = result.remaining
        fetchContatos()
        if (!result.hasMore) break
        await new Promise(r => setTimeout(r, 1000))
      }
      toast.success(`Revalidação concluída! ${totalValidos} WhatsApps válidos encontrados.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro na revalidação.')
    } finally {
      setValidando(false)
    }
  }

  const handleEnriquecerDados = () => {
    toast.info('Enriquecimento de dados em breve. Integração com BrasilAPI + LeadCNPJ sendo implementada.')
  }

  const handleExportCSV = () => {
    if (contatos.length === 0) { toast.error('Nenhum contato para exportar.'); return }
    const headers = ['Empresa', 'Telefone', 'WhatsApp', 'Cidade', 'Estado', 'Website']
    const rows = contatos.map(c => [c.nome_empresa ?? '', c.telefone ?? '', c.status_whatsapp ?? '', c.cidade ?? '', c.estado ?? '', c.website ?? ''])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `${lista?.nome ?? 'lista'}-contatos.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado!')
  }

  const filtered = contatos.filter(c => {
    if (searchTerm && !c.nome_empresa?.toLowerCase().includes(searchTerm.toLowerCase()) && !c.telefone?.includes(searchTerm)) return false
    if (filtroWhatsapp === 'valido' && c.status_whatsapp !== 'valido') return false
    if (filtroWhatsapp === 'invalido' && c.status_whatsapp !== 'invalido') return false
    if (filtroWhatsapp === 'nao_validado' && c.status_whatsapp && c.status_whatsapp !== 'nao_validado') return false
    if (filtroSite === 'com_site' && !c.website) return false
    if (filtroSite === 'sem_site' && c.website) return false
    return true
  })

  const isGoogleMaps = lista?.origem === 'google_maps'
  const queriesUsadas = lista?.googleQueriesUsadas?.length ?? 0
  const validosCount = contatos.filter(c => c.status_whatsapp === 'valido').length
  const naoValidadosCount = contatos.filter(c => !c.status_whatsapp || c.status_whatsapp === 'nao_validado').length

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">

      {/* Header */}
      <div>
        <Link href="/listas" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Listas
        </Link>
        {loadingLista ? <Skeleton className="h-10 w-64 mb-2" /> : (
          <h1 className="text-4xl font-bold">{lista?.nome ?? 'Lista'}</h1>
        )}
        {lista && (
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>Origem: {lista.origem.replace(/_/g, ' ')}</span>
            {(lista.cidade || lista.estado) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[lista.cidade, lista.estado].filter(Boolean).join('/')}
              </span>
            )}
            {lista.segmento && <span className="italic">{lista.segmento}</span>}
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
            <MessageCircle className="h-4 w-4 text-green-500" />
            <span className="text-xl font-bold text-green-500">{validosCount}</span>
            <span className="text-sm text-muted-foreground">WhatsApp Válidos</span>
          </div>
          {isGoogleMaps && queriesUsadas > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              <span className="text-xl font-bold text-blue-500">{queriesUsadas}</span>
              <span className="text-sm text-muted-foreground">Buscas feitas</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Painel de Prospecção Google Maps ── */}
      {isGoogleMaps && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Prospecção Google Maps</p>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Segmento (ex: funerárias, clínicas médicas...)"
                value={queryManual}
                onChange={e => setQueryManual(e.target.value)}
                disabled={buscando}
                className="flex-1"
              />
              <Button onClick={handleBuscar} disabled={buscando || (!lista?.segmento && !queryManual.trim())} className="gap-2 shrink-0">
                {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {buscando ? buscaStatus || 'Buscando…' : variacoes.length > 0 ? `Buscar (${variacoes.length} variações)` : 'Buscar'}
              </Button>
              {contatos.length > 0 && (
                <Button onClick={handleValidarWhatsApp} disabled={validando || naoValidadosCount === 0} variant="outline" className="gap-2 shrink-0">
                  {validando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {validando ? 'Validando…' : `Validar WhatsApp (${naoValidadosCount})`}
                </Button>
              )}
            </div>

            {buscando && <Progress value={buscaProgress} className="h-1.5" />}

            {/* Chips das variações já geradas */}
            {variacoes.length > 0 && !buscando && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {variacoes.map((v, i) => {
                  const usada = lista?.googleQueriesUsadas?.some(q => q.includes(v.split(' em ')[0]))
                  return (
                    <span key={i} className={`text-xs px-2.5 py-1 rounded-full border ${usada ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-muted text-muted-foreground'}`}>
                      {usada && '✓ '}{v}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barra de busca + filtros (linha 1) */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por empresa ou telefone…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtroWhatsapp} onValueChange={v => setFiltroWhatsapp(v as typeof filtroWhatsapp)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Todos WhatsApp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos WhatsApp</SelectItem>
            <SelectItem value="valido">✓ WhatsApp válido</SelectItem>
            <SelectItem value="nao_validado">Não validado</SelectItem>
            <SelectItem value="invalido">✗ Inválido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroSite} onValueChange={v => setFiltroSite(v as typeof filtroSite)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Todos Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Sites</SelectItem>
            <SelectItem value="com_site">Com site</SelectItem>
            <SelectItem value="sem_site">Sem site</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Barra de ações (linha 2) */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { fetchContatos(); fetchLista() }} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar Lista
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={validando || contatos.length === 0} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              {validando ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              {validando ? 'Validando…' : `Validar WhatsApp`}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleValidarWhatsApp} disabled={naoValidadosCount === 0}>
              Validar não validados ({naoValidadosCount})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleRevalidarTudo}>
              Revalidar todos ({contatos.length})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" onClick={handleExportCSV} disabled={contatos.length === 0} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Exportar Planilha
        </Button>

        <Button variant="outline" onClick={handleEnriquecerDados} disabled={contatos.length === 0} className="gap-2">
          <Sparkles className="h-4 w-4" /> Enriquecer Dados
        </Button>

        <Button variant="outline" disabled className="gap-2 opacity-50">
          <UserPlus className="h-4 w-4" /> Prospectar Clientes
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Website</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingContatos ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
              ))
            ) : filtered.length > 0 ? (
              filtered.map(c => (
                <TableRow key={c.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium max-w-[200px]">
                    <div>{c.nome_empresa}</div>
                    {c.atividade && <div className="text-xs text-muted-foreground truncate">{c.atividade}</div>}
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <div className="text-sm leading-snug">
                      {c.endereco && <div className="truncate">{c.endereco}</div>}
                      {(c.cidade || c.estado) && (
                        <div className="text-xs text-muted-foreground">{[c.cidade, c.estado].filter(Boolean).join(' / ')}</div>
                      )}
                      {!c.endereco && !c.cidade && <span className="text-muted-foreground text-xs">-</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{c.telefone ?? '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell><WhatsappBadge status={c.status_whatsapp} /></TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground font-mono">{c.cnpj ?? '-'}</span>
                  </TableCell>
                  <TableCell>
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-sm">
                        <Globe className="h-3 w-3" />
                        <span className="max-w-[140px] truncate">{c.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                      </a>
                    ) : <span className="text-muted-foreground text-sm">-</span>}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="space-y-2">
                    <Search className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground text-sm">
                      {searchTerm ? 'Nenhum resultado para esse filtro.' : 'Nenhum contato ainda. Use o painel de prospecção acima.'}
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
