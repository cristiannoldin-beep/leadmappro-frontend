'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, CreditCard, LogOut } from 'lucide-react'

export default function BloqueadoPage() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full rounded-3xl shadow-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="p-6 rounded-full bg-red-500/10">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Assinatura Expirada</h1>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Sua assinatura expirou ou está inativa. Renove seu plano para continuar usando o LeadMap Pro.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link href="/meu-plano">
              <Button className="w-full gap-2 font-bold">
                <CreditCard className="h-4 w-4" />
                Atualizar Plano
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
