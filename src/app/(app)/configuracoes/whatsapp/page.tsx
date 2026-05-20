'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Loader2,
  Wifi,
  WifiOff,
  Plus,
  MessageCircle,
  Smartphone,
  Trash2,
  RefreshCw,
  Phone,
  Clock,
  ArrowLeft,
} from 'lucide-react'

interface WhatsappConexao {
  id: string
  apelido?: string
  numeroTelefone?: string
  instanceName?: string
  provider: 'uazapi' | 'meta_official'
  status: string
  createdAt?: string
}

function isConnected(status: string) {
  return ['connected', 'CONNECTED', 'ACTIVE'].includes(status)
}
function isPending(status: string) {
  return ['connecting', 'PENDING'].includes(status)
}
function getStatusLabel(status: string) {
  if (isConnected(status)) return 'Conectado'
  if (isPending(status)) return 'Conectando...'
  if (['disconnected', 'DISCONNECTED'].includes(status)) return 'Desconectado'
  if (['qr_pending', 'QR_PENDING'].includes(status)) return 'Aguardando QR'
  return status
}

export default function ConexoesWhatsAppPage() {
  const [conexoes, setConexoes] = useState<WhatsappConexao[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [instanceName, setInstanceName] = useState('')
  const [generatingQR, setGeneratingQR] = useState(false)
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null)
  const [waitingForQr, setWaitingForQr] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchConexoes = (instanceNameAtivo?: string) => {
    api.get<{ conexoes: WhatsappConexao[] } | WhatsappConexao[]>('/whatsapp/conexoes')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as any).conexoes ?? []
        setConexoes(list)

        if (instanceNameAtivo) {
          const conectada = list.find(
            (c: WhatsappConexao) => isConnected(c.status) && (c.instanceName === instanceNameAtivo || c.apelido === instanceNameAtivo)
          )
          if (conectada) {
            if (pollingRef.current) clearInterval(pollingRef.current)
            setQrCodeBase64(null)
            setDialogOpen(false)
            toast.success(`${conectada.apelido ?? 'WhatsApp'} conectado!`)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const stopQrPolling = () => {
    if (qrPollRef.current) { clearInterval(qrPollRef.current); qrPollRef.current = null }
    setWaitingForQr(false)
  }

  useEffect(() => {
    fetchConexoes()
    const interval = setInterval(() => fetchConexoes(), 15000)
    return () => {
      clearInterval(interval)
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (qrPollRef.current) clearInterval(qrPollRef.current)
    }
  }, [])

  const handleGerarQR = async () => {
    if (!instanceName || instanceName.length < 3) {
      toast.error('O nome deve ter pelo menos 3 caracteres.')
      return
    }
    setGeneratingQR(true)
    setQrCodeBase64(null)
    stopQrPolling()
    try {
      const data = await api.post<{ qrCode?: string; alreadyConnected?: boolean; conexao?: { id: string } }>('/whatsapp/conexoes', {
        instanceName: instanceName.trim(),
        provider: 'uazapi',
        apelido: instanceName.trim(),
      })
      if (data.alreadyConnected) {
        toast.success('Instância já conectada!')
        setDialogOpen(false)
        fetchConexoes()
        return
      }
      const nome = instanceName.trim()
      if (data.qrCode && data.conexao?.id) {
        setQrCodeBase64(data.qrCode)
        const conexaoId = data.conexao.id
        toast.success('QR Code gerado! Escaneie com seu WhatsApp.')
        pollingRef.current = setInterval(async () => {
          try {
            const statusData = await api.get<{ status: string }>(`/whatsapp/${conexaoId}/status`)
            if (statusData.status === 'connected') {
              if (pollingRef.current) clearInterval(pollingRef.current)
              setQrCodeBase64(null)
              setDialogOpen(false)
              toast.success(`${nome} conectado com sucesso!`)
              fetchConexoes()
            }
          } catch { /* continua polling */ }
        }, 4000)
      } else if (data.qrCode) {
        setQrCodeBase64(data.qrCode)
        toast.success('QR Code gerado! Escaneie com seu WhatsApp.')
        pollingRef.current = setInterval(() => fetchConexoes(nome), 4000)
      } else if (data.conexao?.id) {
        // QR não chegou na resposta — faz polling em /whatsapp/:id/qrcode
        const conexaoId = data.conexao.id
        setWaitingForQr(true)
        toast.info('Aguardando QR Code do servidor...')
        let attempts = 0
        const pollQr = async () => {
          attempts++
          try {
            const qrData = await api.get<{ qrCode?: string | null }>(`/whatsapp/${conexaoId}/qrcode`)
            if (qrData.qrCode) {
              setQrCodeBase64(qrData.qrCode)
              stopQrPolling()
              toast.success('QR Code gerado! Escaneie com seu WhatsApp.')
              pollingRef.current = setInterval(() => fetchConexoes(nome), 4000)
            } else if (attempts >= 10) {
              stopQrPolling()
              toast.error('Tempo esgotado. Verifique a configuração do UazAPI.')
            }
          } catch { if (attempts >= 10) stopQrPolling() }
        }
        qrPollRef.current = setInterval(pollQr, 3000)
        pollQr()
      } else {
        toast.success('Conexão criada!')
        setDialogOpen(false)
        fetchConexoes()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conexão.'
      toast.error(msg)
    } finally {
      setGeneratingQR(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta conexão?')) return
    try {
      await api.delete(`/whatsapp/conexoes/${id}`)
      toast.success('Conexão removida.')
      setConexoes((prev) => prev.filter((c) => c.id !== id))
    } catch {
      toast.error('Erro ao remover conexão.')
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/configuracoes" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors text-sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Configurações
          </Link>
          <h1 className="text-4xl font-black flex items-center gap-3">
            <MessageCircle className="h-10 w-10 text-primary" /> Canais de Disparo
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus números de WhatsApp para disparar campanhas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => fetchConexoes()} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            className="h-14 px-8 rounded-full font-bold gap-2"
            onClick={() => { setQrCodeBase64(null); setInstanceName(''); setDialogOpen(true) }}
          >
            <Plus className="h-5 w-5" /> Novo Canal
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : conexoes.length === 0 ? (
        <div className="text-center p-20 border-2 border-dashed border-border rounded-3xl bg-muted/20">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-muted-foreground mb-2">Nenhum canal conectado</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Adicione um número de WhatsApp para começar a disparar campanhas.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {conexoes.map((con) => {
            const connected = isConnected(con.status)
            const pending = isPending(con.status)
            const createdAt = con.createdAt
            return (
              <Card key={con.id} className={`relative overflow-hidden group transition-all hover:shadow-xl border ${
                connected ? 'border-green-200 dark:border-green-900/50' :
                pending ? 'border-amber-200 dark:border-amber-900/50' :
                'border-red-200 dark:border-red-900/50 opacity-80'
              }`}>
                <div className={`absolute top-0 w-full h-1 ${
                  connected ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                  pending ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                  'bg-gradient-to-r from-red-400 to-rose-500'
                }`} />
                <CardHeader className="pt-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                          connected ? 'bg-green-500' :
                          pending ? 'bg-amber-400 animate-pulse' :
                          'bg-red-400'
                        }`} />
                        <CardTitle className="text-base font-bold truncate">{con.apelido ?? 'Instância'}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                        {con.provider === 'meta_official' ? 'Meta Oficial' : 'Uazapi'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => handleDelete(con.id)}
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-sm truncate">
                      {con.numeroTelefone ?? <span className="text-muted-foreground italic">Aguardando...</span>}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                    connected ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                    pending ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                    'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  }`}>
                    {connected ? <Wifi className="h-3.5 w-3.5" /> :
                     pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                     <WifiOff className="h-3.5 w-3.5" />}
                    {getStatusLabel(con.status)}
                  </div>
                  {createdAt && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Criado em {new Date(createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Connection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(val) => {
        setDialogOpen(val)
        if (!val) { setQrCodeBase64(null); setInstanceName(''); stopQrPolling() }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Adicione uma instância via QR Code (Uazapi)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/20">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Conexão via QR Code (Uazapi)</p>
                <p className="text-xs text-muted-foreground">Baseado em leitura de QR Code. O celular deve estar conectado.</p>
              </div>
            </div>
            {waitingForQr ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground text-center">
                  Aguardando QR Code do servidor...
                </p>
                <Button variant="ghost" className="text-xs" onClick={() => { stopQrPolling(); setDialogOpen(false) }}>
                  Cancelar
                </Button>
              </div>
            ) : !qrCodeBase64 ? (
              <>
                <div className="space-y-2">
                  <Label>Nome da Instância</Label>
                  <Input
                    placeholder="Ex: Vendas 01"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                  />
                </div>
                <Button onClick={handleGerarQR} disabled={generatingQR} className="w-full">
                  {generatingQR ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  {generatingQR ? 'Gerando...' : 'Gerar QR Code'}
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-lg border-2 border-muted">
                  <img
                    src={qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`}
                    className="w-40 h-40"
                    alt="QR Code"
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground animate-pulse">
                  Aguardando escaneamento...
                </p>
                <Button variant="ghost" className="text-xs" onClick={() => { setQrCodeBase64(null); stopQrPolling() }}>
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
