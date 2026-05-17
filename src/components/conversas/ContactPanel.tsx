'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Loader2, Phone, MapPin, Globe, Sparkles } from 'lucide-react'

interface Contato {
  id: string
  nomeEmpresa: string
  contatoNome: string | null
  telefone: string
  cidade: string | null
  estado: string | null
  website: string | null
  ganchoPersonalizacao: string | null
  provaSocial: string | null
}

interface ContactPanelProps {
  contatoId: string | null
  contato?: unknown
}

export function ContactPanel({ contatoId }: ContactPanelProps) {
  const [data, setData] = useState<Contato | null>(null)
  const [loading, setLoading] = useState(false)
  const [enriching, setEnriching] = useState(false)

  useEffect(() => {
    if (!contatoId) return
    setLoading(true)
    api.get<{ contato: Contato }>(`/contatos/${contatoId}`)
      .then((res) => setData(res.contato))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [contatoId])

  const handleEnriquecer = async () => {
    if (!contatoId) return
    setEnriching(true)
    try {
      const res = await api.post<{ contato: Contato }>(`/contatos/${contatoId}/enriquecer`, {})
      setData(res.contato)
      toast.success('Contato enriquecido com IA!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enriquecer'
      toast.error(msg)
    } finally {
      setEnriching(false)
    }
  }

  if (!contatoId) return null

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-3 w-1/2 mx-auto" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold text-2xl uppercase">
          {(data.contatoNome ?? data.nomeEmpresa)[0]}
        </div>
        <div>
          <p className="font-semibold text-sm">{data.contatoNome ?? data.nomeEmpresa}</p>
          {data.contatoNome && <p className="text-xs text-muted-foreground">{data.nomeEmpresa}</p>}
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {data.telefone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{data.telefone}</span>
          </div>
        )}
        {(data.cidade || data.estado) && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{[data.cidade, data.estado].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {data.website && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <a href={data.website} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary transition-colors">
              {data.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {(data.ganchoPersonalizacao || data.provaSocial) ? (
        <div className="space-y-2">
          {data.ganchoPersonalizacao && (
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Gancho</p>
              <p className="text-xs text-foreground">{data.ganchoPersonalizacao}</p>
            </div>
          )}
          {data.provaSocial && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Prova Social</p>
              <p className="text-xs text-foreground">{data.provaSocial}</p>
            </div>
          )}
          {data.website && (
            <Button size="sm" variant="outline" className="w-full gap-2 text-xs" onClick={handleEnriquecer} disabled={enriching}>
              {enriching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Atualizar com IA
            </Button>
          )}
        </div>
      ) : data.website ? (
        <Button size="sm" variant="outline" className="w-full gap-2 text-xs" onClick={handleEnriquecer} disabled={enriching}>
          {enriching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Enriquecer com IA
        </Button>
      ) : null}
    </div>
  )
}
