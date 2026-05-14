// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ConversaAvatar } from "./ConversaAvatar";
import { Search, MoreVertical, MessageSquare, PanelRightOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Message {
  id: string;
  conteudo: string;
  direcao: string;
  data: string;
  tipo_midia: string;
  classificacao_ia: string | null;
  provider_message_id: string | null;
  lida: boolean;
  editado_em?: string | null;
  conteudo_original?: string | null;
}

interface Reaction {
  emoji: string;
  is_from_me: boolean;
  interacao_id: string;
}

interface Contato {
  id: string;
  contato_nome: string | null;
  nome_empresa: string | null;
  telefone: string | null;
  foto_url: string | null;
  status?: string | null;
  foto_atualizada_em?: string | null;
}

interface ChatWindowProps {
  contatoId: string | null;
  accountId: string | null;
  contato: Contato | null;
  onTogglePanel: () => void;
  onNewMessage: () => void;
}

export function ChatWindow({ contatoId, accountId, contato, onTogglePanel, onNewMessage }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (contatoId) {
      fetchMessages();
      fetchReactions();
      markAsRead();

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      channelRef.current = subscribeToMessages();
    }
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [contatoId]);

  const markAsRead = async () => {
    if (!contatoId) return;
    console.log("[ChatWindow] Marking messages as read for:", contatoId);
    const { error } = await supabase
      .from("interacoes")
      .update({ lida: true })
      .eq("contato_id", contatoId)
      .eq("direcao", "recebido")
      .eq("lida", false);
    
    if (error) console.error("Error marking messages as read:", error);
  };

  const fetchMessages = async () => {
    if (!contatoId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("interacoes")
      .select("id, conteudo, direcao, data, tipo_midia, classificacao_ia, provider_message_id, lida")
      .eq("contato_id", contatoId)
      .order("data", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar mensagens");
    } else {
      setMessages((data || []) as Message[]);
      setTimeout(scrollToBottom, 100);
    }
    setLoading(false);
  };

  const fetchReactions = async () => {
    if (!contatoId) return;
    try {
      const { data: msgs } = await supabase
        .from("interacoes")
        .select("id")
        .eq("contato_id", contatoId);

      if (!msgs?.length) return;
      const ids = msgs.map((m) => m.id);

      const { data, error } = await (supabase as any)
        .from("interacao_reactions")
        .select("emoji, is_from_me, interacao_id")
        .in("interacao_id", ids);

      if (!error) setReactions((data || []) as Reaction[]);
    } catch {
      // tabela ainda nÃ£o existe â€” ignora silenciosamente
    }
  };

  const subscribeToMessages = () => {
    if (!contatoId) return;
    return supabase
      .channel(`chat-${contatoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interacoes", filter: `contato_id=eq.${contatoId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const novaMsg = payload.new as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === novaMsg.id)) return prev;
              
              const filtered = prev.filter((m) => {
                const isTemp = m.id.startsWith("temp-");
                const isError = m.id.startsWith("error-");
                // Se chegou do Webhook, removemos os temp e os que falharam (error) se o texto/conteudo for exatamente igual e da mesma direÃ§Ã£o
                if ((isTemp || isError) && m.conteudo === novaMsg.conteudo && m.direcao === novaMsg.direcao) {
                  return false;
                }
                // Outros "temp" que ficaram pra trÃ¡s (bug visual)
                if (isTemp && m.id !== novaMsg.id) return false;
                return true;
              });

              return [...filtered, novaMsg];
            });
            setTimeout(scrollToBottom, 50);
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) => prev.map((m) => m.id === payload.new.id ? payload.new as Message : m));
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (text: string) => {
    if (!contatoId) return;

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conteudo: text,
      direcao: "enviado",
      data: new Date().toISOString(),
      tipo_midia: "texto",
      classificacao_ia: null,
      provider_message_id: null,
      lida: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(scrollToBottom, 50);

    const { data, error } = await supabase.functions.invoke("enviar-mensagem-chat", {
      body: { contato_id: contatoId, text },
    });

    if (error || !data?.success) {
      // Modifica apenas localmente se ainda estiver em estado "temp". Mas Realtime pode jÃ¡ ter inserido a correta.
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...m, id: "error-" + Date.now() } : m));
    } else {
      // Transforma suavemente pra evitar "blink" caso o Realtime atrase
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...m, id: data.interacao_id || m.id, provider_message_id: data.messageId || null } : m));
    }
  };

  const handleSendMedia = async (mediaUrl: string, mediaType: string, caption?: string) => {
    if (!contatoId) return;

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conteudo: JSON.stringify({ type: mediaType, url: mediaUrl, caption }),
      direcao: "enviado",
      data: new Date().toISOString(),
      tipo_midia: mediaType,
      classificacao_ia: null,
      provider_message_id: null,
      lida: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(scrollToBottom, 50);

    const { data, error } = await supabase.functions.invoke("enviar-mensagem-chat", {
      body: { contato_id: contatoId, media_url: mediaUrl, media_type: mediaType, caption },
    });
    
    if (error || !data?.success) {
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...m, id: "error-" + Date.now() } : m));
    } else {
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...m, id: data.interacao_id || m.id, provider_message_id: data.messageId || null } : m));
    }
  };

  if (!contatoId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#0b141a]">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-light text-gray-700 dark:text-gray-200 mb-2">Leadmaps Pro Web</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecione uma conversa para comeÃ§ar a interagir com seus leads.
          </p>
        </div>
        <div className="absolute bottom-10 flex items-center gap-2 text-[12px] text-gray-400">
          <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          ConexÃ£o Segura e Criptografada
        </div>
      </div>
    );
  }

  const renderMessageGroups = () => {
    const groups: Record<string, Message[]> = {};
    messages.forEach((msg) => {
      const date = msg.data ? format(new Date(msg.data), "yyyy-MM-dd") : "unknown";
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });

    return Object.entries(groups).map(([date, msgs]) => {
      const d = new Date(msgs[0].data);
      let label = format(d, "dd 'de' MMMM", { locale: ptBR });
      if (isSameDay(d, new Date())) label = "Hoje";

      return (
        <div key={date}>
          <div className="flex items-center justify-center my-4">
            <span className="text-[11px] bg-white dark:bg-[#182229] text-[#54656f] dark:text-gray-400 px-3 py-1.5 rounded-lg shadow-sm font-medium uppercase tracking-wider">
              {label}
            </span>
          </div>
          {msgs.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              accountId={accountId}
              reactions={reactions.filter((r) => r.interacao_id === msg.id)}
              onReactionAdded={fetchReactions}
            />
          ))}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 overflow-hidden">
      {/* Header â€” WhatsApp Web Style */}
      <header className="h-[60px] shrink-0 flex items-center justify-between px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-border/10 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <ConversaAvatar
            key={contatoId || `avatar-${contato?.id}`}
            nome={(contato?.id === contatoId) ? (contato?.contato_nome || contato?.nome_empresa || "C") : "Carregando..."}
            fotoUrl={(contato?.id === contatoId) ? contato?.foto_url : undefined}
            tamanho={40}
            contatoId={contatoId || undefined}
            telefone={(contato?.id === contatoId) ? contato?.telefone : undefined}
          />
          <div className="min-w-0">
            <p className="text-[15px] font-medium truncate text-gray-800 dark:text-gray-100 leading-tight">
              {(contato?.id === contatoId) ? (contato?.contato_nome || contato?.nome_empresa || "Contato") : "Carregando..."}
            </p>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {contato?.status === "online" ? (
                <span className="text-emerald-500 font-medium">online</span>
              ) : (
                contato?.telefone || "Carregando..."
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#54656f] dark:text-gray-400">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-black/5">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-black/5" onClick={onTogglePanel}>
            <PanelRightOpen className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-black/5">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Messages Area â€” Pattern Background */}
      <div className="flex-1 relative w-full min-h-0 bg-[#efeae2] dark:bg-[#0b141a] z-0">
        {/* Static Background Pattern Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.6] dark:opacity-[0.06] z-0"
          style={{
            backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
            backgroundRepeat: "repeat",
            backgroundSize: "400px"
          }} 
        />
        
        {/* Scrollable Content */}
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto overflow-x-hidden z-10 w-full">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto flex flex-col px-4 md:px-8 py-4 min-h-full">
              {renderMessageGroups()}
              <div ref={bottomRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Footer / Input â€” Fixed at Bottom */}
      <footer className="shrink-0 bg-[#f0f2f5] dark:bg-[#202c33] z-20">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendText={handleSend} onSendMedia={handleSendMedia} accountId={accountId} contatoId={contatoId} />
        </div>
      </footer>
    </div>
  );
}
