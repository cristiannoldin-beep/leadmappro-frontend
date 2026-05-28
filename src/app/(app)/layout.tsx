'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
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
  Server,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

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
  { href: '/admin/infra', label: 'Config SaaS', icon: Server },
  { href: '/admin/logs', label: 'Logs', icon: FileText },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/listas': 'Listas',
  '/campanhas': 'Campanhas',
  '/crm': 'CRM',
  '/conversas': 'Conversas',
  '/configuracoes/whatsapp': 'WhatsApp',
  '/configuracoes/sdr': 'SDR IA',
  '/configuracoes': 'Configurações',
  '/meu-plano': 'Meu Plano',
  '/admin': 'Painel Admin',
  '/admin/infra': 'Config SaaS',
  '/admin/logs': 'Logs',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const match = Object.entries(PAGE_TITLES)
    .filter(([k]) => k !== '/dashboard')
    .find(([k]) => pathname.startsWith(k))
  return match ? match[1] : 'LeadMap Pro'
}

function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('lmp:sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
    setMounted(true)
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      localStorage.setItem('lmp:sidebar-collapsed', String(!prev))
      return !prev
    })
  }, [])

  return { collapsed, toggle, mounted }
}

interface AccountStatus {
  status: string
  trialEndsAt: string | null
}

function useAccountStatus() {
  const [data, setData] = useState<AccountStatus | null>(null)
  useEffect(() => {
    api.get<AccountStatus>('/billing/plano')
      .then((d) => setData({ status: d.status, trialEndsAt: (d as AccountStatus & { trialEndsAt?: string | null }).trialEndsAt ?? null }))
      .catch(() => null)
  }, [])
  return data
}

function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function NavItem({
  href,
  label,
  icon: Icon,
  collapsed,
  onClick,
}: {
  href: string
  label: string
  icon: React.ElementType
  collapsed: boolean
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  const inner = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 group relative',
        collapsed ? 'justify-center px-0 py-2.5 w-10 mx-auto' : 'px-3 py-2.5',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && isActive && <ChevronRight className="h-3 w-3 text-primary" />}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return inner
}

function SidebarContent({
  collapsed,
  onNav,
  initials,
  userName,
  userEmail,
  onSignOut,
  onToggle,
}: {
  collapsed: boolean
  onNav?: () => void
  initials: string
  userName: string
  userEmail: string
  onSignOut: () => void
  onToggle?: () => void
}) {
  const { user } = useAuth()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center border-b border-border shrink-0 h-14', collapsed ? 'justify-center px-2' : 'px-4 gap-2')}>
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">L</span>
          </div>
          {!collapsed && <span className="font-bold text-base truncate">LeadMap Pro</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 overflow-y-auto py-3 space-y-0.5', collapsed ? 'px-1' : 'px-2')}>
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} onClick={onNav} />
        ))}

        {user?.role === 'admin' && (
          <>
            <Separator className="my-3" />
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Admin</p>
            )}
            {adminItems.map((item) => (
              <NavItem key={item.href} {...item} collapsed={collapsed} onClick={onNav} />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-3">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate leading-tight">{userName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 cursor-default">
                  <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right">{userName}</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Toggle + logout row */}
        <div className={cn('flex items-center px-2 pb-3 gap-1', collapsed ? 'flex-col' : 'flex-row')}>
          {onToggle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                >
                  {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={collapsed ? 'right' : 'top'}>
                {collapsed ? 'Expandir menu' : 'Recolher menu'}
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? 'icon' : 'sm'}
                onClick={onSignOut}
                className={cn('text-muted-foreground hover:text-foreground h-8', !collapsed && 'flex-1 justify-start gap-2 px-2')}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Sair</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sair</TooltipContent>}
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { collapsed, toggle, mounted } = useSidebarState()
  const [mobileOpen, setMobileOpen] = useState(false)
  const accountStatus = useAccountStatus()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !mounted) {
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
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  const userName = user.nomeCompleto ?? 'Usuário'
  const userEmail = user.email
  const pageTitle = getPageTitle(pathname)

  const daysLeft = trialDaysLeft(accountStatus?.trialEndsAt ?? null)
  const isTrialing = accountStatus?.status === 'trialing'

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen overflow-hidden bg-background">

        {/* Desktop Sidebar */}
        <aside
          className={cn(
            'hidden md:flex flex-col shrink-0 border-r border-border bg-card transition-all duration-200 overflow-hidden',
            collapsed ? 'w-[60px]' : 'w-64'
          )}
        >
          <SidebarContent
            collapsed={collapsed}
            initials={initials}
            userName={userName}
            userEmail={userEmail}
            onSignOut={signOut}
            onToggle={toggle}
          />
        </aside>

        {/* Mobile Sidebar (Sheet) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-card border-border">
            <SidebarContent
              collapsed={false}
              onNav={() => setMobileOpen(false)}
              initials={initials}
              userName={userName}
              userEmail={userEmail}
              onSignOut={() => { setMobileOpen(false); signOut() }}
            />
          </SheetContent>
        </Sheet>

        {/* Main area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Top bar */}
          <header className="h-14 shrink-0 border-b border-border bg-card/50 backdrop-blur-sm flex items-center gap-3 px-4 z-10">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-muted-foreground"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Page title */}
            <h1 className="text-sm font-bold text-foreground">{pageTitle}</h1>

            <div className="flex-1" />

            {/* Trial badge */}
            {isTrialing && daysLeft !== null && (
              <div className={cn(
                'hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
                daysLeft <= 3
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : daysLeft <= 7
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              )}>
                {daysLeft <= 3 ? <AlertTriangle className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                {daysLeft === 0 ? 'Trial encerrado' : `${daysLeft}d de trial`}
              </div>
            )}
            {isTrialing && (
              <Button asChild size="sm" className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-7 px-3 text-xs rounded-lg">
                <Link href="/meu-plano">Assinar plano</Link>
              </Button>
            )}

            {/* Notifications placeholder */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hidden sm:flex">
                  <Bell className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notificações</TooltipContent>
            </Tooltip>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" /> Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/meu-plano" className="cursor-pointer">
                    <CreditCard className="h-4 w-4 mr-2" /> Meu Plano
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-400 focus:text-red-400 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
