'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Shield } from 'lucide-react'

interface Account {
  id: string
  name?: string
  owner_email?: string
  plan_type?: string
  subscription_status?: string
  createdAt?: string
  created_at?: string
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role !== 'admin') return
    api.get<{ accounts: Account[] } | Account[]>('/admin/accounts')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).accounts ?? []
        setAccounts(list)
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false))
  }, [user])

  if (loading || user?.role !== 'admin') {
    return (
      <div className="container mx-auto p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Shield className="h-9 w-9 text-primary" /> Painel Admin
        </h1>
        <p className="text-muted-foreground mt-2">Visão geral de todos os accounts do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-widest">Total Accounts</p>
            <p className="text-3xl font-bold mt-1">{accounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-widest">Ativos</p>
            <p className="text-3xl font-bold mt-1 text-green-500">
              {accounts.filter((a) => a.subscription_status === 'active').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Accounts</CardTitle>
          <CardDescription>Lista completa de contas cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email Owner</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Criação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingAccounts ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : accounts.length > 0 ? (
                  accounts.map((account) => {
                    const createdAt = account.created_at ?? account.createdAt
                    return (
                      <TableRow key={account.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{account.name ?? '-'}</TableCell>
                        <TableCell>{account.owner_email ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{account.plan_type ?? 'finder'}</Badge>
                        </TableCell>
                        <TableCell>
                          {account.subscription_status === 'active' ? (
                            <Badge className="bg-green-500/10 text-green-500 border-none text-xs">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">{account.subscription_status ?? 'inativo'}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Nenhum account encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
