'use client'

import { useState } from 'react'
import { ConversasList } from '@/components/conversas/ConversasList'
import { ChatWindow } from '@/components/conversas/ChatWindow'
import { ContactPanel } from '@/components/conversas/ContactPanel'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ArrowLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ConversasPage() {
  const [selectedContatoId, setSelectedContatoId] = useState<string | null>(null)
  const [contato, setContato] = useState<any>(null)
  const [showPanel, setShowPanel] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

  const handleSelectContato = (id: string, c?: any) => {
    setSelectedContatoId(id)
    setContato(c ?? null)
    setMobileView('chat')
  }

  const handleBack = () => {
    setMobileView('list')
    setSelectedContatoId(null)
  }

  return (
    <div className="h-[calc(100vh-0px)] flex overflow-hidden">
      {/* Lista de conversas */}
      <div className={cn(
        'w-full md:w-[340px] lg:w-[380px] shrink-0 h-full border-r border-border/30',
        mobileView === 'chat' && 'hidden md:flex md:flex-col'
      )}>
        <ConversasList
          selectedContatoId={selectedContatoId}
          onSelectContato={handleSelectContato}
          accountId={null}
        />
      </div>

      {/* Chat */}
      <div className={cn(
        'flex-1 h-full min-w-0 flex flex-col overflow-hidden',
        mobileView === 'list' && 'hidden md:flex md:flex-col'
      )}>
        {selectedContatoId && (
          <div className="md:hidden h-10 flex items-center px-2 border-b border-border bg-card">
            <Button variant="ghost" size="sm" onClick={handleBack} className="h-8">
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
          </div>
        )}
        <ChatWindow
          contatoId={selectedContatoId}
          accountId={null}
          contato={contato}
          onTogglePanel={() => setShowPanel(!showPanel)}
          onNewMessage={() => {}}
        />
      </div>

      {/* Painel de contato - desktop */}
      {showPanel && selectedContatoId && (
        <div className="hidden lg:flex w-[280px] shrink-0 border-l border-border bg-card h-full overflow-y-auto flex-col">
          <div className="flex items-center justify-between p-2 border-b border-border">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contato</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPanel(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ContactPanel contatoId={selectedContatoId} contato={contato} />
        </div>
      )}

      {/* Painel de contato - mobile */}
      <Sheet open={showPanel && !!selectedContatoId} onOpenChange={setShowPanel}>
        <SheetContent side="right" className="w-[300px] p-0 lg:hidden">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contato</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {selectedContatoId && <ContactPanel contatoId={selectedContatoId} contato={contato} />}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
