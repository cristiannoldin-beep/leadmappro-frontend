'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [text])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2 px-3 py-2 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-border/10">
      <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-2xl px-3 py-2 flex items-end gap-2 min-h-[44px]">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 mb-0.5 text-[#54656f] dark:text-[#aebac1]">
          <Smile className="h-5 w-5" />
        </Button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem"
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none text-[15px] text-[#111b21] dark:text-[#e9edef] placeholder:text-[#8696a0] leading-[1.4] py-0.5 max-h-[120px] overflow-y-auto"
        />
      </div>
      <Button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        size="icon"
        className={cn(
          'h-10 w-10 rounded-full shrink-0 transition-all',
          text.trim()
            ? 'bg-[#00a884] hover:bg-[#008069] text-white'
            : 'bg-[#aebac1] dark:bg-[#8696a0] text-white cursor-not-allowed'
        )}
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  )
}
