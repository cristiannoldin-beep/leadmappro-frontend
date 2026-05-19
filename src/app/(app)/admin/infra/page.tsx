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
  Map, Brain, Loader2, Eye, EyeOff,
} from 'lucide-react'

type Plan = { id: string; name: string; price: number; limits: Record<string, unknown> }
type CredStatus = { configured: boolean; statusTeste: string }
type TestResult = { sucesso: boolean; mensagem: string }

export default function AdminInfraPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'apis' | 'planos'>('apis')

  const [asaasStatus, setAsaasStatus] = useState<CredStatus | null>(null)
  const [metaStatus, setMetaStatus] = useState<CredStatus | null>(null)
  const [casaStatus, setCasaStatus] = useState<CredStatus | null>(null)
  const [googleStatus, setGoogleStatus] = useState<CredStatus | null>(null)
  const [openaiStatus, setOpenaiStatus] = useState<CredStatus | null>(null)
  const [uazapiStatus, setUazapiStatus] = useState<CredStatus | null>(null)
  const [uazapiUrlStatus, setUazapiUrlStatus] = useState<CredStatus | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [editingPlan, setEditingPlan] = useState<Record<string, { name: string; price: string; limits: string }>>({})

  const [asaasInput, setAsaasInput] = useState('')
  const [casaInput, setCasaInput] = useState('')
  const [metaInputs, setMetaInputs] = useState({ appId: '', secret: '', sysToken: '', wabaId: '', verifyToken: '' })
  const [uazapiInputs, setUazapiInputs] = useState({ baseUrl: '', globalKey: '' })
  const [testingUazapi, setTestingUazapi] = useState(false)
  const [googleInput, setGoogleInput] = useState('')
  const [googleShowKey, setGoogleShowKey] = useState(false)
  const [openaiInput, setOpenaiInput] = useState('')
  const [openaiShowKey, setOpenaiShowKey] = useState(false)
  const [testingGoogle, setTestingGoogle] = useState(false)
  const [testingOpenAI, setTestingOpenAI] = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.role !== 'admin') { router.push('/dashboard'); return }
    loadData()
  }, [user])

  const loadData = async () => {
    const [a, m, c, g, o, u, uu, p] = await Promise.allSettled([
      api.get<CredStatus>('/admin/credenciais/ASAAS_API_KEY'),
      api.get<CredStatus>('/admin/credenciais/META_APP_ID'),
      api.get<CredStatus>('/admin/credenciais/CASADOSDADOS_API_KEY'),
      api.get<CredStatus>('/admin/credenciais/GOOGLE_MAPS_API_KEY'),
      api.get<CredStatus>('/admin/credenciais/OPENAI_API_KEY'),
      api.get<CredStatus>('/admin/credenciais/UAZAPI_GLOBAL_KEY'),
      api.get<CredStatus>('/admin/credenciais/UAZAPI_BASE_URL'),
      api.get<{ plans: Plan[] }>('/admin/plans'),
    ])
    if (a.status === 'fulfilled') setAsaasStatus(a.value)
    if (m.status === 'fulfilled') setMetaStatus(m.value)
    if (c.status === 'fulfilled') setCasaStatus(c.value)
    if (g.status === 'fulfilled') setGoogleStatus(g.value)
    if (o.status === 'fulfilled') setOpenaiStatus(o.value)
    if (u.status === 'fulfilled') setUazapiStatus(u.value)
    if (uu.status === 'fulfilled') setUazapiUrlStatus(uu.value)
    if (p.status === 'fulfilled') setPlans((p.value as { plans: Plan[] }).plans ?? [])
  }

  const testarIntegracao = async (tipo: 'google_maps' | 'openai') => {
    const setTesting = tipo === 'google_maps' ? setTestingGoogle : setTestingOpenAI
    setTesting(true)
    try {
      const data = await api.post<TestResult>('/admin/credenciais/testar', { tipo })
      if (data.sucesso) toast.success(data.mensagem)
      else toast.error(data.mensagem)
      loadData()
    } catch {
      toast.error('Erro ao testar integração')
    } finally {
      setTesting(false)
    }
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

  const testarUazapi = async () => {
    setTestingUazapi(true)
    try {
      const data = await api.get<{ ok: boolean; erro?: string; status?: number; baseUrl?: string; endpointFuncionando?: string; resultados?: Record<string, unknown> }>('/whatsapp/testar-conexao')
      console.log('UazAPI diagnóstico:', JSON.stringify(data, null, 2))
      if (data.ok) {
        toast.success(`UazAPI OK ✓  endpoint: ${data.endpointFuncionando}`)
      } else if (data.erro) {
        toast.error(`UazAPI inacessível: ${data.erro}`)
      } else {
        const tentativas = Object.entries(data.resultados ?? {}).map(([p, r]) => `${p}: ${(r as {status?: number; erro?: string}).status ?? (r as {erro?: string}).erro}`).join(' | ')
        toast.error(`UazAPI 404 em todos os endpoints. Abra o console para detalhes.`)
        console.error('Tentativas:', tentativas)
      }
    } catch {
      toast.error('Erro ao testar conexão UazAPI')
    } finally {
      setTestingUazapi(false)
    }
  }

  const saveUazapiKeys = async () => {
    const toSave = [
      { chave: 'UAZAPI_GLOBAL_KEY', valor: uazapiInputs.globalKey },
      { chave: 'UAZAPI_BASE_URL', valor: uazapiInputs.baseUrl },
    ].filter(x => !!x.valor.trim())
    if (!toSave.length) return
    try {
      for (const item of toSave) await api.post('/admin/credenciais', { chave: item.chave, valor: item.valor.trim() })
      toast.success('Credenciais UazAPI salvas!')
      setUazapiInputs({ baseUrl: '', globalKey: '' })
      loadData()
    } catch {
      toast.error('Erro ao salvar credenciais UazAPI')
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

              {/* UazAPI */}
              <div className="rounded-2xl bg-slate-900 border border-white/5 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-xl"><MessageSquare className="h-4 w-4 text-green-400" /></div>
                    <div>
                      <p className="font-black text-white text-sm">UazAPI (WhatsApp)</p>
                      <p className="text-xs text-slate-500">URL do servidor e chave global de admin</p>
                    </div>
                  </div>
                  <StatusDot ok={!!uazapiStatus?.configured && !!uazapiUrlStatus?.configured} />
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      URL do Servidor <Globe className="h-3 w-3 text-slate-700" />
                    </Label>
                    <Input
                      type="text"
                      placeholder={uazapiUrlStatus?.configured ? 'Configurado ✓' : 'https://leadmap.uazapi.com'}
                      value={uazapiInputs.baseUrl}
                      onChange={e => setUazapiInputs(p => ({ ...p, baseUrl: e.target.value }))}
                      className="bg-slate-800 border-white/10 h-10 rounded-xl text-sm text-slate-300 font-mono focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      Global API Key (apikey) <Lock className="h-3 w-3 text-slate-700" />
                    </Label>
                    <Input
                      type="password"
                      placeholder="Chave de admin do UazAPI"
                      value={uazapiInputs.globalKey}
                      onChange={e => setUazapiInputs(p => ({ ...p, globalKey: e.target.value }))}
                      className="bg-slate-800 border-white/10 h-10 rounded-xl text-sm text-slate-300 font-mono focus:border-green-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveUazapiKeys}
                      className="flex-1 h-11 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl shadow-lg shadow-green-600/20 gap-2">
                      <Zap className="h-4 w-4" /> Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={testarUazapi}
                      disabled={testingUazapi || (!uazapiStatus?.configured && !uazapiUrlStatus?.configured)}
                      className="h-11 px-5 font-black uppercase text-[10px] tracking-widest rounded-xl border-white/10 text-slate-300 hover:bg-white/5 gap-2"
                    >
                      {testingUazapi && <Loader2 className="h-4 w-4 animate-spin" />}
                      Testar
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-600">Necessário para criação de instâncias e geração de QR Code. Configure a URL do seu servidor UazAPI e a chave global de admin.</p>
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

            {/* Row 3: Google Maps + OpenAI */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Google Maps */}
              <div className="rounded-2xl bg-slate-900 border border-white/5 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-500/10 rounded-xl"><Map className="h-4 w-4 text-sky-400" /></div>
                    <div>
                      <p className="font-black text-white text-sm">Google Maps Places API</p>
                      <p className="text-xs text-slate-500">Para busca automática de empresas</p>
                    </div>
                  </div>
                  <StatusDot ok={!!googleStatus?.configured} />
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      API Key <Lock className="h-3 w-3 text-slate-700" />
                    </Label>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={googleShowKey ? 'text' : 'password'}
                          placeholder={googleStatus?.configured ? '••••••••' : 'Insira sua API Key'}
                          value={googleInput}
                          onChange={e => setGoogleInput(e.target.value)}
                          className="bg-slate-800 border-white/10 h-10 rounded-xl text-sm text-slate-300 font-mono focus:border-sky-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setGoogleShowKey(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {googleShowKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button
                        onClick={() => saveCred('GOOGLE_MAPS_API_KEY', googleInput, () => setGoogleInput(''))}
                        className="h-10 px-4 bg-sky-600 hover:bg-sky-500 font-black text-xs rounded-xl shadow-lg shadow-sky-600/20"
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      onClick={() => testarIntegracao('google_maps')}
                      disabled={testingGoogle || !googleStatus?.configured}
                      className="h-10 px-6 font-black uppercase text-[10px] tracking-widest rounded-xl border-white/10 text-slate-300 hover:bg-white/5 gap-2"
                    >
                      {testingGoogle && <Loader2 className="h-4 w-4 animate-spin" />}
                      Testar Conexão
                    </Button>
                    {googleStatus?.statusTeste === 'sucesso' && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Testada OK
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600">Necessária para a busca por empresas via Google Places. Ativar <span className="text-slate-400">Places API</span> no Google Cloud Console.</p>
                </div>
              </div>

              {/* OpenAI */}
              <div className="rounded-2xl bg-slate-900 border border-white/5 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl"><Brain className="h-4 w-4 text-purple-400" /></div>
                    <div>
                      <p className="font-black text-white text-sm">OpenAI API (IA)</p>
                      <p className="text-xs text-slate-500">Classificação e respostas automáticas</p>
                    </div>
                  </div>
                  <StatusDot ok={!!openaiStatus?.configured} />
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      API Key <Lock className="h-3 w-3 text-slate-700" />
                    </Label>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={openaiShowKey ? 'text' : 'password'}
                          placeholder={openaiStatus?.configured ? '••••••••' : 'sk-proj-...'}
                          value={openaiInput}
                          onChange={e => setOpenaiInput(e.target.value)}
                          className="bg-slate-800 border-white/10 h-10 rounded-xl text-sm text-slate-300 font-mono focus:border-purple-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setOpenaiShowKey(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {openaiShowKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button
                        onClick={() => saveCred('OPENAI_API_KEY', openaiInput, () => setOpenaiInput(''))}
                        className="h-10 px-4 bg-purple-600 hover:bg-purple-500 font-black text-xs rounded-xl shadow-lg shadow-purple-600/20"
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      onClick={() => testarIntegracao('openai')}
                      disabled={testingOpenAI || !openaiStatus?.configured}
                      className="h-10 px-6 font-black uppercase text-[10px] tracking-widest rounded-xl border-white/10 text-slate-300 hover:bg-white/5 gap-2"
                    >
                      {testingOpenAI && <Loader2 className="h-4 w-4 animate-spin" />}
                      Testar Conexão
                    </Button>
                    {openaiStatus?.statusTeste === 'sucesso' && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Testada OK
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600">Modelo GPT-4o para classificação de leads e respostas automáticas do SDR. Use uma chave de projeto <span className="text-slate-400">sk-proj-*</span>.</p>
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
                  { name: 'UazAPI WhatsApp', ok: !!uazapiStatus?.configured && !!uazapiUrlStatus?.configured },
                  { name: 'Asaas Pagamentos', ok: !!asaasStatus?.configured },
                  { name: 'Casa dos Dados B2B API', ok: !!casaStatus?.configured },
                  { name: 'Meta Cloud API', ok: !!metaStatus?.configured },
                  { name: 'Google Maps Places API', ok: !!googleStatus?.configured },
                  { name: 'OpenAI GPT-4o Intelligence', ok: !!openaiStatus?.configured },
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
