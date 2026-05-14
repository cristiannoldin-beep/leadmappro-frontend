// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  text: string;
  tone: "formal" | "amigavel" | "direto";
}

interface SmartReplySuggestionsProps {
  contatoId: string | null;
  onSelect: (text: string) => void;
}

const toneConfig = {
  formal: {
    label: "Formal",
    border: "border-blue-500/50",
    badge: "bg-blue-500 text-white hover:bg-blue-600",
  },
  amigavel: {
    label: "AmigÃ¡vel",
    border: "border-emerald-500/50",
    badge: "bg-emerald-500 text-white hover:bg-emerald-600",
  },
  direto: {
    label: "Direto",
    border: "border-orange-500/50",
    badge: "bg-orange-500 text-white hover:bg-orange-600",
  },
};

export function SmartReplySuggestions({ contatoId, onSelect }: SmartReplySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSuggestions = useCallback(async (isRefresh = false) => {
    if (!contatoId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("sugerir-respostas-chat", {
        body: { contato_id: contatoId },
      });
      if (!error && data?.suggestions?.length) {
        setSuggestions(data.suggestions);
      }
    } catch {
      // silencioso â€” nÃ£o interrompe o fluxo
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  }, [contatoId]);

  useEffect(() => {
    setSuggestions([]);
    if (contatoId) fetchSuggestions(false);
  }, [contatoId]);

  if (!loading && suggestions.length === 0) return null;

  return (
    <div className="border-t border-[#e9edef] dark:border-[#2a3942] bg-[#f0f2f5] dark:bg-[#202c33] px-3 py-2">
      <div className="flex items-center gap-2 mb-1.5">
        <Sparkles className="h-3 w-3 text-emerald-500" />
        <span className="text-[11px] font-semibold text-[#54656f] dark:text-[#8696a0] uppercase tracking-wide">
          SugestÃµes IA
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchSuggestions(true)}
          disabled={loading || refreshing}
          className="ml-auto h-6 w-6 p-0 text-[#54656f] hover:text-emerald-600"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-[#54656f] dark:text-[#8696a0] animate-pulse py-1">
          <Sparkles className="h-3 w-3" />
          <span>Gerando sugestÃµes...</span>
        </div>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-1">
            {suggestions.map((s, i) => {
              const cfg = toneConfig[s.tone] || toneConfig.direto;
              return (
                <TooltipProvider key={i}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => onSelect(s.text)}
                        className={`w-[175px] flex-shrink-0 p-2 rounded-xl cursor-pointer border-2 ${cfg.border} bg-white dark:bg-[#111b21] hover:bg-accent/20 transition-colors select-none`}
                      >
                        <Badge className={`text-[10px] px-1.5 py-0 ${cfg.badge} rounded-md`}>
                          {cfg.label}
                        </Badge>
                        <p className="mt-1 text-[12.5px] text-gray-700 dark:text-gray-200 line-clamp-2 break-words leading-[1.3]">
                          {s.text}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">{s.text}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
