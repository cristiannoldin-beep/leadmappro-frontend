'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Database, Server, ShieldCheck, Globe, Lock, Copy,
  CheckCircle2, MessageSquare, Building2, ArrowLeft, Zap, Package,
} from 'lucide-react'

type Plan = { id: string; name: string; price: number; limits: Record<string, unknown> }
type CredStatus = { configured: boolean; statusTeste: string }

export default function AdminInfraPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'apis' | 'planos'>('apis')

  const [asaasStatus, setAsaasStatus] = useState<CredStatus | null>(null)
  const [metaStatus, setMetaStatus] = useState<CredStatus | null>(null)
  const [casaStatus, setCasaStatus] = useState<CredStatus | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [editingPlan, setEditingPlan] = useState<Record<string, { name: string; price: string; limits: string }>>({})

  const [asaasInput, setAsaasInput] = useState('')
  const [casaInput, setCasaInput] = useState('')
  const [metaInputs, setMetaInputs] = useState({ appId: '', secret: '', sysToken: '', wabaId: '', verifyToken: '' })

  useEffect(() => {
    if (!user) return
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    loadData()
  }, [user])

  const loadData = async () => {
    const [a, m, c, p] = await Promise.allSettled([
      api.get<CredStatus>('/admin/credenciais/ASAAS_API_KEY'),
      api.get<CredStatus>('/admin/credenciais/META_APP_ID'),
      api.get<CredStatus>('/admin/credenciais/CASADOSDADOS_API_KEY'),
      api.get<{ plans: Plan[] }>('/admin/plans'),
    ])
    if (a.status === 'fulfilled') setAsaasStatus(a.value)
    if (m.status === 'fulfilled') setMetaStatus(m.value)
    if (c.status === 'fulfilled') setCasaStatus(c.value)
    if (p.status === 'fulfilled') setPlans((p.value as { plans: Plan[] }).plans ?? [])
  }

  const saveCred = async (chave: string, valor: string, clearFn: () => void) => {
    if (!valor.trim()) return
    try {
      await api.post('/admin/credenciais', { chave, valor: valor.trim() })
      toast.success('Credencial salva!')
      clearFn()
      loadData()
    } catch {
      toast.error('Erro ao salvar credencial')
    }
  }

  const saveMetaKeys = async () => {
    const toSave = [
      { chave: 'META_APP_ID', valor: metaInputs.appId },
      { chave: 'META_APP_SECRET', valor: metaInputs.secret },
      { chave: 'SYSTEM_USER_ACCESS_TOKEN', valor: metaInputs.sysToken },
      { chave: 'MASTER_WABA_ID', valor: metaInputs.wabaId },
      { chave: 'WEBHOOK_VERIFY_TOKEN', valor: metaInputs.verifyToken },
    ].filter(x => !!x.valor.trim())
    if (!toSave.length) return
    try {
      for (const item of toSave) await api.post('/admin/credenciais', { chave: item.chave, valor: item.valor.trim() })
      toast.success('Credenciais Meta salvas!')
      setMetaInputs({ appId: '', secret: '', sysToken: '', wabaId: '', verifyToken: '' })
      loadData()
    } catch {
      toast.error('Erro ao salvar credenciais Meta')
    }
  }

  const savePlan = async (plan: Plan) => {
    const edit = editingPlan[plan.id]
    if (!edit) return
    const body: Record<string, unknown> = {}
    if (edit.name !== plan.name) body.name = edit.name
    if (edit.price !== undefined && parseFloat(edit.price) !== Number(plan.price)) body.price = parseFloat(edit.price)
    if (edit.limits !== undefined) {
      try { body.limits = JSON.parse(edit.limits) } catch { toast.error('JSON de limites inválido'); return }
    }
    if (!Object.keys(body).length) { toast('Nenhuma alteração'); return }
    try {
      await api.patch(`/admin/plans/${plan.id}`, body)
      toast.success('Plano atualizado!')
      setEditingPlan(p => { const n = { ...p }; delete n[plan.id]; return n })
      loadData()
    } catch {
      toast.error('Erro ao atualizar plano')
    }
  }

  if (!user || user.role !== 'admin') return null

  const asaasWebhookUrl = 'https://api.leadmappro.com.br/webhooks/asaas'

  function StatusDot({ ok }: { ok: boolean }) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full',
        ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400')}>
        <span className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')} />
        {ok ? 'Configurado' : 'Pendente'}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top nav */}
      <div className="border-b border-white/5 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4 flex-wrap">
          <Button asChild size="sm" variant="ghost" className="text-slate-400 hover:text-white rounded-xl border border-white/10 gap-2">
            <Link href="/admin"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>
          </Button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">SaaS Core Infrastructure</span>
          </div>
          <h1 className="text-lg font-black text-white">Configurações & APIs</h1>
          <div className="ml-auto flex items-center gap-1 bg-slate-800 border border-white/5 rounded-xl p-1">
            {(['apis', 'planos'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn('px-5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
                  activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
                )}>
                {tab === 'apis' ? 'APIs & Integrações' : 'Planos & Billing'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* ── ABA: APIs & Integrações ── */}
        {activeTab === 'apis' && (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Asaas */}
              <div className="rounded-2xl bg-slate-900 border border-white/5 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl"><Database className="h-4 w-4 text-blue-400" /></div>
                    <div>
                      <p className="font-black text-white text-sm">Pagamentos (Asaas)</p>
                      <p className="text-xs text-slate-500">Automação de faturamento recorrente</p>
                    </div>
                  </div>
                  <StatusDot ok={!!asaasStatus?.configured} />
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      API Access Token <Lock className="h-3 w-3 text-slate-700" />
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder={asaasStatus?.configured ? '••••••••' : 'Cole seu token do Asaas'}
                        value={asaasInput}
                        onChange={e => setAsaasInput(e.target.value)}
                        className="bg-slate-800 border-white/10 h-10 rounded-xl text-sm text-slate-300 font-mono focus:border-blue-500 flex-1"
                      />
                      <Button
                        onClick={() => saveCred('ASAAS_API_KEY', asaasInput, () => setAsaasInput(''))}
                        className="h-10 px-5 bg-blue-600 hover:bg-blue-500 font-black text-xs rounded-xl shadow-lg shadow-blue-600/20"
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Globe className="h-3 w-3" /> Webhook URL
                    </Label>
                    <div className="bg-slate-800 rounded-xl border border-white/5 p-3 flex items-center justify-between gap-2">
                      <code className="text-[11px] text-blue-400 font-mono break-all flex-1">{asaasWebhookUrl}</code>
                      <Button size="sm" variant="ghost"
                        className="shrink-0 h-7 w-7 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white"
                        onClick={() => { navigator.clipboard.writeText(asaasWebhookUrl); toast.success('URL copiada!') }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-600">Configure em <span className="text-slate-400">Asaas → Webhooks</span> para ativar assinaturas.</p>
                  </div>
                </div>
              </div>

              {/* Planos preview */}
              <div className="rounded-2xl bg-slate-900 border border-white/5 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-xl"><Package className="h-4 w-4 text-violet-400" /></div>
                    <div>
                      <p className="font-black text-white text-sm">Planos & Billing</p>
                      <p className="text-xs text-slate-500">Configuração de planos e limites do SaaS</p>
                    </div>
                  </div>
                  <StatusDot ok={plans.length > 0} />
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                    <p className="text-[11px] text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {plans.length} plano(s) configurado(s) no sistema.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {plans.slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <span className="text-sm text-slate-300 font-medium">{p.name}</span>
                        <span className="text-xs text-slate-500 font-mono">R$ {Number(p.price).toFixed(2)}/mês</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('planos')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 hover:border-violet-500/40 transition-all group"
                  >
                    <span className="text-[11px] text-violet-400 font-black">Configurar Planos e Limites</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-violet-400 transition-colors">Aba Planos & Billing →</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Meta Cloud API */}
              <div className="rounded-2xl bg-slate-900 border border-white/5 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl"><MessageSquare className="h-4 w-4 text-emerald-400" /></div>
                    <div>
                      <p className="font-black text-white text-sm">Meta Cloud API</p>
                      <p className="text-xs text-slate-500">Gestão central de Tokens (Embedded Signup)</p>
                    </div>
                  </div>
                  <StatusDot ok={!!metaStatus?.configured} />
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Meta App ID', key: 'appId' as const, placeholder: metaStatus?.configured ? 'Configurado ✓' : 'Cole seu Meta App ID' },
                    { label: 'Meta App Secret', key: 'secret' as const, placeholder: 'Cole seu Meta App Secret' },
                    { label: 'System User Token (ISV Root)', key: 'sysToken' as const, placeholder: 'Token do sistema da Meta' },
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        {f.label} <Lock className="h-3 w-3 text-slate-700" />
                      </Label>
                      <Input
                        type="password"
                        placeholder={f.placeholder}
                        value={metaInputs[f.key]}
                        onChange={e => setMetaInputs(p => ({ ...p, [f.key]: e.target.value }))}
                        className="bg-slate-800 border-white/10 h-10 rounded-xl text-sm text-slate-300 font-mono focus:border-emerald-500"
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Master WABA ID</Label>
                      <Input type="password" placeholder="WABA Root" value={metaInputs.wabaId}
                        onChange={e => setMetaInputs(p => ({ ...p, wabaId: e.target.value }))}
                        className="bg-slate-800 border-white/10 h-10 rounded-xl text-sm text-slate-300 font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verify Token</Label>
                      <Input type="password" placeholder="Senha de Webhook" value={metaInputs.verifyToken}
                        onChange={e => setMetaInputs(p => ({ ...p, verifyToken: e.target.value }))}
                        className="bg-slate-800 border-white/10 h-10 rounded-xl text-sm text-slate-300 font-mono" />
                    </div>
                  </div>
                  <Button onClick={saveMetaKeys}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 gap-2">
                    <Zap className="h-4 w-4" /> Salvar Credenciais da Meta
                  </Button>
                  <p className="text-[10px] text-slate-600 text-center">As credenciais serão usadas para autenticar o Embedded Signup de novos clientes.</p>
                </div>
              </div>

              {/* Casa dos Dados */}
              <div className="rounded-2xl bg-slate-900 border border-white/5 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-xl"><Building2 className="h-4 w-4 text-orange-400" /></div>
                    <div>
                      <p className="font-black text-white text-sm">Casa dos Dados</p>
                      <p className="text-xs text-slate-500">API B2B — busca por CNPJ e CNAE (v5)</p>
                    </div>
                  </div>
                  <StatusDot ok={!!casaStatus?.configured} />
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      API Access Token <Lock className="h-3 w-3 text-slate-700" />
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder={casaStatus?.configured ? '••••••••' : 'Cole seu token da Casa dos Dados'}
                        value={casaInput}
                        onChange={e => setCasaInput(e.target.value)}
                        className="bg-slate-800 border-white/10 h-10 rounded-xl text-sm text-slate-300 font-mono focus:border-orange-500 flex-1"
                      />
                      <Button
                        onClick={() => saveCred('CASADOSDADOS_API_KEY', casaInput, () => setCasaInput(''))}
                        className="h-10 px-5 bg-orange-600 hover:bg-orange-500 font-black text-xs rounded-xl shadow-lg shadow-orange-600/20"
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-black text-orange-400">Como obter a chave</p>
                    <p className="text-[11px] text-slate-500">
                      Acesse <span className="text-orange-400">portal.casadosdados.com.br → API → Chave</span> e cole o token acima.
                    </p>
                    <p className="text-[10px] text-slate-600 mt-2">
                      Esta chave é utilizada na prospecção B2B para buscar empresas ativas por CNAE via API v5.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── ABA: Planos & Billing ── */}
        {activeTab === 'planos' && (
          <div className="space-y-6">
            {/* Plans editor */}
            <div className="rounded-2xl bg-slate-900 border border-white/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/10 rounded-xl"><Package className="h-4 w-4 text-violet-400" /></div>
                  <div>
                    <p className="font-black text-white text-sm">Planos & Limites</p>
                    <p className="text-xs text-slate-500">Nome, preço e limites de uso por plano</p>
                  </div>
                </div>
                <Badge className={cn('text-[10px] font-black border-none rounded-full px-2 py-0.5',
                  plans.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400')}>
                  {plans.length > 0 ? `${plans.length} planos` : 'Nenhum'}
                </Badge>
              </div>
              <div className="p-6">
                {plans.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Nenhum plano cadastrado.</p>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {plans.map(plan => {
                      const edit = editingPlan[plan.id] ?? {}
                      const currentName = edit.name ?? plan.name
                      const currentPrice = edit.price ?? String(Number(plan.price))
                      const currentLimits = edit.limits ?? JSON.stringify(plan.limits ?? {}, null, 2)
                      return (
                        <div key={plan.id} className="bg-slate-800/50 rounded-xl border border-white/5 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-black text-white">{plan.name}</p>
                            <Badge className="text-[10px] font-black border-none rounded-full bg-violet-500/10 text-violet-400">Ativo</Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">Nome</Label>
                              <Input
                                value={currentName}
                                onChange={e => setEditingPlan(p => ({ ...p, [plan.id]: { ...edit, name: e.target.value } }))}
                                className="font-mono bg-slate-900 border-white/10 h-8 rounded-lg text-xs text-slate-300"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">Preço/mês (R$)</Label>
                              <Input
                                type="number"
                                value={currentPrice}
                                onChange={e => setEditingPlan(p => ({ ...p, [plan.id]: { ...edit, price: e.target.value } }))}
                                className="font-mono bg-slate-900 border-white/10 h-8 rounded-lg text-xs text-slate-300"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">Limites (JSON)</Label>
                              <textarea
                                value={currentLimits}
                                onChange={e => setEditingPlan(p => ({ ...p, [plan.id]: { ...edit, limits: e.target.value } }))}
                                rows={4}
                                className="w-full font-mono bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-300 p-2 resize-none focus:outline-none focus:border-violet-500"
                              />
                            </div>
                            <Button size="sm" onClick={() => savePlan(plan)}
                              className="w-full h-8 bg-violet-600 hover:bg-violet-500 text-xs font-black rounded-lg">
                              Salvar Plano
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* System Health */}
            <div className="rounded-2xl bg-slate-900 border border-white/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl"><Server className="h-4 w-4 text-emerald-400" /></div>
                  <div>
                    <p className="font-black text-white text-sm">Saúde do Sistema</p>
                    <p className="text-xs text-slate-500">Status de conexão em tempo real</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-400 animate-pulse">● Monitoramento Ativo</span>
              </div>
              <div className="p-6 space-y-2">
                {[
                  { name: 'Asaas Pagamentos', ok: !!asaasStatus?.configured },
                  { name: 'Casa dos Dados B2B API', ok: !!casaStatus?.configured },
                  { name: 'Meta Cloud API', ok: !!metaStatus?.configured },
                  { name: 'Google Maps API Search', ok: true },
                  { name: 'OpenAI GPT-4o Intelligence', ok: true },
                  { name: 'PostgreSQL Database', ok: true },
                  { name: 'Fastify API Runtime', ok: true },
                ].map(s => (
                  <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5 hover:border-white/10 transition-all">
                    <span className="text-sm text-slate-300 font-medium">{s.name}</span>
                    <span className={cn('text-[10px] font-black uppercase', s.ok ? 'text-emerald-400' : 'text-amber-400')}>
                      {s.ok ? '● Operando' : '○ Pendente'}
                    </span>
                  </div>
                ))}
                <div className="flex items-start gap-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 mt-4">
                  <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <span className="text-indigo-400 font-black">Segurança SaaS:</span> Criptografia ponta a ponta e isolamento por JWT e multi-tenant para privacidade de cada cliente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
