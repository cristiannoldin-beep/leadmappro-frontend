// @ts-nocheck
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MapPin, Instagram, Facebook, Plus, Target, Pencil, Check, X, Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";

const ALLOWED_SOCIAL_DOMAINS = ["instagram.com", "facebook.com", "fb.com", "linkedin.com", "twitter.com", "x.com"];
function sanitizeSocialUrl(url: string, fallbackDomain?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim().replace(/^@/, "");
  if (!trimmed) return null;

  // Full URL: validate protocol + domain
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      if (!["http:", "https:"].includes(parsed.protocol)) return null;
      const host = parsed.hostname.replace(/^www\./, "");
      return ALLOWED_SOCIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
        ? parsed.href
        : null;
    } catch {
      return null;
    }
  }

  // Looks like "domain.com/path" â€” try adding https://
  if (trimmed.includes(".") && !trimmed.includes(" ")) {
    try {
      const parsed = new URL(`https://${trimmed}`);
      const host = parsed.hostname.replace(/^www\./, "");
      if (ALLOWED_SOCIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
        return parsed.href;
      }
    } catch {
      // fall through to username handling
    }
  }

  // Plain username / handle â€” use fallback domain
  if (fallbackDomain && !trimmed.includes(" ")) {
    return `https://${fallbackDomain}/${encodeURIComponent(trimmed)}`;
  }

  return null;
}
import { OportunidadeModal } from "@/components/OportunidadeModal";
import { useRouter } from "next/navigation";
import { ConversaAvatar } from "./ConversaAvatar";
import { toast } from "sonner";

interface ContactPanelProps {
  contatoId: string | null;
  contato: any;
}

const etapaColors: Record<string, string> = {
  novo: "bg-blue-500/15 text-blue-500",
  contato_feito: "bg-yellow-500/15 text-yellow-500",
  proposta: "bg-purple-500/15 text-purple-500",
  negociacao: "bg-orange-500/15 text-orange-500",
  ganho: "bg-green-500/15 text-green-500",
  perdido: "bg-red-500/15 text-red-500",
};

type Sentimento = "positivo" | "neutro" | "negativo";
interface AnaliseIA {
  sentimento: Sentimento;
  score: number;
  resumo: string;
  topicos: string[];
}

export function ContactPanel({ contatoId, contato: contatoProp }: ContactPanelProps) {
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [oportunidade, setOportunidade] = useState<any>(null);
  const [showOppModal, setShowOppModal] = useState(false);
  const [classificacoes, setClassificacoes] = useState<string[]>([]);
  const [anotacao, setAnotacao] = useState("");
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeEditado, setNomeEditado] = useState("");
  const [contato, setContato] = useState<any>(contatoProp);
  const [analiseIA, setAnaliseIA] = useState<AnaliseIA | null>(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const router = useRouter();

  // Sync prop to local state
  useEffect(() => { setContato(contatoProp); }, [contatoProp]);

  const fetchAnalise = useCallback(async (id: string) => {
    setLoadingAnalise(true);
    try {
      const { data, error } = await supabase.functions.invoke("analisar-sentimento-conversa", {
        body: { contato_id: id },
      });
      if (!error && data) setAnaliseIA(data as AnaliseIA);
    } catch {
      // silencioso
    } finally {
      setLoadingAnalise(false);
    }
  }, []);

  useEffect(() => {
    if (!contatoId) return;

    const fetchCampanhas = async () => {
      const { data } = await supabase
        .from("lista_contato")
        .select("lista_id, listas!inner(id, campanhas(id, nome, tipo))")
        .eq("contato_id", contatoId)
        .limit(10);

      const camps: any[] = [];
      data?.forEach((lc: any) => {
        lc.listas?.campanhas?.forEach((c: any) => {
          if (!camps.find((x) => x.id === c.id)) camps.push(c);
        });
      });
      setCampanhas(camps);
    };

    const fetchOpp = async () => {
      const { data } = await supabase
        .from("oportunidades")
        .select("*")
        .eq("contato_id", contatoId)
        .order("data_criacao", { ascending: false })
        .limit(1)
        .maybeSingle();
      setOportunidade(data);
    };

    const fetchClassifs = async () => {
      const { data } = await supabase
        .from("interacoes")
        .select("classificacao_ia")
        .eq("contato_id", contatoId)
        .not("classificacao_ia", "is", null)
        .limit(50);
      const tags = [...new Set((data || []).map((r: any) => r.classificacao_ia).filter((t: string) => t && t !== "null"))];
      setClassificacoes(tags);
    };

    fetchCampanhas();
    fetchOpp();
    fetchClassifs();
    fetchAnalise(contatoId);
    setAnotacao("");
    setEditandoNome(false);
    setAnaliseIA(null);
  }, [contatoId, fetchAnalise]);

  const salvarAnotacao = async () => {
    if (!contatoId || !anotacao.trim()) return;
    if (oportunidade) {
      await supabase.from("oportunidades").update({ observacoes: anotacao }).eq("id", oportunidade.id);
      toast.success("AnotaÃ§Ã£o salva");
    }
  };

  const salvarNome = async () => {
    if (!contatoId || !nomeEditado.trim()) return;
    await supabase.from("contatos").update({ contato_nome: nomeEditado.trim() }).eq("id", contatoId);
    setContato((prev: any) => ({ ...prev, contato_nome: nomeEditado.trim() }));
    setEditandoNome(false);
    toast.success("Nome atualizado");
  };

  if (!contatoId || !contato) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">Selecione um contato</p>
      </div>
    );
  }

  const nome = contato.contato_nome || contato.nome_empresa || "Contato";

  const classifColors: Record<string, string> = {
    interesse: "bg-green-500/15 text-green-500",
    interessado: "bg-green-500/15 text-green-500",
    spam: "bg-red-500/15 text-red-500",
    nao_interesse: "bg-red-500/15 text-red-500",
    outro: "bg-muted text-muted-foreground",
  };

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {/* Header with avatar */}
        <div className="px-4 pt-6 pb-4 flex flex-col items-center text-center gap-1">
          <ConversaAvatar
            nome={nome}
            fotoUrl={contato.foto_url}
            tamanho={72}
            contatoId={contatoId || undefined}
            telefone={contato.telefone}
          />

          {/* Editable name */}
          <div className="mt-2 w-full">
            {editandoNome ? (
              <div className="flex items-center gap-1.5 justify-center">
                <Input
                  value={nomeEditado}
                  onChange={(e) => setNomeEditado(e.target.value)}
                  className="h-8 text-center text-base font-bold bg-muted/30 border-primary/30 focus-visible:ring-primary/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") salvarNome();
                    if (e.key === "Escape") setEditandoNome(false);
                  }}
                  autoFocus
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:text-green-600" onClick={salvarNome}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditandoNome(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 justify-center">
                <h3 className="text-base font-bold">{contato.contato_nome || contato.nome_empresa}</h3>
                <button
                  onClick={() => { setNomeEditado(contato.contato_nome || contato.nome_empresa || ""); setEditandoNome(true); }}
                  className="opacity-30 hover:opacity-70 transition-opacity"
                  title="Editar nome"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Show WhatsApp name if different */}
          {contato.nome_whatsapp && contato.nome_whatsapp !== (contato.contato_nome || contato.nome_empresa) && (
            <p className="text-[0.72rem] text-muted-foreground/40">
              WhatsApp: {contato.nome_whatsapp}
            </p>
          )}

          {contato.contato_nome && contato.nome_empresa && contato.contato_nome !== contato.nome_empresa && (
            <p className="text-xs text-muted-foreground/60">{contato.nome_empresa}</p>
          )}
          {contato.telefone && (
            <p className="text-[0.82rem] text-muted-foreground/70 flex items-center gap-1.5 mt-1">
              <Phone className="h-3 w-3" /> {contato.telefone}
            </p>
          )}
          {contato.email && (
            <p className="text-[0.78rem] text-muted-foreground/60 flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> <span className="truncate max-w-[180px]">{contato.email}</span>
            </p>
          )}
          {(contato.cidade || contato.estado) && (
            <p className="text-[0.78rem] text-muted-foreground/60 flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> {[contato.cidade, contato.estado].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        <Separator className="opacity-30" />

        {/* Social links */}
        {(contato.instagram || contato.facebook || contato.linkedin) && (
          <>
            <div className="px-4 py-3.5">
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2.5">Redes Sociais</p>
              <div className="flex flex-wrap gap-2">
                {contato.instagram && sanitizeSocialUrl(contato.instagram, "instagram.com") && (
                  <a href={sanitizeSocialUrl(contato.instagram, "instagram.com")!} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-pink-500 bg-pink-500/10 hover:bg-pink-500/20 px-2.5 py-1 rounded-full transition-colors">
                    <Instagram className="h-3 w-3" /> Instagram
                  </a>
                )}
                {contato.facebook && sanitizeSocialUrl(contato.facebook, "facebook.com") && (
                  <a href={sanitizeSocialUrl(contato.facebook, "facebook.com")!} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-full transition-colors">
                    <Facebook className="h-3 w-3" /> Facebook
                  </a>
                )}
              </div>
            </div>
            <Separator className="opacity-30" />
          </>
        )}

        {/* IA Classifications */}
        {classificacoes.length > 0 && (
          <>
            <div className="px-4 py-3.5">
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2.5">ClassificaÃ§Ãµes</p>
              <div className="flex flex-wrap gap-1.5">
                {classificacoes.map((tag) => (
                  <span key={tag} className={`text-[0.65rem] font-semibold px-2 py-[2px] rounded-full ${classifColors[tag] || "bg-muted text-muted-foreground"}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Separator className="opacity-30" />
          </>
        )}

        {/* IA Analysis: Sentiment + Summary */}
        {(loadingAnalise || analiseIA) && (
          <>
            <div className="px-4 py-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                  <p className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground/40">AnÃ¡lise IA</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-muted-foreground/40 hover:text-emerald-600"
                  disabled={loadingAnalise}
                  onClick={() => contatoId && fetchAnalise(contatoId)}
                >
                  <RefreshCw className={`h-3 w-3 ${loadingAnalise ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {loadingAnalise && !analiseIA ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/50 animate-pulse">
                  <Sparkles className="h-3 w-3" /> Analisando conversa...
                </div>
              ) : analiseIA ? (
                <div className="space-y-2.5">
                  {/* Sentiment badge */}
                  <div className="flex items-center gap-2">
                    {analiseIA.sentimento === "positivo" && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 text-green-600 text-xs font-semibold">
                        <TrendingUp className="h-3 w-3" /> Positivo
                      </div>
                    )}
                    {analiseIA.sentimento === "neutro" && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-600 text-xs font-semibold">
                        <Minus className="h-3 w-3" /> Neutro
                      </div>
                    )}
                    {analiseIA.sentimento === "negativo" && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 text-red-600 text-xs font-semibold">
                        <TrendingDown className="h-3 w-3" /> Negativo
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {analiseIA.resumo && (
                    <p className="text-[0.75rem] text-muted-foreground/70 leading-relaxed">
                      {analiseIA.resumo}
                    </p>
                  )}

                  {/* Topics */}
                  {analiseIA.topicos.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {analiseIA.topicos.map((t) => (
                        <span key={t} className="text-[0.62rem] font-medium px-2 py-[2px] rounded-full bg-muted/60 text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <Separator className="opacity-30" />
          </>
        )}

        {/* Campaigns */}
        <div className="px-4 py-3.5">
          <p className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2.5">Campanhas</p>
          {campanhas.length === 0 ? (
            <p className="text-[0.78rem] text-muted-foreground/40 italic">Nenhuma campanha</p>
          ) : (
            <div className="space-y-0.5">
              {campanhas.map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/campanhas/${c.id}`)}
                  className="w-full text-left flex items-center justify-between py-1.5 text-xs hover:text-primary transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{c.nome}</span>
                  </div>
                  <span className="text-[0.75rem] text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Ver â†’</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator className="opacity-30" />

        {/* CRM */}
        <div className="px-4 py-3.5">
          <p className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2.5">CRM</p>
          {oportunidade ? (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[0.7rem] text-muted-foreground">Etapa:</span>
                  <Badge className={etapaColors[oportunidade.etapa] || "bg-muted text-muted-foreground"}>
                    {oportunidade.etapa}
                  </Badge>
                </div>
                {oportunidade.valor_estimado && (
                  <span className="text-xs font-bold">ðŸ’° R$ {Number(oportunidade.valor_estimado).toLocaleString("pt-BR")}</span>
                )}
              </div>
              {oportunidade.observacoes && (
                <p className="text-[0.75rem] text-muted-foreground/70 line-clamp-2">{oportunidade.observacoes}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs text-primary" onClick={() => router.push("/crm")}>
                  Ver no CRM â†’
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-9 text-xs bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
              onClick={() => setShowOppModal(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar ao CRM
            </Button>
          )}
        </div>

        <Separator className="opacity-30" />

        {/* Internal notes */}
        <div className="px-4 py-3.5">
          <p className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2.5">AnotaÃ§Ãµes Internas</p>
          <Textarea
            className="text-[0.82rem] min-h-[80px] bg-muted/20 border-border/30 resize-none focus:border-primary/40"
            placeholder="Notas sobre este contato (visÃ­vel sÃ³ para vocÃª)..."
            value={anotacao}
            onChange={(e) => setAnotacao(e.target.value)}
            onBlur={salvarAnotacao}
            rows={4}
          />
          <p className="text-[0.68rem] text-muted-foreground/30 text-right mt-1">Salvo automaticamente</p>
        </div>
      </div>

      {showOppModal && (
        <OportunidadeModal
          open={showOppModal}
          onOpenChange={setShowOppModal}
          opportunity={{ contato_id: contatoId }}
          onSuccess={() => {
            setShowOppModal(false);
            supabase.from("oportunidades").select("*").eq("contato_id", contatoId!).order("data_criacao", { ascending: false }).limit(1).maybeSingle()
              .then(({ data }) => setOportunidade(data));
          }}
        />
      )}
    </ScrollArea>
  );
}
