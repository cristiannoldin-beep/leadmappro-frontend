'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus, WifiOff, Loader2, RefreshCw, DownloadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Interacao {
  id: string
  conteudo: string
  direcao: string
  data: string
}

interface ContatoApi {
  id: string
  contatoNome: string | null
  nomeEmpresa: string
  telefone: string
  interacoes: Interacao[]
  updatedAt: string
}

interface Conversa {
  contatoId: string
  nome: string
  telefone: string
  ultimaMensagem: string
  ultimaData: string
  ultimaDirecao: string
}

interface ConversasListProps {
  selectedContatoId: string | null
  onSelectContato: (id: string, contato?: unknown) => void
  accountId: string | null
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Ontem'
  return format(d, 'dd/MM/yy')
}

export function ConversasList({ selectedContatoId, onSelectContato }: ConversasListProps) {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [newNumber, setNewNumber] = useState('')
  const [creating, setCreating] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const fetchConversas = useCallback(async () => {
    try {
      const data = await api.get<{ conversas: ContatoApi[] }>('/chats/conversas')
      const list: Conversa[] = (data.conversas ?? []).map((c) => {
        const ultima = c.interacoes?.[0]
        return {
          contatoId: c.id,
          nome: c.contatoNome ?? c.nomeEmpresa ?? c.telefone ?? '?',
          telefone: c.telefone ?? '',
          ultimaMensagem: ultima?.conteudo ?? '',
          ultimaData: ultima?.data ?? c.updatedAt,
          ultimaDirecao: ultima?.direcao ?? '',
        }
      })
      setConversas(list)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversas()
    const interval = setInterval(fetchConversas, 10000)
    return () => clearInterval(interval)
  }, [fetchConversas])

  const sincronizar = async () => {
    setSyncing(true)
    try {
      const data = await api.post<{ syncedChats: number; syncedMessages: number }>('/chats/sincronizar', {})
      toast.success(`${data.syncedChats} conversa${data.syncedChats !== 1 ? 's' : ''} e ${data.syncedMessages} mensagen${data.syncedMessages !== 1 ? 's' : ''} importada${data.syncedMessages !== 1 ? 's' : ''}`)
      fetchConversas()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Erro ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const iniciarConversa = async () => {
    const numero = newNumber.replace(/\D/g, '')
    if (numero.length < 10) {
      toast.error('Número inválido. Digite o DDD + número (mínimo 10 dígitos).')
      return
    }
    setCreating(true)
    try {
      const data = await api.post<{ contato: { id: string } }>('/contatos', {
        nomeEmpresa: numero,
        contatoNome: numero,
        telefone: numero,
      })
      setShowNewChat(false)
      setNewNumber('')
      onSelectContato(data.contato.id)
      fetchConversas()
    } catch {
      toast.error('Erro ao criar contato.')
    } finally {
      setCreating(false)
    }
  }

  const filtered = conversas.filter((c) => {
    if (!search) return true
    const s = search.toLowerCase()
    return c.nome.toLowerCase().includes(s) || c.telefone.includes(s)
  })

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] border-r border-border/10">
      <div className="shrink-0 px-3 py-2 space-y-2 border-b border-transparent dark:border-[#202c33]">
        <div className="flex items-center justify-between h-12">
          <h1 className="text-[22px] font-bold text-[#111b21] dark:text-[#e9edef] pl-1 tracking-tight">Conversas</h1>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full" title="Sincronizar com WhatsApp" onClick={sincronizar} disabled={syncing}>
              {syncing ? <Loader2 className="h-5 w-5 animate-spin" /> : <DownloadCloud className="h-5 w-5" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full" onClick={fetchConversas}>
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full" onClick={() => setShowNewChat(true)}>
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </div>
        <div className="relative mx-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#54656f] dark:text-[#8696a0]" />
          <Input
            placeholder="Pesquisar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-[35px] bg-[#f0f2f5] dark:bg-[#202c33] border-none rounded-lg focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground px-4 text-center">
            <DownloadCloud className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">Nenhuma conversa ainda</p>
            <p className="text-xs opacity-60">Clique em <DownloadCloud className="inline h-3 w-3" /> para importar o histórico do WhatsApp conectado.</p>
            <button onClick={sincronizar} disabled={syncing} className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold underline underline-offset-2 disabled:opacity-50">
              {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
            </button>
          </div>
        ) : filtered.map((c) => {
          const isActive = selectedContatoId === c.contatoId
          return (
            <button
              key={c.contatoId}
              onClick={() => onSelectContato(c.contatoId, c)}
              className={cn(
                'w-full flex items-center gap-3.5 h-[72px] pl-[13px] pr-4 transition-colors relative group',
                isActive ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'
              )}
            >
              <div className="h-[49px] w-[49px] rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-lg uppercase">
                {c.nome[0]}
              </div>
              <div className="flex-1 min-w-0 h-full flex flex-col justify-center border-b border-[#f0f2f5] dark:border-[#202c33] group-last:border-none">
                <div className="flex items-center justify-between mb-[2px]">
                  <span className="text-[17px] truncate font-normal text-[#111b21] dark:text-[#d1d7db]">{c.nome}</span>
                  {c.ultimaData && (
                    <span className="text-[12px] text-[#667781] dark:text-[#8696a0]">{formatTime(c.ultimaData)}</span>
                  )}
                </div>
                <span className="text-[14px] truncate text-[#667781] dark:text-[#8696a0]">
                  {c.ultimaDirecao === 'enviado' ? '✓ ' : ''}{c.ultimaMensagem || 'Sem mensagens'}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <Dialog open={showNewChat} onOpenChange={(open) => { setShowNewChat(open); if (!open) setNewNumber('') }}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-none">
          <div className="bg-[#008069] text-white p-6 pb-12">
            <h2 className="text-xl font-medium">Nova Conversa</h2>
            <p className="text-sm text-white/70 mt-1">Digite o número com DDD (ex: 47999990000)</p>
          </div>
          <div className="p-4 -mt-8 bg-white dark:bg-[#111b21] rounded-t-2xl space-y-4">
            <Input
              placeholder="47 9 9999-0000"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && iniciarConversa()}
              autoFocus
              className="h-12 rounded-xl bg-[#f0f2f5] dark:bg-[#2a3942] border border-transparent"
            />
            <Button disabled={creating} className="w-full h-12 rounded-xl bg-[#008069] hover:bg-[#00a884] text-white font-bold" onClick={iniciarConversa}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Começar Agora
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
