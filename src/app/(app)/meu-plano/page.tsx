'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PricingSection } from '@/components/PricingSection'
import {
  ShieldCheck,
  CreditCard,
  Clock,
  Zap,
  Check,
  Star,
  Rocket,
  Crown,
  ArrowRight,
} from 'lucide-react'

interface Plano {
  id?: string
  plan_type?: string
  subscription_status?: string
  next_billing_at?: string
  nome?: string
  status?: string
}

function getPlanIcon(type?: string) {
  const t = type?.toLowerCase() ?? ''
  if (t.includes('finder')) return <Star className="h-6 w-6 text-blue-500" />
  if (t.includes('connect')) return <Rocket className="h-6 w-6 text-purple-500" />
  if (t.includes('pro')) return <Crown className="h-6 w-6 text-amber-500" />
  return <ShieldCheck className="h-6 w-6 text-primary" />
}

function getPlanDisplayName(type?: string) {
  const t = type?.toLowerCase() ?? ''
  if (t.includes('finder')) return 'Finder'
  if (t.includes('connect')) return 'Connect'
  if (t.includes('pro')) return 'Pro'
  return type ?? 'Finder'
}

export default function MeuPlanoPage() {
  const [plano, setPlano] = useState<Plano | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Plano | { plano: Plano }>('/billing/plano')
      .then((data) => {
        const p = (data as any).plano ?? (data as Plano)
        setPlano(p)
      })
      .catch(() => setPlano(null))
      .finally(() => setLoading(false))
  }, [])

  const isActive =
    plano?.subscription_status === 'active' || plano?.status === 'active'

  return (
    <div className="container mx-auto p-4 md:p-10 space-y-10 min-h-screen">
      <header className="space-y-2 border-b pb-6">
        <h1 className="text-4xl font-black tracking-tight">Assinatura e Plano</h1>
        <p className="text-muted-foreground font-medium italic">Gerencie sua conta e potencialize suas vendas</p>
      </header>

      {loading ? (
        <Skeleton className="h-64 w-full rounded-3xl" />
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-2 rounded-3xl border-2 border-border shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-8 pt-8 px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-card rounded-2xl shadow-lg border border-border">
                    {getPlanIcon(plano?.plan_type)}
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Plano Atual</span>
                    <CardTitle className="text-3xl font-black uppercase leading-none mt-1">
                      {getPlanDisplayName(plano?.plan_type)}
                    </CardTitle>
                  </div>
                </div>
                <Badge className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border-none shadow-lg ${
                  isActive ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white animate-pulse'
                }`}>
                  {isActive ? 'Assinatura Ativa' : 'Aguardando Pagamento'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2">Próxima Cobrança</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-card rounded-xl shadow-sm text-blue-600"><Clock className="h-4 w-4" /></div>
                      <span className="font-black text-foreground">
                        {plano?.next_billing_at
                          ? new Date(plano.next_billing_at).toLocaleDateString('pt-BR')
                          : 'Em breve'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2">Método de Pagamento</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-card rounded-xl shadow-sm text-blue-600"><CreditCard className="h-4 w-4" /></div>
                      <span className="font-black text-foreground">PIX / Cartão</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-2xl shadow-blue-600/30 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Zap className="h-32 w-32" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-black mb-2">Liberte seu Potencial</h3>
                    <p className="text-blue-100 text-xs leading-relaxed font-medium">
                      Faça upgrade e tenha acesso a disparos em massa, CRM completo e IA avançada.
                    </p>
                  </div>
                  <Button
                    onClick={() => document.getElementById('pricing-plans')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 font-black uppercase text-[10px] tracking-widest h-12 mt-6 rounded-xl shadow-xl"
                  >
                    Explorar Upgrades <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t py-4 px-8">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Sua conta está segura e protegida por criptografia.
              </p>
            </CardFooter>
          </Card>

          <Card className="rounded-3xl border-none shadow-xl bg-slate-900 text-white p-8 flex flex-col justify-between overflow-hidden relative">
            <div className="absolute -bottom-10 -right-10 opacity-5">
              <Crown className="h-48 w-48" />
            </div>
            <div className="space-y-4 relative z-10">
              <Badge className="bg-blue-500/20 text-blue-300 border-none mb-2">Dica Pro</Badge>
              <h3 className="text-2xl font-black tracking-tight">Otimize sua Conversão</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Usuários do plano PRO têm 3x mais fechamentos usando as respostas automáticas do SDR.
              </p>
            </div>
            <ul className="space-y-3 relative z-10 my-8">
              {['Disparos Ilimitados', 'CRM Kanban Ilimitado', 'IA de Auto-Resposta', 'Enriquecimento Profundo'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs font-bold">
                  <Check className="h-4 w-4 text-blue-400" /> {item}
                </li>
              ))}
            </ul>
            <Button className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-blue-900/50">
              Seja Premium Agora
            </Button>
          </Card>
        </div>
      )}

      <div id="pricing-plans" className="pt-16">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-2xl border border-border">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Upgrade de Performance</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight">Escolha sua Próxima Etapa</h2>
        </div>
        <PricingSection isAnnual={true} paymentProvider="asaas" accountId={plano?.id} />
      </div>
    </div>
  )
}
