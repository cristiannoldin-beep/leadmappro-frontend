'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Activity, Terminal, AlertCircle, Filter, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Log {
  id: string
  scope?: string
  message?: string
  nivel?: string
  payload?: Record<string, unknown>
  created_at?: string
  createdAt?: string
}

function getBadgeStyle(scope: string) {
  const s = (scope ?? '').toLowerCase()
  if (s.includes('error') || s.includes('fatal') || s.includes('critical')) return 'bg-red-500 text-white'
  if (s.includes('warning') || s.includes('system')) return 'bg-amber-500 text-white'
  if (s.includes('success') || s.includes('result')) return 'bg-emerald-500 text-white'
  return 'bg-blue-600 text-white'
}

export default function AdminLogsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [filterScope, setFilterScope] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role !== 'admin') return
    api.get<{ logs: Log[] } | Log[]>('/admin/logs')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).logs ?? []
        setLogs(list)
      })
      .catch(() => setLogs([]))
      .finally(() => setLoadingLogs(false))
  }, [user])

  if (loading || user?.role !== 'admin') {
    return (
      <div className="container mx-auto p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const filteredLogs = filterScope
    ? logs.filter((l) => (l.scope ?? '').toLowerCase().includes(filterScope.toLowerCase()))
    : logs

  return (
    <div className="container mx-auto p-6 md:p-10 space-y-8 min-h-screen">
      <header className="space-y-1 border-b pb-8">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Terminal className="h-5 w-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Real-time Event Streaming</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight">Logs do Sistema</h1>
        <p className="text-muted-foreground font-medium italic">Monitoramento técnico e auditoria de todas as operações.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="rounded-3xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total de Eventos</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-black">{logs.length}</p>
          </div>
        </Card>
        <Card
          className="rounded-3xl overflow-hidden cursor-pointer"
          onClick={() => setFilterScope(filterScope === 'Error' ? null : 'Error')}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Erros</span>
              <AlertCircle className="h-4 w-4 text-red-300" />
            </div>
            <p className="text-3xl font-black text-red-600">
              {logs.filter((l) => (l.scope ?? '').toLowerCase().includes('error')).length}
            </p>
          </div>
          <div className={cn('h-1.5 w-full transition-all', filterScope === 'Error' ? 'bg-red-600 opacity-100' : 'bg-red-500 opacity-30')} />
        </Card>
        <div className="md:col-span-2 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            className={cn('h-12 border-2 rounded-2xl gap-2 font-bold px-6', filterScope === 'Dispatch' && 'bg-muted')}
            onClick={() => setFilterScope(filterScope === 'Dispatch' ? null : 'Dispatch')}
          >
            <Filter className="h-4 w-4" /> Disparos
          </Button>
          <Button variant="outline" className="h-12 border-2 rounded-2xl font-bold px-6" onClick={() => setFilterScope(null)}>
            Limpar Filtro
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-[#0f172a] border border-white/5">
        <CardHeader className="border-b border-white/5 bg-slate-900/50 py-6 px-8 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
            <Activity className="h-4 w-4 text-primary" /> Fluxo de Atividade Técnica
            {filterScope && ` (Filtrado: ${filterScope})`}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="bg-[#0f172a] sticky top-0 z-20">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase font-black text-slate-500 pl-10 py-5 tracking-widest border-none w-[180px]">Timestamp</TableHead>
                  <TableHead className="text-[10px] uppercase font-black text-slate-500 tracking-widest border-none w-[160px]">Componente</TableHead>
                  <TableHead className="text-[10px] uppercase font-black text-slate-500 tracking-widest border-none">Evento / Dados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLogs ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/5">
                      <TableCell colSpan={3}><Skeleton className="h-10 w-full bg-white/5" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const createdAt = log.created_at ?? log.createdAt
                    return (
                      <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.03] transition-all group">
                        <TableCell className="pl-10 py-6 font-mono text-[10px] text-slate-500 border-none">
                          <div className="flex flex-col">
                            <span className="text-slate-400 font-bold">
                              {createdAt ? new Date(createdAt).toLocaleTimeString('pt-BR') : '-'}
                            </span>
                            <span className="opacity-50">
                              {createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="border-none">
                          <Badge variant="outline" className={cn(
                            'text-[9px] font-black px-3 py-1 border-none rounded-full uppercase tracking-tighter shadow-sm whitespace-nowrap',
                            getBadgeStyle(log.scope ?? log.nivel ?? '')
                          )}>
                            {log.scope ?? log.nivel ?? 'info'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-6 border-none pr-10">
                          <div className="flex flex-col gap-3">
                            <span className={cn(
                              'text-sm font-bold leading-snug group-hover:text-white transition-colors',
                              (log.scope ?? '').toLowerCase().includes('error') ? 'text-red-400' : 'text-slate-200'
                            )}>
                              {log.message ?? '-'}
                            </span>
                            {log.payload && Object.keys(log.payload).length > 0 && (
                              <pre className="text-[10px] text-slate-400 bg-black/40 p-4 rounded-2xl max-w-4xl overflow-x-auto font-mono leading-relaxed border border-white/5">
                                {JSON.stringify(log.payload, null, 2)}
                              </pre>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-32 text-center border-none">
                      <div className="flex flex-col items-center gap-3 opacity-20">
                        <Terminal className="h-12 w-12" />
                        <p className="text-sm font-black uppercase tracking-widest text-white">Nenhum dado capturado</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="bg-black/40 px-10 py-4 border-t border-white/5 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Auditoria automática ativa e criptografada
        </div>
      </Card>
    </div>
  )
}
