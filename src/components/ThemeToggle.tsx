'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const OPTIONS = [
  { value: 'light',  label: 'Claro',   Icon: Sun },
  { value: 'system', label: 'Sistema', Icon: Monitor },
  { value: 'dark',   label: 'Escuro',  Icon: Moon },
] as const

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return (
    <div className={cn('flex items-center gap-0.5 rounded-lg bg-muted p-0.5 border border-border', className)}>
      {OPTIONS.map(({ value, label, Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setTheme(value)}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                theme === value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={label}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
