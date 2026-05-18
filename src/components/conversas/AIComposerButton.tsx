// @ts-nocheck
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles, Maximize2, RefreshCw, User, Smile, Briefcase,
  CheckCircle2, Languages, Loader2, ChevronRight, ChevronLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ComposerAction = "expandir" | "reformular" | "meu_tom" | "amigavel" | "formal" | "gramatica" | "traduzir";

interface AIComposerButtonProps {
  message: string;
  onComposed: (text: string) => void;
  disabled?: boolean;
}

const menuOptions = [
  { id: "expandir" as ComposerAction, label: "Expandir", icon: Maximize2 },
  { id: "reformular" as ComposerAction, label: "Reformular", icon: RefreshCw },
  { id: "meu_tom" as ComposerAction, label: "Meu tom de voz", icon: User },
  { id: "amigavel" as ComposerAction, label: "Mais amigÃ¡vel", icon: Smile },
  { id: "formal" as ComposerAction, label: "Mais formal", icon: Briefcase },
  { id: "gramatica" as ComposerAction, label: "Corrigir gramÃ¡tica", icon: CheckCircle2 },
  {
    id: "traduzir" as ComposerAction, label: "Traduzir para...", icon: Languages,
    submenu: [
      { lang: "en", label: "InglÃªs" },
      { lang: "es", label: "Espanhol" },
      { lang: "fr", label: "FrancÃªs" },
      { lang: "de", label: "AlemÃ£o" },
      { lang: "it", label: "Italiano" },
    ],
  },
];

export function AIComposerButton({ message, onComposed, disabled }: AIComposerButtonProps) {
  const [open, setOpen] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: ComposerAction, targetLang?: string) => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const data = await api.post<{ mensagemMelhorada: string }>("/ia/melhorar-mensagem", {
        mensagem: message,
        acaoChat: action,
        idiomaDestino: targetLang,
      });

      onComposed(data.mensagemMelhorada);
      setOpen(false);
      setShowTranslate(false);
    } catch {
      toast.error("Erro ao conectar com a IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowTranslate(false); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || !message.trim() || loading}
          className="h-9 w-9 text-[#54656f] hover:text-emerald-600 hover:bg-emerald-500/10"
          title="Melhorar com IA"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2" align="start" side="top">
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processando com IA...
          </div>
        ) : showTranslate ? (
          <div className="space-y-1">
            <Button type="button" variant="ghost" size="sm"
              onClick={() => setShowTranslate(false)}
              className="w-full justify-start gap-2 text-sm">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
            <Separator />
            {menuOptions.find((o) => o.id === "traduzir")?.submenu?.map((lang) => (
              <Button key={lang.lang} type="button" variant="ghost" size="sm"
                onClick={() => handleAction("traduzir", lang.lang)}
                className="w-full justify-start gap-2 text-sm">
                <Languages className="h-4 w-4" />
                {lang.label}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {menuOptions.map((opt, idx) => (
              <div key={opt.id}>
                {(idx === 2 || idx === 5) && <Separator className="my-1" />}
                <Button type="button" variant="ghost" size="sm"
                  onClick={() => opt.submenu ? setShowTranslate(true) : handleAction(opt.id)}
                  className={cn("w-full text-sm gap-2", opt.submenu ? "justify-between" : "justify-start")}>
                  <div className="flex items-center gap-2">
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </div>
                  {opt.submenu && <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
