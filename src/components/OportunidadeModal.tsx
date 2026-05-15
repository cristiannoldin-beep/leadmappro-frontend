'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface OportunidadeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunity?: { contato_id?: string | null }
  onSuccess?: () => void
}

export function OportunidadeModal({ open, onOpenChange, opportunity, onSuccess }: OportunidadeModalProps) {
  const [titulo, setTitulo] = useState('')
  const [etapa, setEtapa] = useState('novo')
  const [valor, setValor] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return

    setLoading(true)
    try {
      await api.post('/oportunidades', {
        titulo: titulo.trim(),
        etapa,
        valor_estimado: valor ? parseFloat(valor.replace(',', '.')) : null,
        observacoes: observacoes.trim() || null,
        contato_id: opportunity?.contato_id ?? null,
      })
      toast.success('Oportunidade criada!')
      setTitulo('')
      setEtapa('novo')
      setValor('')
      setObservacoes('')
      onSuccess?.()
    } catch {
      toast.error('Erro ao criar oportunidade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Oportunidade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Input
              placeholder="Título da oportunidade"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>
          <div>
            <Select value={etapa} onValueChange={setEtapa}>
              <SelectTrigger>
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="contato_feito">Contato Feito</SelectItem>
                <SelectItem value="proposta">Proposta</SelectItem>
                <SelectItem value="negociacao">Negociação</SelectItem>
                <SelectItem value="ganho">Ganho</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              placeholder="Valor estimado (ex: 1500,00)"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              type="text"
              inputMode="decimal"
            />
          </div>
          <div>
            <Textarea
              placeholder="Observações (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar Oportunidade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
