'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Target,
  TrendingUp,
  ListChecks,
  Plus,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  MessageCircle,
  Send,
} from 'lucide-react'

interface DashboardStats {
  listas: number
  campanhas: number
  oportunidades: number
  contatos: number
  whatsappValidos: number
  mensagensEnviadas: number
  conexoesAtivas: number
}

interface Campanha {
  id: string
  nome: string
  ativo: boolean
  lista?: { nome: string }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [campanhasRecentes, setCampanhasRecentes] = useState<Campanha[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingCampanhas, setLoadingCampanhas] = useState(true)

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats')
      .then(setStats)
      .catch(() => setStats({ listas: 0, campanhas: 0, oportunidades: 0, contatos: 0, whatsappValidos: 0, mensagensEnviadas: 0, conexoesAtivas: 0 }))
      .finally(() => setLoadingStats(false))
  }, [])

  useEffect(() => {
    api.get<{ campanhas: Campanha[] }>('/campanhas')
      .then((data) => setCampanhasRecentes((data.campanhas ?? []).filter((c) => c.ativo).slice(0, 5)))
      .catch(() => setCampanhasRecentes([]))
      .finally(() => setLoadingCampanhas(false))
  }, [])

  const statsCards = [
    {
      title: 'Total de Contatos',
      value: stats?.contatos ?? 0,
      icon: Users,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-400',
      href: '/listas',
    },
    {
      title: 'WhatsApp Válidos',
      value: stats?.whatsappValidos ?? 0,
      icon: MessageCircle,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-400',
      href: '/listas',
    },
    {
      title: 'Mensagens Enviadas',
      value: stats?.mensagensEnviadas ?? 0,
      icon: Send,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      href: '/campanhas',
    },
    {
      title: 'Campanhas Ativas',
      value: stats?.campanhas ?? 0,
      icon: Target,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      href: '/campanhas',
    },
  ]

  const quickActions = [
    {
      title: 'Criar Nova Lista',
      description: 'Busque empresas ou importe planilhas',
      icon: Plus,
      href: '/listas/criar',
      color: 'bg-emerald-500/10 text-emerald-400',
    },
    {
      title: 'Nova Campanha',
      description: 'Inicie uma campanha de prospecção',
      icon: Sparkles,
      href: '/campanhas',
      color: 'bg-purple-500/10 text-purple-400',
    },
    {
      title: 'Ver CRM Kanban',
      description: 'Acompanhe suas oportunidades',
      icon: TrendingUp,
      href: '/crm',
      color: 'bg-blue-500/10 text-blue-400',
    },
  ]

  return (
    <div className="container mx-auto p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Dashboard Principal</span>
          </div>
          <h1 className="text-4xl font-bold tracking-normal leading-tight">
            Olá, {user?.nomeCompleto?.split(' ')[0] ?? user?.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground font-medium">Sua central de prospecção inteligente.</p>
        </div>
        <Badge variant="outline" className="h-8 px-4 bg-white/[0.04] border border-white/[0.08] font-bold text-muted-foreground rounded-full w-fit">
          LeadMap Pro
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="cursor-pointer border border-white/[0.06] bg-card hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200 rounded-xl overflow-hidden group">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-lg transition-transform group-hover:scale-110 ${stat.iconBg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-white/30 transition-colors" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</span>
                <div className="mt-1">
                  {loadingStats ? (
                    <Skeleton className="h-10 w-20 bg-white/5" />
                  ) : (
                    <p className="text-4xl font-bold tracking-normal leading-none mt-1">{stat.value}</p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Atalhos de Trabalho</h2>
          <Card className="border border-white/[0.06] bg-card rounded-xl p-2">
            <CardContent className="space-y-1 pt-2">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="group relative overflow-hidden rounded-lg p-4 transition-all hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${action.color}`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm group-hover:text-emerald-400 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-emerald-400 transition-all group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Campaigns */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Status de Campanhas</h2>
          <Card className="border border-white/[0.06] bg-card rounded-xl p-2 overflow-hidden">
            <CardContent className="space-y-1 pt-2">
              {loadingCampanhas ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
                  ))}
                </div>
              ) : campanhasRecentes.length > 0 ? (
                campanhasRecentes.map((campanha) => (
                  <div
                    key={campanha.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-transparent hover:border-white/[0.06] hover:bg-white/[0.03] transition-all group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Target className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm group-hover:text-emerald-400 transition-colors truncate">
                        {campanha.nome}
                      </p>
                      {campanha.lista?.nome && (
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                          {campanha.lista.nome}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[9px] uppercase px-2.5 py-1 hover:bg-emerald-500/20">
                      Ativa
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-14 space-y-3">
                  <div className="inline-flex p-4 rounded-full bg-white/[0.04] text-white/20">
                    <Target className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Nenhuma campanha em execução</p>
                    <p className="text-xs text-muted-foreground">Inicie uma nova campanha para ver o progresso aqui.</p>
                  </div>
                  <Link href="/campanhas">
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] font-semibold px-6 rounded-lg"
                    >
                      Criar Agora
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
