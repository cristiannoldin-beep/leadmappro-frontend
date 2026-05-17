'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface OportunidadeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contatoId: string
  onSuccess?: () => void
}

export function OportunidadeModal({ open, onOpenChange, contatoId, onSuccess }: OportunidadeModalProps) {
  const [etapa, setEtapa] = useState('novo')
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/crm/oportunidades', {
        contatoId,
        etapa,
        valorEstimado: valor ? parseFloat(valor.replace(',', '.')) : undefined,
      })
      toast.success('Oportunidade criada!')
      setEtapa('novo')
      setValor('')
      onSuccess?.()
      onOpenChange(false)
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
            <Select value={etapa} onValueChange={setEtapa}>
              <SelectTrigger>
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="contato_feito">Contato Feito</SelectItem>
                <SelectItem value="proposta">Interessados</SelectItem>
                <SelectItem value="negociacao">Negociação</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
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
