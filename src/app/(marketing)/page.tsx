'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { HeroBackground } from '@/components/HeroBackground'
import { PricingSection } from '@/components/PricingSection'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import {
  ArrowRight, Star, Search, MessageCircle, ChevronDown,
  Check, X, Clock, Target, CheckCircle2, BarChart3, Zap,
  Bot, Brain, RefreshCw, Globe, Inbox, Sparkles, TrendingUp, ShieldCheck,
} from 'lucide-react'

const FAKE_LEADS = [
  { name: 'Clínica Dental Vida', city: 'Brusque, SC', phone: '(47) 9 8842-3310', wa: true },
  { name: 'Dr. Marcos Rodrigues', city: 'Brusque, SC', phone: '(47) 9 9183-4421', wa: true },
  { name: 'OdontoCare Center', city: 'Brusque, SC', phone: '(47) 3255-1122', wa: false },
  { name: 'Studio Sorriso Pro', city: 'Brusque, SC', phone: '(47) 9 9754-8830', wa: true },
  { name: 'Clínica Nova Era', city: 'Brusque, SC', phone: '(47) 9 8321-9900', wa: true },
]

const WA_MESSAGES = [
  { from: 'out', text: 'Olá! Tudo bem? 👋', time: '09:14' },
  { from: 'out', text: 'Me chamo Rafael. Vi sua clínica no Google Maps e tenho uma proposta que pode aumentar seus agendamentos em até 40%.', time: '09:14' },
  { from: 'in', text: 'Oi Rafael! Pode sim, me conta mais 😊', time: '09:15' },
  { from: 'out', text: 'Perfeito! Posso te ligar amanhã às 10h?', time: '09:15' },
]

const TESTIMONIALS = [
  { name: 'Felipe Andreatta', role: 'Clínica odontológica, Balneário Camboriú', avatar: 'FA', stars: 5, highlight: '47 novos contatos em 15 dias', text: 'Em 15 dias rodando o LeadMap, tive 47 novos contatos qualificados. Antes perdia horas no Google um por um. Hoje meu assistente só cuida de atender os interessados.' },
  { name: 'Mariana Souza', role: 'Representante comercial, São Paulo', avatar: 'MS', stars: 5, highlight: '3x mais respostas', text: 'Parei de comprar lista. O LeadMap gera contatos do Google Maps com WhatsApp validado — a taxa de resposta triplicou. Melhor investimento do meu negócio.' },
  { name: 'Roberto Nascimento', role: 'Agência de marketing, Florianópolis', avatar: 'RN', stars: 5, highlight: 'ROI em 3 dias', text: 'Atendo 6 clientes usando o LeadMap para prospecção. A escala que eu não conseguia antes agora é automática. O plano Pro se pagou em 3 dias.' },
]

const FAQ_ITEMS = [
  { q: 'Preciso ter experiência técnica para usar?', a: 'Não. Em menos de 5 minutos você faz sua primeira busca. A interface é simples como um Google — você só digita o segmento e a cidade. O SDR e as automações são configurados com poucos cliques.' },
  { q: 'O SDR com IA substitui um vendedor humano?', a: 'Ele substitui as tarefas repetitivas: primeira abordagem, follow-up, respostas a perguntas simples e qualificação inicial. O vendedor humano entra quando o lead já está quente e qualificado — onde realmente agrega valor.' },
  { q: 'Como o LeadMap personaliza as mensagens?', a: 'O sistema lê o site da empresa do lead usando Firecrawl e extrai informações como ramo de atividade, produtos e localização. O GPT usa esses dados para reescrever a mensagem de forma consultiva — sem parecer template.' },
  { q: 'Como o LeadMap evita banimento no WhatsApp?', a: 'Motor de disparo com delays aleatórios entre mensagens, status "digitando..." antes de cada envio, adição automática do 9º dígito e limites diários configuráveis. Testado por centenas de clientes ativos.' },
  { q: 'Os contatos são reais e atualizados?', a: 'Sim. Os dados vêm direto do Google Maps. Além disso, validamos o WhatsApp antes de qualquer envio — você não perde mensagem com número inválido.' },
  { q: 'Em quanto tempo vejo resultados?', a: 'Clientes relatam primeiras respostas em menos de 24h após a primeira campanha. Com o SDR ativo, a taxa de resposta aumenta porque as mensagens são personalizadas para cada empresa.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim. Sem fidelidade e sem taxa de cancelamento. Se decidir cancelar, é só acessar Configurações > Plano. Sem burocracia.' },
]

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [demoTab, setDemoTab] = useState(0)
  const [searchState, setSearchState] = useState<'idle' | 'searching' | 'done'>('idle')
  const [visibleLeads, setVisibleLeads] = useState(0)
  const [waMsgs, setWaMsgs] = useState(0)
  const [waTyping, setWaTyping] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      const adminEmails = ['cristiannoldin@gmail.com', 'cazagrande.neto@gmail.com']
      const isAdmin = user.email && adminEmails.some((e) => user.email.toLowerCase().trim() === e.toLowerCase().trim())
      window.location.href = `https://app.leadmappro.com.br${isAdmin ? '/admin' : '/dashboard'}`
    }
  }, [user])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (searchState !== 'done') return
    let count = 0
    const iv = setInterval(() => { count++; setVisibleLeads(count); if (count >= FAKE_LEADS.length) clearInterval(iv) }, 300)
    return () => clearInterval(iv)
  }, [searchState])

  useEffect(() => {
    if (demoTab !== 1) { setWaMsgs(0); setWaTyping(false); return }
    let idx = 0; setWaMsgs(0); let active = true
    const next = () => {
      if (!active || idx >= WA_MESSAGES.length) return
      setWaTyping(true)
      setTimeout(() => { if (!active) return; setWaTyping(false); idx++; setWaMsgs(idx); setTimeout(next, 1500) }, 900)
    }
    const t = setTimeout(next, 700)
    return () => { active = false; clearTimeout(t) }
  }, [demoTab])

  const handleSearch = () => { setSearchState('searching'); setVisibleLeads(0); setTimeout(() => setSearchState('done'), 1800) }
  const resetDemo = () => { setSearchState('idle'); setVisibleLeads(0) }

  return (
    <div className="min-h-screen font-sans overflow-x-hidden">

      {/* NAVBAR */}
      <header className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300', scrolled ? 'bg-[#09090b]/95 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent')}>
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-6xl">
          <Image src="/leadmap-logo-branco.png" alt="LeadMap" width={120} height={28} className="h-7 w-auto object-contain" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#9a9a9a]">
            <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-white transition-colors">Preços</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="https://app.leadmappro.com.br/login">
              <Button variant="ghost" className="text-[#9a9a9a] hover:text-white hover:bg-white/[0.04] text-sm hidden md:inline-flex">Entrar</Button>
            </Link>
            <Link href="https://app.leadmappro.com.br/login?tab=register">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 h-9 text-sm rounded-lg hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
                Começar grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden bg-[#09090b]">
        <HeroBackground />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent z-[2] pointer-events-none" />
        <div className="relative z-10 text-center max-w-4xl mx-auto pt-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-8">
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                +500 empresas gerando leads agora
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-white">
              Seu{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">SDR com IA</span>
              {' '}prospecta, responde e{' '}
              <span className="underline decoration-emerald-500 decoration-4 underline-offset-4">faz follow-up</span>
              {' '}por você
            </h1>
            <p className="text-lg md:text-xl text-[#9a9a9a] max-w-2xl mx-auto leading-relaxed">
              Encontra leads no Google Maps, valida o WhatsApp, dispara campanhas personalizadas com IA e acompanha cada lead até o fechamento.{' '}
              <strong className="text-white">Você só precisa aparecer para assinar o contrato.</strong>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="https://app.leadmappro.com.br/login?tab=register">
                <Button size="lg" className="h-12 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base rounded-xl hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all group">
                  Começar gratuitamente
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="h-12 px-8 border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white font-semibold text-base rounded-xl">
                  Ver como funciona
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-10 pt-2 pb-20">
              {[{ value: '12.000+', label: 'Leads gerados' }, { value: '94%', label: 'Taxa de entrega' }, { value: '3x', label: 'Mais reuniões' }, { value: '< 5min', label: 'Para começar' }].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-[#9a9a9a] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PAIN */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-red-500">O problema real</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
              Prospecção manual está <span className="text-red-500">destruindo sua produtividade</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">Enquanto você pesquisa um por um, sua concorrência já usa automação.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Clock, color: 'text-red-500', bg: 'bg-red-50 border-red-100', title: 'Horas perdidas toda semana', desc: 'Pesquisar no Google, copiar telefone, enviar mensagens manualmente para centenas de contatos. Impossível de escalar.' },
              { icon: X, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100', title: '30-50% dos números são inválidos', desc: 'Listas compradas cheias de contatos sem WhatsApp ativo. Você paga, perde tempo e ainda arrisca ban da conta.' },
              { icon: Target, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100', title: 'Leads sem acompanhamento', desc: 'Sem CRM, potenciais clientes somem. Cada lead não acompanhado é dinheiro que você deixou na mesa.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-7 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-gray-200 transition-all">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border mb-5', item.bg)}>
                  <item.icon className={cn('h-5 w-5', item.color)} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="features" className="py-24 px-6 bg-[#f8fafc]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Produto</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">Veja o LeadMap <span className="text-emerald-600">funcionando agora</span></h2>
            <p className="text-gray-500 max-w-xl mx-auto">Experimente as funcionalidades principais — sem criar conta.</p>
          </div>
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {[{ label: 'Encontrar Leads', icon: Search }, { label: 'Disparar WhatsApp', icon: MessageCircle }, { label: 'CRM Kanban', icon: BarChart3 }, { label: 'SDR com IA', icon: Bot, highlight: true }].map((tab: any, i) => (
              <button key={i} onClick={() => { setDemoTab(i); resetDemo() }}
                className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  demoTab === i
                    ? tab.highlight ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30' : 'bg-gray-900 text-white shadow-lg'
                    : tab.highlight ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                )}>
                <tab.icon className="h-4 w-4" />{tab.label}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-3"><div className="bg-gray-200 rounded px-3 py-0.5 text-[11px] text-gray-500 max-w-[200px]">app.leadmappro.com.br</div></div>
            </div>
            <AnimatePresence mode="wait">
              {demoTab === 0 && (
                <motion.div key="t0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">Criar Lista — Google Maps</h3>
                    {searchState === 'done' && <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold">{visibleLeads} leads encontrados</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mb-5">
                    <div className="flex-1 min-w-[140px]"><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Segmento</p><div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-800">Dentista</div></div>
                    <div className="flex-1 min-w-[140px]"><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Cidade / Estado</p><div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-800">Brusque, SC</div></div>
                    <div className="flex items-end">
                      <button onClick={handleSearch} disabled={searchState !== 'idle'}
                        className={cn('flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all', searchState === 'idle' ? 'bg-emerald-500 hover:bg-emerald-400 text-black' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}>
                        {searchState === 'searching' ? <><span className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Buscando...</> : <><Search className="h-4 w-4" /> Buscar Leads</>}
                      </button>
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50">
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">Empresa</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Telefone</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">WhatsApp</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {searchState === 'idle' && <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400 text-sm">Clique em "Buscar Leads" para ver o resultado</td></tr>}
                        {FAKE_LEADS.slice(0, visibleLeads).map((lead, i) => (
                          <motion.tr key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="hover:bg-gray-50">
                            <td className="px-4 py-3"><p className="font-medium text-gray-900">{lead.name}</p><p className="text-xs text-gray-400">{lead.city}</p></td>
                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{lead.phone}</td>
                            <td className="px-4 py-3">{lead.wa ? <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-100"><Check className="h-3 w-3" /> Ativo</span> : <span className="inline-flex items-center gap-1 bg-red-50 text-red-500 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-100"><X className="h-3 w-3" /> Inativo</span>}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {searchState === 'done' && visibleLeads >= FAKE_LEADS.length && <div className="mt-3 flex justify-end"><button onClick={resetDemo} className="text-xs text-gray-400 hover:text-gray-600 underline">Resetar demo</button></div>}
                </motion.div>
              )}
              {demoTab === 1 && (
                <motion.div key="t1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">Campanha — Envio Automático</h3>
                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">{waMsgs > 0 ? `${waMsgs * 12} / 150 enviados` : 'Iniciando...'}</span>
                  </div>
                  <div className="max-w-sm mx-auto rounded-xl overflow-hidden border border-gray-200 shadow">
                    <div className="bg-[#075E54] px-4 py-2.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-300 flex items-center justify-center text-xs font-black text-emerald-900">CD</div>
                      <div><p className="text-sm font-semibold text-white">Clínica Dental Vida</p><p className="text-[10px] text-emerald-200">{waTyping ? 'digitando...' : 'online'}</p></div>
                    </div>
                    <div className="p-4 space-y-2 min-h-[220px] bg-[#efeae2]">
                      <AnimatePresence>
                        {WA_MESSAGES.slice(0, waMsgs).map((msg, i) => (
                          <motion.div key={i} initial={{ opacity: 0, scale: 0.92, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={cn('flex', msg.from === 'out' ? 'justify-end' : 'justify-start')}>
                            <div className={cn('max-w-[82%] px-3 py-2 rounded-xl text-[13px] shadow-sm leading-snug', msg.from === 'out' ? 'bg-[#d9fdd3] text-gray-800 rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none')}>
                              {msg.text}<span className="text-[10px] text-gray-400 ml-2">{msg.time}</span>
                            </div>
                          </motion.div>
                        ))}
                        {waTyping && <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start"><div className="bg-white px-4 py-2.5 rounded-xl rounded-bl-none shadow-sm flex gap-1 items-center">{[0, 1, 2].map((j) => <span key={j} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />)}</div></motion.div>}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
              {demoTab === 2 && (
                <motion.div key="t2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6">
                  <h3 className="font-bold text-gray-900 mb-5">CRM Kanban — Pipeline de Vendas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Novo', col: 'bg-gray-50 border-gray-200', badge: 'bg-gray-200 text-gray-600', cards: ['Dr. Marcos Rodrigues', 'Clínica Nova Era'] },
                      { label: 'Contato Feito', col: 'bg-blue-50 border-blue-100', badge: 'bg-blue-100 text-blue-600', cards: ['Studio Sorriso Pro', 'OdontoCare'] },
                      { label: 'Proposta', col: 'bg-amber-50 border-amber-100', badge: 'bg-amber-100 text-amber-600', cards: ['Clínica Dental Vida'] },
                      { label: 'Fechado ✓', col: 'bg-emerald-50 border-emerald-100', badge: 'bg-emerald-100 text-emerald-600', cards: ['Dr. Felipe A.', 'Clínica Sul'] },
                    ].map((col, i) => (
                      <div key={i} className={cn('rounded-xl border p-3', col.col)}>
                        <div className="flex items-center justify-between mb-3"><p className="text-[10px] font-black text-gray-600 uppercase tracking-wider">{col.label}</p><span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', col.badge)}>{col.cards.length}</span></div>
                        <div className="space-y-2">{col.cards.map((card, j) => <div key={j} className="bg-white rounded-lg p-2.5 shadow-sm text-xs font-medium text-gray-700 border border-white/80">{card}</div>)}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              {demoTab === 3 && (
                <motion.div key="t3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900">SDR Autônomo — Respondendo em tempo real</h3>
                    <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> IA ativa</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow">
                      <div className="bg-[#075E54] px-4 py-2.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-300 flex items-center justify-center text-xs font-black text-emerald-900">RS</div>
                        <div><p className="text-sm font-semibold text-white">Restaurante Sabor & Arte</p><p className="text-[10px] text-emerald-200">digitando...</p></div>
                      </div>
                      <div className="p-4 space-y-2 bg-[#efeae2] min-h-[180px]">
                        {[
                          { from: 'out', text: 'Olá! Vi que vocês têm um restaurante italiano em Florianópolis. Trabalhamos com soluções de captação de clientes especialmente para o setor gastronômico. Posso te mostrar como aumentar as reservas?', time: '10:22' },
                          { from: 'in', text: 'Oi! Sim, temos um problema com mesas vazias na semana. Como funciona?', time: '10:24' },
                          { from: 'out', text: 'Perfeito! Para restaurantes como o seu geramos em média 40-60 reservas extras/mês via WhatsApp. Posso te enviar um case de sucesso de um cliente em SC?', time: '10:24' },
                        ].map((msg, i) => (
                          <div key={i} className={cn('flex', msg.from === 'out' ? 'justify-end' : 'justify-start')}>
                            <div className={cn('max-w-[85%] px-3 py-2 rounded-xl text-[12px] shadow-sm leading-snug', msg.from === 'out' ? 'bg-[#d9fdd3] text-gray-800 rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none')}>
                              {msg.text}<span className="text-[10px] text-gray-400 ml-2">{msg.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 space-y-3">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">O que o SDR fez automaticamente</p>
                        {[{ icon: Globe, text: 'Leu o site do restaurante via Firecrawl' }, { icon: Brain, text: 'Identificou: restaurante italiano, Florianópolis' }, { icon: Sparkles, text: 'Personalizou a mensagem com o contexto do negócio' }, { icon: MessageCircle, text: 'Simulou "digitando..." antes de enviar' }, { icon: CheckCircle2, text: 'Classificou o lead como: Interessado ✓' }].map((item, i) => (
                          <div key={i} className="flex items-start gap-2"><item.icon className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" /><p className="text-xs text-emerald-800">{item.text}</p></div>
                        ))}
                      </div>
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Sequência de Follow-up programada</p>
                        {[{ dia: 'Dia 1', msg: 'Reforço de valor — case de sucesso no segmento' }, { dia: 'Dia 3', msg: 'Pergunta aberta — momento oportuno?' }, { dia: 'Dia 7', msg: 'Última tentativa — breakup message' }].map((item, i) => (
                          <div key={i} className="flex items-center gap-2"><span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded shrink-0">{item.dia}</span><p className="text-xs text-blue-800">{item.msg}</p></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Como funciona</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">Do lead ao fechamento — no <span className="text-emerald-600">piloto automático</span></h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: Search, title: 'Encontra os leads', desc: 'Busca no Google Maps por segmento e cidade. Retorna centenas de empresas com WhatsApp validado e dados enriquecidos automaticamente.' },
              { step: '02', icon: Sparkles, title: 'Personaliza com IA', desc: 'O SDR lê o site de cada empresa via Firecrawl e usa GPT para criar uma mensagem personalizada. Não é template — é abordagem consultiva.' },
              { step: '03', icon: Bot, title: 'Responde e faz follow-up', desc: 'Quando o lead responde, a IA replica em segundos. Se não responder, o SDR envia a sequência de follow-up nos dias certos, automaticamente.' },
              { step: '04', icon: CheckCircle2, title: 'Você fecha no CRM', desc: 'Leads classificados como interessados chegam prontos no Kanban. Histórico completo, oportunidade criada. Você só precisa fechar.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25"><item.icon className="h-6 w-6 text-white" /></div>
                  <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{item.step}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ALL FEATURES */}
      <section className="py-24 px-6 bg-[#f8fafc]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Tudo incluso</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">Um sistema completo de <span className="text-emerald-600">prospecção B2B</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Search, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100', title: 'Prospecção Google Maps', desc: 'Varre o Maps por segmento e cidade. Retorna nome, telefone, endereço e avaliação. Exportável para CSV.' },
              { icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100', title: 'Validação de WhatsApp', desc: 'Verifica se o número tem WhatsApp ativo antes de qualquer envio. Zero desperdício de mensagem.' },
              { icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100', title: 'Enriquecimento de Dados', desc: 'Lê o site da empresa via Firecrawl e extrai atividade, segmento e descrição para personalizar a abordagem.' },
              { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100', title: 'Disparos Anti-ban', desc: 'Motor de disparo com delays aleatórios, status "digitando..." e limites diários. Testado por centenas de clientes.' },
              { icon: Bot, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100', title: 'SDR Autônomo com IA', desc: 'Responde leads automaticamente usando GPT com contexto da empresa. Nunca deixa um lead sem resposta.' },
              { icon: RefreshCw, color: 'text-teal-500', bg: 'bg-teal-50 border-teal-100', title: 'Follow-up Sequencial', desc: 'Sequência configurável de follow-ups (dia 1, 3, 7, 14). Se o lead responde, o SDR pausa automaticamente.' },
              { icon: Inbox, color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-100', title: 'Inbox de Conversas', desc: 'Todas as conversas do WhatsApp em um painel. Histórico completo, filtros por campanha e status.' },
              { icon: Brain, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-100', title: 'Classificação com IA', desc: 'Cada resposta do lead é classificada: interessado, dúvida, não interessado, spam ou robô. Automaticamente.' },
              { icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100', title: 'CRM Kanban integrado', desc: 'Pipeline de vendas visual com oportunidades criadas automaticamente. Do contato ao fechamento, sem sair da plataforma.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.08 }}
                className="p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-gray-200 transition-all">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border mb-4', item.bg)}><item.icon className={cn('h-5 w-5', item.color)} /></div>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="py-20 px-6 bg-[#09090b]">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[{ value: '12.000+', label: 'Leads gerados', sub: 'por clientes ativos' }, { value: '94%', label: 'Taxa de entrega', sub: 'mensagens no WhatsApp' }, { value: '3x', label: 'Mais reuniões', sub: 'vs. prospecção manual' }, { value: '< 5min', label: 'Para começar', sub: 'sem config técnica' }].map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <p className="text-4xl md:text-5xl font-black text-white mb-1">{m.value}</p>
                <p className="text-emerald-400 font-bold text-sm">{m.label}</p>
                <p className="text-[#9a9a9a] text-xs mt-1">{m.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Resultados reais</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">O que dizem quem já usa</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-7 rounded-2xl border border-gray-100 hover:border-emerald-100 hover:shadow-lg transition-all bg-white flex flex-col">
                <div className="flex gap-1 mb-4">{[...Array(t.stars)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-black shrink-0">{t.avatar}</div>
                  <div><p className="text-sm font-bold text-gray-900">{t.name}</p><p className="text-[11px] text-gray-500">{t.role}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50"><span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold">✓ {t.highlight}</span></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 bg-[#09090b]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Planos</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">O investimento certo para o seu tamanho</h2>
            <p className="text-[#9a9a9a]">Sem taxas de configuração. Cancele quando quiser.</p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Label className={cn('text-sm font-medium', !isAnnual ? 'text-white' : 'text-white/40')}>Mensal</Label>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} className="data-[state=checked]:bg-emerald-500" />
              <Label className={cn('text-sm font-medium flex items-center gap-2', isAnnual ? 'text-white' : 'text-white/40')}>
                Anual
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">20% OFF</span>
              </Label>
            </div>
          </div>
          <PricingSection isAnnual={isAnnual} />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-[#f8fafc]">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-14 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">FAQ</p>
            <h2 className="text-4xl font-black tracking-tight text-gray-900">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                  <span className="font-bold text-gray-900 text-sm pr-4">{item.q}</span>
                  <ChevronDown className={cn('h-5 w-5 text-gray-400 shrink-0 transition-transform duration-200', openFaq === i && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-4">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 bg-[#09090b] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(16,185,129,0.1),transparent)]" />
        <div className="container mx-auto max-w-3xl text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Comece hoje</p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">Ative seu SDR com IA <span className="text-emerald-400">hoje mesmo</span></h2>
            <p className="text-[#9a9a9a] max-w-xl mx-auto text-lg">Em menos de 5 minutos você tem leads do Google Maps sendo abordados com mensagens personalizadas por IA. Sem cartão de crédito. Sem config técnica.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="https://app.leadmappro.com.br/login?tab=register">
                <Button size="lg" className="h-14 px-10 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all">
                  Começar agora — é grátis <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-[#444] pt-2">Sem fidelidade · Cancele quando quiser · Suporte via WhatsApp</p>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#09090b] border-t border-white/[0.06] py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 pb-10 mb-8 border-b border-white/[0.06]">
            <div className="space-y-3 max-w-xs">
              <Image src="/leadmap-logo-branco.png" alt="LeadMap" width={120} height={28} className="h-7 w-auto object-contain" />
              <p className="text-[#9a9a9a] text-sm leading-relaxed">A plataforma líder em prospecção B2B via Google Maps + WhatsApp no Brasil.</p>
            </div>
            <div className="grid grid-cols-2 gap-10 text-sm text-[#9a9a9a]">
              <div className="space-y-3">
                <h4 className="font-bold uppercase text-[10px] tracking-widest text-[#555]">Produto</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
                  <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold uppercase text-[10px] tracking-widest text-[#555]">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between text-[#444] text-xs">
            <p>© {new Date().getFullYear()} LeadMapPro. Desenvolvido pela Elemento IA.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
