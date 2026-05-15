'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CreateListaPayload {
  nome: string
  origem: string
  segmento?: string
  cidade?: string
  estado?: string
}

export default function CriarListaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState('')
  const [origem, setOrigem] = useState('')
  const [segmento, setSegmento] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nome.trim()) {
      toast.error('Informe o nome da lista.')
      return
    }
    if (!origem) {
      toast.error('Selecione a origem da lista.')
      return
    }

    setLoading(true)
    try {
      const payload: CreateListaPayload = {
        nome: nome.trim(),
        origem,
        segmento: segmento || undefined,
        cidade: cidade || undefined,
        estado: estado || undefined,
      }
      const data = await api.post<{ lista?: { id: string }; id?: string }>('/listas', payload)
      const id = (data as any).lista?.id ?? (data as any).id
      toast.success('Lista criada com sucesso!')
      router.push(id ? `/listas/${id}` : '/listas')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar lista.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/listas" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Listas
        </Link>
        <h1 className="text-3xl font-bold">Criar Nova Lista</h1>
        <p className="text-muted-foreground mt-1">
          Crie uma lista de contatos para prospecção
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Lista</CardTitle>
          <CardDescription>
            Preencha as informações para criar sua lista de contatos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Lista *</Label>
              <Input
                id="nome"
                placeholder="Ex: Clínicas Médicas - São Paulo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem">Origem *</Label>
              <Select value={origem} onValueChange={setOrigem} required>
                <SelectTrigger id="origem">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_maps">Google Maps</SelectItem>
                  <SelectItem value="importacao">Importação CSV/Excel</SelectItem>
                  <SelectItem value="parceiro_inativo">Parceiro / Inativo</SelectItem>
                  <SelectItem value="econodata">Econodata</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="segmento">Segmento (opcional)</Label>
              <Input
                id="segmento"
                placeholder="Ex: Confecção de roupas, Clínica médica"
                value={segmento}
                onChange={(e) => setSegmento(e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade (opcional)</Label>
                <Input
                  id="cidade"
                  placeholder="Ex: São Paulo"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado (opcional)</Label>
                <Input
                  id="estado"
                  placeholder="Ex: SP"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Lista'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/listas')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
