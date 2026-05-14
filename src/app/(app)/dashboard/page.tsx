'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-lg">LeadMap Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <button
            onClick={signOut}
            className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="px-6 py-12 max-w-5xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Olá, {user?.nomeCompleto ?? user?.email}</h1>
          <p className="text-muted-foreground">Bem-vindo ao LeadMap Pro. O painel está em construção.</p>
        </div>
      </main>
    </div>
  )
}
