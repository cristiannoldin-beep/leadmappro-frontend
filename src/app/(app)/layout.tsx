'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'
import {
  LayoutDashboard,
  List,
  Send,
  Kanban,
  MessageSquare,
  Smartphone,
  Bot,
  Settings,
  CreditCard,
  Shield,
  FileText,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/listas', label: 'Listas', icon: List },
  { href: '/campanhas', label: 'Campanhas', icon: Send },
  { href: '/crm', label: 'CRM', icon: Kanban },
  { href: '/conversas', label: 'Conversas', icon: MessageSquare },
  { href: '/configuracoes/whatsapp', label: 'WhatsApp', icon: Smartphone },
  { href: '/configuracoes/sdr', label: 'SDR', icon: Bot },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/meu-plano', label: 'Meu Plano', icon: CreditCard },
]

const adminItems = [
  { href: '/admin', label: 'Painel Admin', icon: Shield },
  { href: '/admin/logs', label: 'Logs', icon: FileText },
]

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
      <span className="flex-1">{label}</span>
      {isActive && <ChevronRight className="h-3 w-3 text-primary" />}
    </Link>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r border-border p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!user) return null

  const initials = (user.nomeCompleto ?? user.email)
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border flex flex-col h-full bg-card">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-lg">LeadMap Pro</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}

          {user.role === 'admin' && (
            <>
              <Separator className="my-3" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
              {adminItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-2 py-1.5 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user.nomeCompleto ?? 'Usuário'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
