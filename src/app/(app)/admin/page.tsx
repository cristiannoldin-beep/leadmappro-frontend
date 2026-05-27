'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Users,
  MoreVertical,
  Activity,
  RefreshCw,
  UserPlus,
  BarChart3,
  Calendar,
  Search,
  Trash2,
  Settings,
  TrendingUp,
  DollarSign,
  Bot,
  Globe,
  List,
  Loader2,
} from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
}

interface Owner {
  email: string
  celular?: string | null
  nomeCompleto?: string | null
}

interface AdminLista {
  id: string
  nome: string
  origem: string
  segmento?: string | null
  cidade?: string | null
  estado?: string | null
  dataCriacao: string
  totalContatos: number
}

interface Account {
  id: string
  name: string
  slug: string
  status: string
  planId?: string | null
  plan?: Plan | null
  trialEndsAt?: string | null
  createdAt: string
  owner?: Owner | null
  leadsCount: number
  listasCount: number
  campanhasCount: number
}

interface Stats {
  total: number
  active: number
  openaiCost: number
  mapsCost: number
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: '✓ Ativo', className: 'bg-emerald-500/20 text-emerald-400' },
  trialing: { label: '⏱ Trial', className: 'bg-blue-500/20 text-blue-400' },
  trial: { label: '⏱ Trial', className: 'bg-blue-500/20 text-blue-400' },
  past_due: { label: '⚠ Atrasado', className: 'bg-amber-500/20 text-amber-400' },
  suspended: { label: '✕ Suspenso', className: 'bg-red-500/20 text-red-400' },
}

function fmt(val?: number | null) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [activeTab, setActiveTab] = useState<'clientes' | 'planos'>('clientes')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [accountListas, setAccountListas] = useState<AdminLista[]>([])
  const [loadingListas, setLoadingListas] = useState(false)
  const [novoClienteOpen, setNovoClienteOpen] = useState(false)

  useEffect(() => {
    if (!loading && user?.role !== 'admin') router.push('/dashboard')
  }, [user, loading, router])

  const fetchData = useCallback(async () => {
    if (user?.role !== 'admin') return
    setLoadingAccounts(true)
    try {
      const [accData, plansData, statsData] = await Promise.all([
        api.get<{ accounts: Account[] }>('/admin/accounts'),
        api.get<{ plans: Plan[] }>('/admin/plans').catch(() => ({ plans: [] })),
        api.get<Stats>('/admin/stats').catch(() => ({ total: 0, active: 0, openaiCost: 0, mapsCost: 0 })),
      ])
      setAccounts(accData.accounts ?? [])
      setPlans(plansData.plans ?? [])
      setStats(statsData)
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoadingAccounts(false)
    }
  }, [user?.role])

  useEffect(() => { fetchData() }, [fetchData])

  const updateStatus = async (accountId: string, status: string) => {
    try {
      await api.patch(`/admin/accounts/${accountId}`, { status })
      setAccounts((prev) => prev.map((a) => a.id === accountId ? { ...a, status } : a))
      if (selectedAccount?.id === accountId) setSelectedAccount((prev) => prev ? { ...prev, status } : prev)
      toast.success('Status atualizado!')
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const updatePlan = async (accountId: string, planId: string) => {
    try {
      const plan = plans.find((p) => p.id === planId)
      await api.patch(`/admin/accounts/${accountId}`, { planId })
      setAccounts((prev) => prev.map((a) => a.id === accountId ? { ...a, planId, plan: plan ?? null } : a))
      toast.success('Plano atualizado!')
    } catch {
      toast.error('Erro ao atualizar plano')
    }
  }

  const deleteAccount = async () => {
    if (!deletingId) return
    try {
      await api.delete(`/admin/accounts/${deletingId}`)
      setAccounts((prev) => prev.filter((a) => a.id !== deletingId))
      setDeletingId(null)
      toast.success('Conta removida.')
    } catch {
      toast.error('Erro ao remover conta')
    }
  }

  const openAccountSheet = useCallback(async (acc: Account) => {
    setSelectedAccount(acc)
    setAccountListas([])
    setLoadingListas(true)
    try {
      const data = await api.get<{ listas: AdminLista[] }>(`/admin/accounts/${acc.id}/listas`)
      setAccountListas(data.listas ?? [])
    } catch {
      setAccountListas([])
    } finally {
      setLoadingListas(false)
    }
  }, [])

  const filteredAccounts = accounts.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.owner?.email?.toLowerCase().includes(search.toLowerCase())
  )

  const statCards = [
    { label: 'Clientes', value: stats?.total ?? accounts.length, icon: Users, light: 'bg-blue-500/10 text-blue-400', gradient: 'from-blue-500 to-blue-600' },
    { label: 'Ativos', value: stats?.active ?? accounts.filter((a) => a.status === 'active').length, icon: TrendingUp, light: 'bg-emerald-500/10 text-emerald-400', gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Gasto OpenAI', value: fmt(stats?.openaiCost), icon: Activity, light: 'bg-purple-500/10 text-purple-400', gradient: 'from-purple-500 to-purple-600' },
    { label: 'Gasto Maps', value: fmt(stats?.mapsCost), icon: BarChart3, light: 'bg-amber-500/10 text-amber-400', gradient: 'from-amber-500 to-amber-600' },
  ]

  if (loading || user?.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">SaaS Control</span>
            <span className="text-slate-700">|</span>
            <h1 className="text-lg font-black text-white">Painel Administrativo</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="text-slate-400 hover:text-white border border-white/10 hover:border-white/20 gap-2 rounded-xl">
              <Link href="/admin/logs"><Settings className="h-3.5 w-3.5" /> APIs & Infra</Link>
            </Button>
            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl" onClick={fetchData}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" onClick={() => setNovoClienteOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2 rounded-xl shadow-lg shadow-blue-600/25">
              <UserPlus className="h-3.5 w-3.5" /> Novo Cliente
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl bg-slate-900 border border-white/5 p-5 group hover:border-white/10 transition-all">
              <div className={cn('inline-flex p-2 rounded-xl mb-3', s.light)}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-xs text-slate-500 font-medium mb-1">{s.label}</p>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <div className={cn('absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity', s.gradient)} />
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-white/5 rounded-2xl p-1 w-fit">
          {(['clientes', 'planos'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all',
                activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
              )}>
              {tab === 'clientes' ? 'Clientes' : 'Planos & Limites'}
            </button>
          ))}
        </div>

        {/* CLIENTES TAB */}
        {activeTab === 'clientes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-400">{filteredAccounts.length} clientes cadastrados</span>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-slate-900 border-white/10 rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/5 bg-slate-900">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-800/50 border-b border-white/5">
                {['Cliente / Contato', 'Status', 'Plano', 'Atividade', ''].map((h, i) => (
                  <div key={i} className={cn('text-[10px] font-black uppercase tracking-widest text-slate-500',
                    i === 0 ? 'col-span-4' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-2' : i === 3 ? 'col-span-3' : 'col-span-1'
                  )}>{h}</div>
                ))}
              </div>

              {loadingAccounts ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-6 py-5 border-b border-white/5">
                    <Skeleton className="h-12 w-full rounded-xl bg-slate-800" />
                  </div>
                ))
              ) : filteredAccounts.map((acc, idx) => (
                <div key={acc.id} className={cn('grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-white/[0.02] transition-colors group', idx < filteredAccounts.length - 1 && 'border-b border-white/5')}>
                  {/* Client */}
                  <div className="col-span-4 flex items-center gap-3 cursor-pointer" onClick={() => openAccountSheet(acc)}>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center font-black text-white text-sm shrink-0 group-hover:border-blue-500/50 transition-colors">
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate group-hover:text-blue-400 transition-colors">{acc.name}</p>
                      {acc.owner?.email && <p className="text-xs text-slate-500 truncate">{acc.owner.email}</p>}
                      {acc.owner?.celular && <p className="text-xs text-slate-600">{acc.owner.celular}</p>}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <Select value={acc.status} onValueChange={(val) => updateStatus(acc.id, val)}>
                      <SelectTrigger className={cn('h-8 text-[10px] font-black uppercase border-none rounded-xl shadow-sm w-full', STATUS_CONFIG[acc.status]?.className ?? 'bg-slate-700 text-slate-300')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 rounded-xl">
                        <SelectItem value="active" className="text-emerald-400 font-bold text-xs">✓ Ativo</SelectItem>
                        <SelectItem value="trialing" className="text-blue-400 font-bold text-xs">⏱ Trial</SelectItem>
                        <SelectItem value="past_due" className="text-amber-400 font-bold text-xs">⚠ Atrasado</SelectItem>
                        <SelectItem value="suspended" className="text-red-400 font-bold text-xs">✕ Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Plan */}
                  <div className="col-span-2">
                    {plans.length > 0 ? (
                      <Select value={acc.planId ?? ''} onValueChange={(val) => updatePlan(acc.id, val)}>
                        <SelectTrigger className="h-8 text-[10px] font-black uppercase bg-slate-800 border-white/10 text-slate-300 rounded-xl w-full">
                          <SelectValue placeholder="Sem plano" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 rounded-xl">
                          {plans.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="text-xs font-bold text-slate-300">{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-black uppercase border-white/10 text-slate-500">
                        {acc.plan?.name ?? 'Sem plano'}
                      </Badge>
                    )}
                  </div>

                  {/* Activity */}
                  <div className="col-span-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-slate-600" />
                      <span className="text-xs text-slate-500">{new Date(acc.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-3 w-3 text-emerald-500" />
                      <span className="text-xs text-emerald-400 font-bold">{acc.leadsCount} leads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <List className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-slate-400">{acc.listasCount} listas · {acc.campanhasCount} camp.</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white/5 text-slate-600 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 rounded-xl w-44">
                        <DropdownMenuItem className="text-red-400 font-bold rounded-lg text-sm" onClick={() => setDeletingId(acc.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Deletar Conta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {!loadingAccounts && filteredAccounts.length === 0 && (
                <div className="py-16 text-center">
                  <Users className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Nenhum cliente encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PLANOS TAB */}
        {activeTab === 'planos' && (
          <div>
            {plans.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-500">Nenhum plano cadastrado. Insira planos diretamente no banco de dados.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onSave={async (updated) => {
                    try {
                      await api.patch(`/admin/plans/${plan.id}`, updated)
                      setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, ...updated } : p))
                      toast.success('Plano atualizado!')
                    } catch {
                      toast.error('Erro ao salvar plano')
                    }
                  }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-slate-900 border border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-black">Remover este cliente?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">Esta ação é irreversível. Todos os dados serão deletados permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white border-white/10 rounded-xl font-bold hover:bg-slate-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold" onClick={deleteAccount}>Confirmar Exclusão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Account detail sheet */}
      <Sheet open={!!selectedAccount} onOpenChange={(open) => !open && setSelectedAccount(null)}>
        <SheetContent className="bg-slate-950 border-l border-white/5 w-[400px] sm:max-w-[400px] p-0 flex flex-col h-full">
          <SheetHeader className="p-6 border-b border-white/5 bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center font-black text-white text-xl">
                {selectedAccount?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <SheetTitle className="text-xl font-black text-white tracking-tight">{selectedAccount?.name}</SheetTitle>
                <SheetDescription className="text-slate-500 text-xs mt-1">ID: <span className="font-mono text-slate-600">{selectedAccount?.id?.slice(0, 16)}...</span></SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="p-6 overflow-y-auto flex-1 space-y-8">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Users className="h-3 w-3" /> Contato</h4>
              <div className="space-y-3 bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-white">{selectedAccount?.owner?.email ?? 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">WhatsApp / Celular</p>
                  <p className="text-sm font-medium text-white">{selectedAccount?.owner?.celular || 'Não informado'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Activity className="h-3 w-3" /> Assinatura & Atividade</h4>
              <div className="space-y-3 bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge variant="outline" className={cn('text-[10px] uppercase font-black px-2 py-0.5', STATUS_CONFIG[selectedAccount?.status ?? '']?.className ?? 'text-slate-400')}>
                    {selectedAccount?.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500">Plano</p>
                  <span className="text-sm font-bold text-white">{selectedAccount?.plan?.name ?? 'Sem plano'}</span>
                </div>
                {selectedAccount?.trialEndsAt && (
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500">Trial até</p>
                    <span className="text-sm font-medium text-blue-400">{new Date(selectedAccount.trialEndsAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500">Cadastro</p>
                  <span className="text-sm font-medium text-white">{selectedAccount?.createdAt ? new Date(selectedAccount.createdAt).toLocaleDateString('pt-BR') : '-'}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><BarChart3 className="h-3 w-3" /> Uso</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1.5"><UserPlus className="h-3 w-3 text-emerald-500" /> Leads</p>
                  <p className="text-lg font-black text-white">{selectedAccount?.leadsCount ?? 0}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1.5"><Bot className="h-3 w-3 text-blue-500" /> Listas</p>
                  <p className="text-lg font-black text-white">{selectedAccount?.listasCount ?? 0}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5 col-span-2">
                  <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1.5"><Globe className="h-3 w-3 text-amber-500" /> Campanhas</p>
                  <p className="text-lg font-black text-white">{selectedAccount?.campanhasCount ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><List className="h-3 w-3" /> Listas</h4>
              {loadingListas ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl bg-slate-800" />)}
                </div>
              ) : accountListas.length === 0 ? (
                <p className="text-xs text-slate-600 py-4 text-center">Nenhuma lista criada.</p>
              ) : (
                <div className="space-y-2">
                  {accountListas.map((lista) => (
                    <div key={lista.id} className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-white truncate">{lista.nome}</p>
                        <span className="text-xs font-bold text-emerald-400 shrink-0">{lista.totalContatos} leads</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">{lista.origem.replace('_', ' ')}</span>
                        {lista.segmento && <span className="text-[10px] text-slate-600">· {lista.segmento}</span>}
                        {lista.cidade && <span className="text-[10px] text-slate-600">· {lista.cidade}/{lista.estado}</span>}
                      </div>
                      <p className="text-[10px] text-slate-700 mt-1">{new Date(lista.dataCriacao).toLocaleDateString('pt-BR')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Novo cliente modal */}
      <NovoClienteModal open={novoClienteOpen} onOpenChange={setNovoClienteOpen} onSuccess={fetchData} />
    </div>
  )
}

// ── Plan Card ───────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: Plan & { limits?: Record<string, unknown> }
  onSave: (updated: { name: string; price: number }) => Promise<void>
}

function PlanCard({ plan, onSave }: PlanCardProps) {
  const [name, setName] = useState(plan.name)
  const [price, setPrice] = useState(String(plan.price))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ name, price: parseFloat(price) || 0 })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-white/5">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-xl font-black bg-transparent border-none text-white p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div className="flex items-baseline gap-1 mt-3">
          <span className="text-sm text-slate-500">R$</span>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-28 h-9 text-xl font-black bg-slate-800 border-white/10 text-white rounded-lg text-center"
          />
          <span className="text-xs text-slate-500">/mês</span>
        </div>
      </div>
      <div className="p-6 border-t border-white/5 mt-auto">
        <Button onClick={handleSave} disabled={saving} className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar Configuração
        </Button>
      </div>
    </div>
  )
}

// ── Novo Cliente Modal ──────────────────────────────────────────────────────

interface NovoClienteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function NovoClienteModal({ open, onOpenChange, onSuccess }: NovoClienteModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ nomeCompleto: '', email: '', password: '', celular: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/admin/clients', form)
      toast.success('Cliente criado com sucesso!')
      setForm({ nomeCompleto: '', email: '', password: '', celular: '' })
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Erro ao criar cliente'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border border-white/10 rounded-2xl sm:max-w-md text-white">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <UserPlus className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">SaaS Onboarding</span>
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight text-white">Cadastrar Novo Cliente</DialogTitle>
          <DialogDescription className="text-slate-400">Crie uma nova conta e usuário para seu cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label className="text-xs font-bold uppercase text-slate-500">Nome / Empresa</Label>
            <Input value={form.nomeCompleto} onChange={(e) => setForm((f) => ({ ...f, nomeCompleto: e.target.value }))} placeholder="Ex: Acme Corp" required className="mt-1.5 h-12 rounded-xl bg-slate-800 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase text-slate-500">E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="cliente@email.com" required className="mt-1.5 h-12 rounded-xl bg-slate-800 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase text-slate-500">WhatsApp / Celular</Label>
            <Input type="tel" value={form.celular} onChange={(e) => setForm((f) => ({ ...f, celular: e.target.value }))} placeholder="(11) 99999-9999" className="mt-1.5 h-12 rounded-xl bg-slate-800 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase text-slate-500">Senha Provisória</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" required minLength={6} className="mt-1.5 h-12 rounded-xl bg-slate-800 border-white/10 text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting} className="text-slate-400 hover:text-white font-bold">Cancelar</Button>
            <Button type="submit" disabled={submitting} className="h-12 px-8 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : 'Finalizar Cadastro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
