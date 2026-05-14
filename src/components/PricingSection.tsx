'use client'

import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    name: 'Finder',
    code: 'finder_monthly',
    monthlyPrice: 97,
    description: 'Ideal para quem está começando a prospectar.',
    color: 'border-blue-500',
    features: ['Geração de listas (100 leads/dia)', 'Validação de WhatsApp', 'Exportação para CSV/Excel', 'Suporte via Email'],
    buttonText: 'Começar agora',
  },
  {
    name: 'Connect',
    code: 'connect_monthly',
    monthlyPrice: 197,
    description: 'Para quem quer automatizar o primeiro contato.',
    popular: true,
    color: 'border-purple-500',
    features: ['Tudo do Finder', 'Geração de listas (150 leads/dia)', 'Disparo automático (150/dia)', 'Variações de busca com IA', 'Suporte Prioritário'],
    buttonText: 'Assinar Connect',
  },
  {
    name: 'Pro',
    code: 'pro_monthly',
    monthlyPrice: 497,
    description: 'A solução completa para escala máxima.',
    color: 'border-amber-500',
    features: ['Tudo do Connect', 'Geração de listas (500 leads/dia)', 'Disparos ILIMITADOS', 'CRM Kanban Completo', 'Respostas Automáticas com IA', 'API Oficial (Em breve)'],
    buttonText: 'Seja Pro',
  },
]

interface PricingSectionProps {
  isAnnual: boolean
}

export const PricingSection = ({ isAnnual }: PricingSectionProps) => {
  return (
    <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
      {PLANS.map((plan) => {
        const finalPrice = isAnnual ? plan.monthlyPrice * 0.8 : plan.monthlyPrice
        const formatted = finalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        return (
          <Card
            key={plan.name}
            className={cn(
              'relative flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-t-4',
              plan.color,
              plan.popular ? 'scale-105 z-10 shadow-xl' : 'opacity-90',
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                <Sparkles className="h-3 w-3" /> Mais Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">{formatted}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              {isAnnual && (
                <Badge className="bg-green-500/10 text-green-600 border-none">Economia de 20% no plano anual</Badge>
              )}
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className={cn('w-full font-bold h-12 transition-all shadow-md', plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white')}>
                <Link href={`/login?plan=${plan.code}`}>{plan.buttonText}</Link>
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
