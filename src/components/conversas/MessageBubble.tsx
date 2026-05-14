import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Check, CheckCheck, Clock, AlertTriangle, Play, Pause, Download,
  MapPin, FileText, AlertCircle, Pencil, Smile, X, Check as CheckIcon,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: {
    id: string;
    conteudo: string;
    direcao: string;
    data: string;
    tipo_midia: string;
    classificacao_ia: string | null;
    provider_message_id: string | null;
    editado_em?: string | null;
    conteudo_original?: string | null;
  };
  accountId?: string | null;
  reactions?: { emoji: string; is_from_me: boolean }[];
  onReactionAdded?: () => void;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const EDIT_WINDOW_MS = 15 * 60 * 1000;

// ──────────────────────────────────────────────────────────────
// Audio Player
// ──────────────────────────────────────────────────────────────
function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const maxTimeRef = useRef(0);

  const setValidDuration = (val: number) => {
    if (val && isFinite(val) && val > 0) setDuration(val);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  const cycleSpeed = () => {
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const formatTime = (s: number) => {
    if (!isFinite(s) || isNaN(s) || s < 0) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[220px] max-w-[280px]">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            const ct = audioRef.current.currentTime;
            setProgress(ct);
            if (ct > maxTimeRef.current) maxTimeRef.current = ct;
          }
        }}
        onLoadedMetadata={() => { if (audioRef.current) setValidDuration(audioRef.current.duration); }}
        onDurationChange={() => { if (audioRef.current) setValidDuration(audioRef.current.duration); }}
        onEnded={() => {
          setPlaying(false);
          if (duration === 0 && maxTimeRef.current > 0) setDuration(maxTimeRef.current);
        }}
      />
      <div
        className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 cursor-pointer shadow-sm active:scale-95 transition-transform"
        onClick={togglePlay}
      >
        {playing ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
      </div>
      <div className="flex-1 space-y-1">
        <div
          className="h-[18px] flex items-center gap-[2px] cursor-pointer"
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
          }}
        >
          {Array.from({ length: 30 }).map((_, i) => {
            const heights = [4, 8, 12, 6, 14, 8, 10, 5, 16, 7, 12, 9, 6, 14, 10, 8, 5, 12, 7, 16, 9, 11, 6, 13, 8, 10, 5, 14, 7, 9];
            const pct = duration ? (progress / duration) * 100 : 0;
            const filled = (i / 30) * 100 < pct;
            return (
              <div
                key={i}
                className={cn("w-[2px] rounded-full transition-colors", filled ? "bg-[#25D366]" : "bg-gray-300 dark:bg-gray-600")}
                style={{ height: `${heights[i] || 8}px` }}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 font-medium tabular-nums">{formatTime(progress)} / {formatTime(duration || 0)}</span>
          <button onClick={cycleSpeed} className="text-[10px] font-bold text-gray-400 hover:text-gray-700">{speed}x</button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Media renderer
// ──────────────────────────────────────────────────────────────
interface MediaParsed {
  url?: string; URL?: string; type?: string; Type?: string;
  caption?: string; Caption?: string; filename?: string;
  fileName?: string; Filename?: string; mimetype?: string;
  lat?: number; lng?: number;
}

function MediaWithFallback({ parsed, isSent }: { parsed: MediaParsed; isSent: boolean }) {
  const [failed, setFailed] = useState(false);
  const [videoModal, setVideoModal] = useState(false);

  const url = parsed.url || parsed.URL || "";
  const type = parsed.type || parsed.Type || "image";
  const caption = parsed.caption || parsed.Caption || "";
  const filename = parsed.filename || parsed.fileName || parsed.Filename || "Documento";

  if (type === "image") {
    if (failed || !url) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-black/10 text-sm text-gray-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Imagem indisponível</span>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <img src={url} alt={caption || "imagem"} className="max-w-full rounded-lg cursor-pointer object-cover shadow-sm hover:opacity-95 transition-opacity" onClick={() => window.open(url, "_blank")} onError={() => setFailed(true)} />
        {caption && <p className="text-[14.5px] mt-1 text-gray-800 dark:text-gray-100">{caption}</p>}
      </div>
    );
  }

  if (type === "video") {
    return (
      <>
        <div className="relative max-w-[280px] rounded-lg overflow-hidden cursor-pointer group" onClick={() => setVideoModal(true)}>
          <video src={url} className="w-full rounded-lg max-h-[200px] object-cover" muted preload="metadata" onError={() => setFailed(true)} />
          {!failed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="h-12 w-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center scale-90 group-hover:scale-100 transition-transform">
                <Play className="h-6 w-6 ml-0.5 text-[#54656f]" />
              </div>
            </div>
          )}
        </div>
        {caption && <p className="text-[14.5px] mt-1 text-gray-800 dark:text-gray-100">{caption}</p>}
        {videoModal && (
          <Dialog open onOpenChange={() => setVideoModal(false)}>
            <DialogContent className="max-w-4xl p-0 bg-black border-none overflow-hidden">
              <video src={url} controls autoPlay className="w-full max-h-[85vh]" />
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  if (type === "document") {
    return (
      <a href={url} target="_blank" rel="noopener" className={cn("flex items-center gap-3 p-3 rounded-lg min-w-[220px] transition-colors", isSent ? "bg-emerald-600/10 hover:bg-emerald-600/20" : "bg-gray-100 hover:bg-gray-200")}>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm", isSent ? "bg-emerald-600" : "bg-primary")}>
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium truncate text-gray-800 dark:text-gray-200">{filename}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{parsed.mimetype?.split("/")[1]?.toUpperCase() || "FILE"}</p>
        </div>
        <Download className="h-4 w-4 text-gray-400 shrink-0" />
      </a>
    );
  }

  if (type === "audio") return <AudioPlayer url={url} />;

  if (type === "location") {
    return (
      <a href={`https://maps.google.com/?q=${parsed.lat},${parsed.lng}`} target="_blank" rel="noopener"
        className="flex items-center gap-3 p-2 text-[14px] hover:bg-black/5 rounded-lg border border-border/20">
        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5 text-red-500" />
        </div>
        <span className="font-medium text-blue-600 underline">Ver Localização</span>
      </a>
    );
  }

  return null;
}

function isOnlyEmojis(str: string) {
  const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]){1,3}$/;
  return emojiRegex.test(str.trim());
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────
export function MessageBubble({ message, accountId, reactions = [], onReactionAdded }: MessageBubbleProps) {
  const isSent = message.direcao === "enviado";
  const isError = message.id.startsWith("error-");
  const isPending = isSent && !isError && !message.provider_message_id;
  const isEdited = !!message.editado_em;

  const [isHovered, setIsHovered] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(message.conteudo);
  const [isSaving, setIsSaving] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);

  const canEdit = isSent && !isError && !isEdited &&
    (!message.tipo_midia || message.tipo_midia === "texto") &&
    (Date.now() - new Date(message.data).getTime()) < EDIT_WINDOW_MS;

  // Grouped reactions
  const groupedReactions = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  let parsed: MediaParsed | null = null;
  try { parsed = JSON.parse(message.conteudo) as MediaParsed; } catch { /* ignore */ }

  const isUnsupportedBinary = !parsed && message.conteudo.length > 500 && !message.conteudo.includes(" ");

  // ── Edit save ──
  const handleEditSave = async () => {
    if (!editText.trim() || editText === message.conteudo) { setEditMode(false); return; }
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("editar-mensagem-chat", {
        body: { interacao_id: message.id, novo_conteudo: editText.trim() },
      });
      if (error || !data?.sucesso) {
        toast.error(data?.error || "Erro ao editar mensagem");
      } else {
        toast.success("Mensagem editada");
        setEditMode(false);
      }
    } catch {
      toast.error("Erro ao editar mensagem");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reaction send ──
  const handleReaction = async (emoji: string) => {
    setReactionOpen(false);
    if (!accountId) return;
    await supabase.from("interacao_reactions" as any).upsert({
      interacao_id: message.id,
      account_id: accountId,
      emoji,
      is_from_me: true,
    }, { onConflict: "interacao_id,account_id,is_from_me" });
    onReactionAdded?.();
  };

  // ── Content renderer ──
  const renderContent = () => {
    if (parsed && (parsed.type || parsed.Type || parsed.url || parsed.URL)) {
      if ((parsed.type || parsed.Type) === "sticker") return null;
      return <MediaWithFallback parsed={parsed} isSent={isSent} />;
    }
    if (isUnsupportedBinary) {
      return (
        <div className="flex items-center gap-2 text-sm opacity-60 italic">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>Mídia não suportada</span>
        </div>
      );
    }
    const onlyEmojis = isOnlyEmojis(message.conteudo);
    return (
      <p className={cn("whitespace-pre-wrap break-words leading-[1.3]", onlyEmojis ? "text-[40px] py-1" : "text-[14.5px] text-gray-800 dark:text-gray-100")}>
        {message.conteudo}
      </p>
    );
  };

  const isSticker = (parsed?.type || parsed?.Type) === "sticker";
  if (isSticker) {
    const url = parsed?.url || parsed?.URL;
    return (
      <div className={cn("flex mb-2 group relative", isSent ? "justify-end" : "justify-start")}>
        <div className="relative">
          <img src={url} alt="sticker" className="w-[125px] h-[125px] object-contain" />
          <span className="absolute bottom-0 right-0 text-[10px] text-gray-400 bg-white/60 dark:bg-black/30 px-1 rounded backdrop-blur-[2px]">
            {message.data ? format(new Date(message.data), "HH:mm") : ""}
          </span>
        </div>
      </div>
    );
  }

  const timeString = message.data ? format(new Date(message.data), "HH:mm") : "";
  const onlyEmojis = isOnlyEmojis(message.conteudo) && !parsed;

  return (
    <div
      className={cn("flex mb-[2px] w-full px-2 md:px-0 relative", isSent ? "justify-end" : "justify-start")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover actions */}
      {isHovered && !editMode && (
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-20",
          isSent ? "left-0 translate-x-[-100%] -ml-1 pr-1" : "right-0 translate-x-[100%] ml-1 pl-1"
        )}>
          {/* Reaction button */}
          <Popover open={reactionOpen} onOpenChange={setReactionOpen}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost"
                className="h-7 w-7 rounded-full bg-white dark:bg-[#202c33] shadow border border-border/30 hover:bg-accent">
                <Smile className="h-4 w-4 text-[#54656f]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1.5" align="center" side="top">
              <div className="flex gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button key={emoji} onClick={() => handleReaction(emoji)}
                    className="h-9 w-9 flex items-center justify-center text-xl rounded-lg hover:bg-accent transition-colors">
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Edit button (only for sent texts within 15 min) */}
          {canEdit && (
            <Button size="icon" variant="ghost" onClick={() => { setEditText(message.conteudo); setEditMode(true); }}
              className="h-7 w-7 rounded-full bg-white dark:bg-[#202c33] shadow border border-border/30 hover:bg-accent">
              <Pencil className="h-3.5 w-3.5 text-[#54656f]" />
            </Button>
          )}
        </div>
      )}

      <div className={cn("relative max-w-[85%] md:max-w-[65%] min-w-[80px]")}>
        {/* Edit mode */}
        {editMode ? (
          <div className={cn(
            "rounded-[7.5px] px-[9px] pt-[6px] pb-[8px] shadow-[0_1px_0.5px_rgba(11,20,26,.13)]",
            isSent ? "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-[0px]" : "bg-white dark:bg-[#202c33] rounded-tl-[0px]"
          )}>
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
                if (e.key === "Escape") setEditMode(false);
              }}
              className="min-h-[36px] text-[14.5px] text-gray-800 dark:text-gray-100 bg-transparent border-none focus-visible:ring-0 p-0 resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-1.5 mt-1">
              <Button size="icon" variant="ghost" onClick={() => setEditMode(false)}
                className="h-6 w-6 rounded-full hover:bg-red-500/10 text-red-500">
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleEditSave} disabled={isSaving}
                className="h-6 w-6 rounded-full hover:bg-emerald-500/10 text-emerald-600">
                <CheckIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn(
            !onlyEmojis && "shadow-[0_1px_0.5px_rgba(11,20,26,.13)] px-[9px] pt-[6px] pb-[8px]",
            !onlyEmojis && (isSent
              ? "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-[7.5px] rounded-tr-[0px]"
              : "bg-white dark:bg-[#202c33] rounded-[7.5px] rounded-tl-[0px]"),
            isError && "border border-red-400"
          )}>
            {renderContent()}

            {!onlyEmojis && (
              <div className="flex items-center gap-1 mt-1 float-right ml-2 -mb-1 pointer-events-none">
                {isEdited && (
                  <span className="text-[10px] italic text-[#667781] dark:text-[#8696a0]/80 mr-0.5">editado</span>
                )}
                <span className="text-[10.5px] text-[#667781] dark:text-[#8696a0]/80 font-medium tabular-nums leading-none">{timeString}</span>
                {isSent && (
                  isPending
                    ? <Clock className="h-3 w-3 text-gray-400" />
                    : isError
                      ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      : <CheckCheck className="h-4 w-4 text-[#53bdeb] transition-colors" />
                )}
              </div>
            )}
            {!onlyEmojis && <div className="clear-both" />}

            {/* WhatsApp tails */}
            {!onlyEmojis && (
              isSent ? (
                <svg className="absolute -right-[8px] top-0 w-[8px] h-[13px] text-[#d9fdd3] dark:text-[#005c4b]" viewBox="0 0 8 13" fill="currentColor">
                  <path opacity=".13" d="M5.188 1H8v11.186l-2.813-3.365C4.249 7.689 3.284 7.158 2.086 7.158H1V1h4.188z" />
                  <path d="M5.188 0H0v11.186l2.813-3.365C3.751 6.689 4.716 6.158 5.914 6.158H8V0z" />
                </svg>
              ) : (
                <svg className="absolute -left-[8px] top-0 w-[8px] h-[13px] text-white dark:text-[#202c33]" viewBox="0 0 8 13" fill="currentColor">
                  <path opacity=".13" d="M1.533 3.118C2.815 3.118 3.864 3.65 4.887 4.542L8 8.1v3.086h-1V1H1.533z" />
                  <path d="M1.533 2.118C2.815 2.118 3.864 2.65 4.887 3.542L8 7.1v3.086h-1V0H1.533z" />
                </svg>
              )
            )}
          </div>
        )}

        {/* Reactions display */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {Object.entries(groupedReactions).map(([emoji, count]) => (
              <span key={emoji}
                className="px-1.5 py-0.5 bg-white dark:bg-[#202c33] rounded-full text-xs flex items-center gap-0.5 border border-border/30 shadow-sm cursor-default"
                title={`${count} reação${count > 1 ? "ões" : ""}`}>
                <span className="text-sm leading-none">{emoji}</span>
                {count > 1 && <span className="text-[10px] text-muted-foreground font-medium">{count}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
