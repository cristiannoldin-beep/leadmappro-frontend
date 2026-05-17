'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import { ChatInput } from './ChatInput'
import { MoreVertical, MessageSquare, PanelRightOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  conteudo: string
  direcao: 'enviado' | 'recebido'
  data: string
  canal?: string
  editado?: boolean
}

interface ChatWindowProps {
  contatoId: string | null
  accountId: string | null
  contato: { nomeEmpresa?: string | null; contatoNome?: string | null; telefone?: string | null } | null
  onTogglePanel: () => void
  onNewMessage: () => void
}

export function ChatWindow({ contatoId, contato, onTogglePanel, onNewMessage }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastCountRef = useRef(0)

  const fetchMessages = useCallback(async () => {
    if (!contatoId) return
    try {
      const data = await api.get<{ mensagens: Message[] }>(`/chats/mensagens/${contatoId}`)
      const msgs = data.mensagens ?? []
      if (msgs.length !== lastCountRef.current) {
        lastCountRef.current = msgs.length
        setMessages(msgs)
        if (msgs.length > 0) {
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
          onNewMessage()
        }
      }
    } catch { /* silent */ }
  }, [contatoId, onNewMessage])

  useEffect(() => {
    if (!contatoId) {
      setMessages([])
      lastCountRef.current = 0
      return
    }
    setLoading(true)
    fetchMessages().finally(() => setLoading(false))
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [contatoId, fetchMessages])

  const handleSend = async (text: string) => {
    if (!contatoId || !text.trim()) return
    setSending(true)
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conteudo: text,
      direcao: 'enviado',
      data: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

    try {
      await api.post('/chats/mensagens', { contatoId, conteudo: text })
      await fetchMessages()
    } catch {
      toast.error('Erro ao enviar mensagem.')
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  if (!contatoId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#f0f2f5] dark:bg-[#0b141a]">
        <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-600" />
        <div className="text-center">
          <p className="text-xl font-light text-gray-500 dark:text-gray-400">Selecione uma conversa</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Escolha um contato na lista para ver as mensagens.</p>
        </div>
      </div>
    )
  }

  const nome = contato?.contatoNome ?? contato?.nomeEmpresa ?? contato?.telefone ?? '?'

  const groupedMessages = messages.reduce<{ date: Date; msgs: Message[] }[]>((groups, msg) => {
    const d = new Date(msg.data)
    const last = groups[groups.length - 1]
    if (!last || !isSameDay(last.date, d)) {
      groups.push({ date: d, msgs: [msg] })
    } else {
      last.msgs.push(msg)
    }
    return groups
  }, [])

  return (
    <div className="flex-1 flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 h-[60px] bg-[#f0f2f5] dark:bg-[#202c33] border-b border-border/10">
        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold text-base uppercase shrink-0">
          {nome[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#111b21] dark:text-[#e9edef] truncate">{nome}</p>
          {contato?.telefone && <p className="text-xs text-[#667781] dark:text-[#8696a0]">{contato.telefone}</p>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={onTogglePanel}>
            <PanelRightOpen className="h-5 w-5 text-[#54656f] dark:text-[#aebac1]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <MoreVertical className="h-5 w-5 text-[#54656f] dark:text-[#aebac1]" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {loading ? (
          <div className="flex justify-center py-10 text-gray-400 text-sm">Carregando...</div>
        ) : groupedMessages.length === 0 ? (
          <div className="flex justify-center py-10 text-gray-400 text-sm">Nenhuma mensagem ainda.</div>
        ) : groupedMessages.map(({ date, msgs }) => (
          <div key={date.toISOString()}>
            <div className="flex justify-center my-4">
              <span className="bg-[#e1f3fb] dark:bg-[#182229] text-[#54656f] dark:text-[#8696a0] text-[12px] px-3 py-1 rounded-lg shadow-sm">
                {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            {msgs.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex mb-1',
                  msg.direcao === 'enviado' ? 'justify-end' : 'justify-start'
                )}
              >
                <div className={cn(
                  'max-w-[70%] rounded-lg px-3 py-2 shadow-sm text-sm relative',
                  msg.direcao === 'enviado'
                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none'
                    : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none'
                )}>
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.conteudo}</p>
                  <div className={cn('flex items-center gap-1 mt-0.5', msg.direcao === 'enviado' ? 'justify-end' : 'justify-start')}>
                    <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">
                      {format(new Date(msg.data), 'HH:mm')}
                    </span>
                    {msg.direcao === 'enviado' && (
                      <span className="text-[#53bdeb] text-xs">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0">
        <ChatInput onSend={handleSend} disabled={sending} />
      </div>
    </div>
  )
}
