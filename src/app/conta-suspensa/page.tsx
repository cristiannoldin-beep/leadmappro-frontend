'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { MessageCircle, LogOut, AlertTriangle } from 'lucide-react'

const SUPORTE_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '5547999821006'

export default function ContaSuspensaPage() {
  const { user, signOut } = useAuth()

  const whatsappUrl = `https://wa.me/${SUPORTE_WHATSAPP}?text=${encodeURIComponent(
    `Olá! Preciso renovar minha assinatura do LeadMap Pro.\n\nEmail: ${user?.email ?? ''}`
  )}`

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">

        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Acesso suspenso</h1>
          <p className="text-muted-foreground">
            Seu período de trial encerrou ou sua assinatura está suspensa.
            Para continuar usando o LeadMap Pro, entre em contato com nosso suporte.
          </p>
        </div>

        {user && (
          <div className="rounded-lg border bg-card px-4 py-3 text-sm text-left space-y-1">
            <p className="font-medium">{user.nomeCompleto ?? 'Usuário'}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Falar com suporte no WhatsApp
            </a>
          </Button>

          <Button variant="outline" onClick={signOut} className="w-full gap-2">
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </div>

        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">L</span>
          </div>
        </div>
      </div>
    </div>
  )
}
