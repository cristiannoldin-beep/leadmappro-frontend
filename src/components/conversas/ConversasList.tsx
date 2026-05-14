import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, WifiOff, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import { ConversaAvatar } from "./ConversaAvatar";

interface Contato {
  id: string;
  contato_nome: string | null;
  nome_empresa: string | null;
  telefone: string | null;
  foto_url: string | null;
  foto_atualizada_em?: string | null;
}

interface Conversa {
  contato_id: string;
  contato_nome: string | null;
  nome_empresa: string;
  telefone: string;
  ultima_mensagem: string;
  ultima_data: string;
  ultima_direcao: string;
  ultima_provider_message_id: string | null;
  nao_lidas: number;
  tipo_midia: string;
  classificacao_ia: string | null;
  foto_url: string | null;
  foto_atualizada_em: string | null;
}

interface ConversasListProps {
  selectedContatoId: string | null;
  onSelectContato: (id: string) => void;
  accountId: string | null;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM/yy");
}

function previewMessage(msg: string, direcao: string, tipoMidia: string, providerMessageId: string | null) {
  const prefix = direcao === "enviado"
    ? providerMessageId
      ? "✓ "
      : "🕑 "
    : "";
  
  if (tipoMidia === "audio") return `${prefix}🎤 Áudio`;
  if (tipoMidia === "imagem") return `${prefix}📷 Foto`;
  if (tipoMidia === "video") return `${prefix}🎥 Vídeo`;
  if (tipoMidia === "documento" || tipoMidia === "document") return `${prefix}📄 Documento`;
  
  try {
    const parsed = JSON.parse(msg);
    if (parsed.type === "sticker") return `${prefix}🎭 Figurinha`;
    if (parsed.type === "location") return `${prefix}📍 Localização`;
  } catch { /* ignore invalid JSON for preview */ }
  
  const truncated = msg.length > 40 ? msg.substring(0, 40) + "..." : msg;
  return `${prefix}${truncated}`;
}

const AVATAR_COLORS = [
  '#3b82f6','#8b5cf6','#ec4899','#f97316',
  '#14b8a6','#84cc16','#f59e0b','#06b6d4',
  '#6366f1','#10b981','#ef4444','#a855f7'
];

// ConversaAvatar imported from ./ConversaAvatar

export function ConversasList({ selectedContatoId, onSelectContato, accountId }: ConversasListProps) {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todas" | "nao_lidas">("todas");
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "offline" | "no_config">("checking");
  const [showNewChat, setShowNewChat] = useState(false);
  const [contacts, setContacts] = useState<Contato[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);

  const totalNaoLidas = conversas.reduce((acc, c) => acc + c.nao_lidas, 0);

  const fetchConversas = async () => {
    if (!accountId) return;
    const { data, error } = await supabase
      .from("interacoes")
      .select(`
        contato_id,
        conteudo,
        data,
        direcao,
        provider_message_id,
        lida,
        tipo_midia,
        classificacao_ia,
        contatos!inner(contato_nome, nome_empresa, telefone, foto_url, foto_atualizada_em)
      `)
      .eq("account_id", accountId)
      .order("data", { ascending: false })
      .limit(500);

    if (error || !data) {
      setLoading(false);
      return;
    }

    const list: Conversa[] = [];
    const processedIds = new Set<string>();

    data.forEach((row) => {
      const cid = row.contato_id;
      if (processedIds.has(cid)) return;

      const contato = row.contatos as unknown as Contato;
      list.push({
        contato_id: cid,
        contato_nome: contato?.contato_nome,
        nome_empresa: contato?.nome_empresa || "Sem nome",
        telefone: contato?.telefone || "",
        ultima_mensagem: row.conteudo,
        ultima_data: row.data || "",
        ultima_direcao: row.direcao,
        ultima_provider_message_id: row.provider_message_id || null,
        nao_lidas: 0,
        tipo_midia: row.tipo_midia || "texto",
        classificacao_ia: row.classificacao_ia || null,
        foto_url: contato?.foto_url || null,
        foto_atualizada_em: contato?.foto_atualizada_em || null,
      });
      processedIds.add(cid);
    });

    // Count unreads efficiently using a Map
    const unreadCounts = new Map<string, number>();
    data.forEach((row) => {
      if (row.direcao === "recebido" && !row.lida) {
        unreadCounts.set(row.contato_id, (unreadCounts.get(row.contato_id) || 0) + 1);
      }
    });

    list.forEach((conversa) => {
      conversa.nao_lidas = unreadCounts.get(conversa.contato_id) || 0;
    });

    setConversas(list);
    setLoading(false);
  };

  useEffect(() => { fetchConversas(); }, [accountId]);

  useEffect(() => {
    if (!accountId) return;
    const channel = supabase.channel("conversas-list-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "interacoes", filter: `account_id=eq.${accountId}` }, () => {
        setTimeout(fetchConversas, 500);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [accountId]);

  useEffect(() => {
    if (!accountId) return;

    // Verificação inicial de conexão
    const checkConnection = async () => {
      const { data } = await supabase
        .from("whatsapp_conexoes")
        .select("status")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const status = data?.status ?? "disconnected";
      if (status === "connected") setConnectionStatus("connected");
      else if (status === "connecting") setConnectionStatus("checking");
      else setConnectionStatus("offline");
    };
    checkConnection();

    // Subscription realtime: detecta conexão/desconexão sem polling
    const channel = supabase.channel("conexao-status-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "whatsapp_conexoes", filter: `account_id=eq.${accountId}` },
        (payload) => {
          const novoStatus = payload.new?.status;
          if (novoStatus === "connected") {
            setConnectionStatus("connected");
            // Aguarda 2s para a sincronização ter iniciado no backend antes de recarregar
            setTimeout(fetchConversas, 2000);
          } else if (novoStatus === "disconnected" || novoStatus === "error") {
            setConnectionStatus("offline");
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [accountId]);

  const sincronizarConversas = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sincronizar-chats", {});
      if (error) throw error;
      toast.success(`Sincronizadas: ${data?.synced_chats ?? 0} conversas, ${data?.synced_messages ?? 0} mensagens`);
      await fetchConversas();
    } catch (e: any) {
      toast.error(`Erro ao sincronizar: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const filteredConversas = conversas.filter((c) => {
    if (filter === "nao_lidas" && c.nao_lidas === 0) return false;
    if (search) {
      const s = search.toLowerCase();
      return (c.contato_nome?.toLowerCase().includes(s)) || c.nome_empresa.toLowerCase().includes(s) || c.telefone.includes(s);
    }
    return true;
  });

  const iniciarConversa = async () => {
    if (!newNumber || newNumber.replace(/\D/g, "").length < 10) {
      toast.error("Número inválido. Digite o DDD + número (mínimo 10 dígitos).");
      return;
    }
    if (!accountId) {
      toast.error("Conta não identificada. Recarregue a página.");
      return;
    }
    const numeroLimpo = newNumber.replace(/\D/g, "");

    // Verifica se já existe contato com esse telefone
    const { data: existing } = await supabase
      .from("contatos")
      .select("id")
      .eq("telefone", numeroLimpo)
      .eq("account_id", accountId)
      .maybeSingle();

    if (existing) {
      setShowNewChat(false);
      onSelectContato(existing.id);
      return;
    }

    const { data: novoContato, error } = await supabase
      .from("contatos")
      .insert({ contato_nome: numeroLimpo, nome_empresa: numeroLimpo, telefone: numeroLimpo, account_id: accountId })
      .select().single();

    if (error) {
      toast.error(`Erro ao criar contato: ${error.message}`);
      return;
    }
    setShowNewChat(false);
    onSelectContato(novoContato.id);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111b21] border-r border-border/10">
      {/* Search Header */}
      <div className="shrink-0 bg-white dark:bg-[#111b21] px-3 py-2 space-y-2 border-b border-transparent dark:border-[#202c33]">
        <div className="flex items-center justify-between h-12">
          <h1 className="text-[22px] font-bold text-[#111b21] dark:text-[#e9edef] pl-1 tracking-tight">Conversas</h1>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              title="Sincronizar conversas do celular"
              disabled={syncing || connectionStatus !== "connected"}
              className="h-10 w-10 rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
              onClick={sincronizarConversas}
            >
              <RefreshCw className={cn("h-5 w-5", syncing && "animate-spin")} />
            </Button>
            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setShowNewChat(true)}>
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Banner de desconectado */}
        {connectionStatus === "offline" && (
          <div className="mx-1 mb-1 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">WhatsApp desconectado</span>
            <a href="/configuracoes/whatsapp" className="underline font-medium hover:text-amber-900 dark:hover:text-amber-200 whitespace-nowrap">Reconectar</a>
          </div>
        )}
        
        <div className="relative mx-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#54656f] dark:text-[#8696a0]" />
          <Input
            placeholder="Pesquisar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-[35px] text-[15px] bg-[#f0f2f5] dark:bg-[#202c33] border-none rounded-lg focus-visible:ring-0 text-[#111b21] dark:text-[#d1d7db] placeholder:text-[#54656f] dark:placeholder:text-[#8696a0]"
          />
        </div>

        <div className="flex gap-2 py-1 px-1">
          <button onClick={() => setFilter("todas")} className={cn("text-[14px] px-3.5 py-1.5 rounded-full transition-colors flex items-center h-8", filter === "todas" ? "bg-[#e7fce3] text-[#008069] dark:bg-[#0a332c] dark:text-[#00a884] font-medium" : "bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-[#2a3942]")}>
            Tudo
          </button>
          <button onClick={() => setFilter("nao_lidas")} className={cn("text-[14px] px-3.5 py-1.5 rounded-full transition-colors flex items-center justify-center gap-1.5 h-8", filter === "nao_lidas" ? "bg-[#e7fce3] text-[#008069] dark:bg-[#0a332c] dark:text-[#00a884] font-medium" : "bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-[#2a3942]")}>
            Não lidas
            {totalNaoLidas > 0 && <span className="bg-[#25d366] text-[#111b21] dark:bg-[#00a884] text-[11px] font-bold rounded-full h-[18px] min-w-[18px] px-1 flex items-center justify-center -mr-1">{totalNaoLidas}</span>}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
        ) : filteredConversas.map((c) => {
          const nome = c.contato_nome || c.nome_empresa || "?";
          const isActive = selectedContatoId === c.contato_id;
          const hasUnread = c.nao_lidas > 0;
          return (
            <button
              key={c.contato_id}
              onClick={() => onSelectContato(c.contato_id)}
              className={cn(
                "w-full flex items-center gap-3.5 h-[72px] pl-[13px] pr-4 transition-colors relative group",
                isActive ? "bg-[#f0f2f5] dark:bg-[#2a3942]" : "hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]"
              )}
            >
              <ConversaAvatar nome={nome} fotoUrl={c.foto_url} tamanho={49} contatoId={c.contato_id} telefone={c.telefone} />
              
              <div className="flex-1 min-w-0 h-full flex flex-col justify-center border-b border-[#f0f2f5] dark:border-[#202c33] group-last:border-none">
                <div className="flex items-center justify-between mb-[2px]">
                  <span className={cn("text-[17px] truncate", hasUnread ? "font-semibold text-black dark:text-[#e9edef]" : "font-normal text-[#111b21] dark:text-[#d1d7db]")}>
                    {nome}
                  </span>
                  <span className={cn("text-[12px] truncate max-w-[65px] text-right", hasUnread ? "text-[#25d366] dark:text-[#00a884] font-medium" : "text-[#667781] dark:text-[#8696a0]")}>
                    {c.ultima_data ? formatTime(c.ultima_data) : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-[14px] truncate flex-1 leading-5", hasUnread ? "text-[#111b21] dark:text-[#e9edef] font-medium" : "text-[#667781] dark:text-[#8696a0]")}>
                    {previewMessage(c.ultima_mensagem, c.ultima_direcao, c.tipo_midia, c.ultima_provider_message_id)}
                  </span>
                  {hasUnread && (
                    <span className="bg-[#25d366] dark:bg-[#00a884] text-white dark:text-[#111b21] text-[11.5px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 ml-2 shadow-sm">
                      {c.nao_lidas}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={showNewChat} onOpenChange={(open) => { setShowNewChat(open); if (!open) setNewNumber(""); }}>
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
              onKeyDown={(e) => e.key === "Enter" && iniciarConversa()}
              autoFocus
              className="h-12 rounded-xl bg-[#f0f2f5] dark:bg-[#2a3942] border border-transparent dark:border-[#3b4a54] text-gray-900 dark:text-gray-100 placeholder:text-[#8696a0] focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
            <Button className="w-full h-12 rounded-xl bg-[#008069] hover:bg-[#00a884] text-white font-bold" onClick={iniciarConversa}>
              Começar Agora
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
