import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// ─── Tipos estritos inferidos do schema do banco ─────────────────────────────
type ListaContatoRow = Database["public"]["Tables"]["lista_contato"]["Row"];
type ContatoRow = Database["public"]["Tables"]["contatos"]["Row"];

// Shape do retorno enriquecido pela RPC (contato + duplicatas)
export interface ListaContatoEnriquecido extends ListaContatoRow {
  contatos: ContatoRow;
  outras_listas: string[];
}

// ─── Tipos dos estados de progresso ──────────────────────────────────────────
export interface ValidationProgress {
  current: number;
  total: number;
  invalid: number;
  totalPending: number;
  batchSize: number;
  batchesProcessed: number;
  status: "idle" | "validating" | "done" | "error";
  message: string;
  erros: number;
  valid: number;
}

export interface AutoSearchProgress {
  status: "idle" | "running" | "done" | "cancelled";
  currentQuery: string;
  totalQueries: number;
  completedQueries: number;
  totalNovos: number;
  totalDuplicados: number;
}

export interface SearchProgress {
  queryAtual: string | null;
  queriesRestantes: number;
  todasUsadas: boolean;
}

export interface EnrichmentProgress {
  status: "idle" | "running" | "done";
  current: number;
  total: number;
  successCount: number;
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useListaContatos(listaId: string | undefined) {
  const queryClient = useQueryClient();
  const abortSearchRef = useRef<boolean>(false);

  // ─── Estado de progresso ────────────────────────────────────────────────
  const [validationProgress, setValidationProgress] = useState<ValidationProgress>({
    current: 0, total: 0, invalid: 0, totalPending: 0,
    batchSize: 50, batchesProcessed: 0, status: "idle",
    message: "", erros: 0, valid: 0,
  });

  const [searchProgress, setSearchProgress] = useState<SearchProgress>({
    queryAtual: null, queriesRestantes: 12, todasUsadas: false,
  });

  const [autoSearchProgress, setAutoSearchProgress] = useState<AutoSearchProgress>({
    status: "idle", currentQuery: "", totalQueries: 12,
    completedQueries: 0, totalNovos: 0, totalDuplicados: 0,
  });

  const [enrichmentProgress, setEnrichmentProgress] = useState<EnrichmentProgress>({
    status: "idle", current: 0, total: 0, successCount: 0,
  });

  // ─── Query: dados da lista ──────────────────────────────────────────────
  const { data: lista, isLoading: loadingLista } = useQuery({
    queryKey: ["lista", listaId],
    queryFn: async () => {
      if (!listaId) return null;
      const { data, error } = await supabase
        .from("listas")
        .select("*")
        .eq("id", listaId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!listaId,
  });

  // Sincroniza progresso de buscas com o BD
  useEffect(() => {
    if (!lista) return;
    const usadas = lista.google_queries_usadas?.length ?? 0;
    const restantes = Math.max(0, 12 - usadas);
    setSearchProgress({
      queryAtual: lista.google_queries_usadas?.[usadas - 1] ?? null,
      queriesRestantes: restantes,
      todasUsadas: restantes === 0,
    });
  }, [lista]);

  // ─── Query: contatos via RPC paginado ──────────────────────────────────
  // Substitui o while(hasMore) que carregava até 50k registros no frontend
  const { data: contatos, refetch, isLoading: loadingContatos } = useQuery({
    queryKey: ["lista-contatos", listaId],
    queryFn: async (): Promise<ListaContatoEnriquecido[]> => {
      if (!listaId) return [];

      const PAGE_SIZE = 500;
      let page = 0;
      let allContatos: ListaContatoEnriquecido[] = [];
      let hasMore = true;

      // A RPC retorna os dados já com outras_listas calculadas no banco
      // Evitando o loop de N queries de duplicatas no cliente
      while (hasMore) {
        const { data, error } = await supabase.rpc(
          "get_lista_contatos_com_duplicatas",
          {
            p_lista_id: listaId,
            p_offset: page * PAGE_SIZE,
            p_limit: PAGE_SIZE,
          }
        );

        if (error) throw error;

        const batch = data as { contato_id: string; id: string; lista_id: string; status_whatsapp: string | null; telefone_normalizado: string | null; mensagem_enviada: boolean | null; fonte_busca: string | null; created_at: string | null; outras_listas: string[] }[];

        if (!batch || batch.length === 0) {
          hasMore = false;
          break;
        }

        // Buscar dados do contato em um único batch para a página
        const contatoIds = batch.map((b) => b.contato_id);
        const { data: contatosData, error: contatosError } = await supabase
          .from("contatos")
          .select("*")
          .in("id", contatoIds);

        if (contatosError) throw contatosError;

        const contatoMap = new Map<string, ContatoRow>(
          (contatosData ?? []).map((c) => [c.id, c])
        );

        const pagina: ListaContatoEnriquecido[] = batch.map((item) => ({
          id: item.id,
          lista_id: item.lista_id,
          contato_id: item.contato_id,
          status_whatsapp: item.status_whatsapp,
          telefone_normalizado: item.telefone_normalizado,
          mensagem_enviada: item.mensagem_enviada,
          fonte_busca: item.fonte_busca,
          created_at: item.created_at,
          account_id: null,
          status_na_lista: null,
          whatsapp_validado_em: null,
          contatos: contatoMap.get(item.contato_id) as ContatoRow,
          outras_listas: item.outras_listas ?? [],
        }));

        allContatos = [...allContatos, ...pagina];

        if (batch.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          page++;
        }

        // Válvula de segurança: 50 páginas × 500 = 25k registros max
        if (page > 50) break;
      }

      return allContatos;
    },
    enabled: !!listaId,
  });

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleBuscaAutomaticaInternal = useCallback(
    async (isUpdate: boolean) => {
      setAutoSearchProgress({
        status: "running", currentQuery: "",
        totalQueries: searchProgress.queriesRestantes || 12,
        completedQueries: 0, totalNovos: 0, totalDuplicados: 0,
      });

      let queriesProcessadas = 0;
      let totalNovos = 0;
      let totalDuplicados = 0;
      let todasUsadas = false;
      let loopCount = 0;

      while (!todasUsadas && !abortSearchRef.current) {
        loopCount++;
        if (loopCount > 25) break;

        try {
          const { data, error } = await supabase.functions.invoke(
            "buscar-empresas-google-maps",
            { body: { lista_id: listaId } }
          );

          if (error) throw error;

          queriesProcessadas++;
          totalNovos += (data.novos_adicionados as number) || 0;
          totalDuplicados += (data.duplicados as number) || 0;
          todasUsadas = data.todas_queries_usadas as boolean;

          setAutoSearchProgress((prev) => ({
            ...prev,
            currentQuery: (data.query_utilizada as string) || "",
            completedQueries: queriesProcessadas,
            totalQueries: queriesProcessadas + ((data.queries_restantes as number) || 0),
            totalNovos,
            totalDuplicados,
          }));

          setSearchProgress({
            queryAtual: data.query_utilizada as string,
            queriesRestantes: (data.queries_restantes as number) ?? 0,
            todasUsadas: (data.todas_queries_usadas as boolean) ?? false,
          });

          if (!todasUsadas && !abortSearchRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Erro na busca";
          throw new Error(message);
        }
      }

      setAutoSearchProgress((prev) => ({
        ...prev,
        status: abortSearchRef.current ? "cancelled" : "done",
      }));

      await refetch();
      return { totalNovos, isUpdate };
    },
    [listaId, refetch, searchProgress.queriesRestantes]
  );

  const handleBuscaAutomatica = useCallback(async () => {
    abortSearchRef.current = false;
    return handleBuscaAutomaticaInternal(false);
  }, [handleBuscaAutomaticaInternal]);

  const handleAtualizarLista = useCallback(async () => {
    abortSearchRef.current = false;
    await supabase
      .from("listas")
      .update({ google_queries_usadas: [] })
      .eq("id", listaId!);

    setSearchProgress({ queryAtual: null, queriesRestantes: 12, todasUsadas: false });
    return handleBuscaAutomaticaInternal(true);
  }, [listaId, handleBuscaAutomaticaInternal]);

  const handleCancelarBusca = useCallback(() => {
    abortSearchRef.current = true;
    setAutoSearchProgress((prev) => ({ ...prev, status: "cancelled" }));
  }, []);

  const handleResetarErros = useCallback(
    async (listaIdParam: string) => {
      const erroCount =
        contatos?.filter((c) => c.status_whatsapp === "erro").length ?? 0;
      if (erroCount === 0) return { erroCount: 0 };

      const { error } = await supabase
        .from("lista_contato")
        .update({ status_whatsapp: "nao_validado", whatsapp_validado_em: null })
        .eq("lista_id", listaIdParam)
        .eq("status_whatsapp", "erro");

      if (error) throw error;
      await refetch();
      return { erroCount };
    },
    [contatos, refetch]
  );

  const handleValidarWhatsApp = useCallback(
    async (forceRevalidate: boolean): Promise<{ validCount: number; invalidCount: number }> => {
      const pendingCount =
        contatos?.filter(
          (item) =>
            !item.status_whatsapp ||
            item.status_whatsapp === "nao_validado" ||
            item.status_whatsapp === "erro" ||
            !item.telefone_normalizado
        ).length ?? 0;

      const revalidateCount = forceRevalidate
        ? (contatos?.filter((i) => i.status_whatsapp !== "telefone_invalido").length ?? 0)
        : pendingCount;

      if (revalidateCount === 0) return { validCount: 0, invalidCount: 0 };

      setValidationProgress({
        current: 0, total: revalidateCount, invalid: 0,
        totalPending: revalidateCount, batchSize: 50, batchesProcessed: 0,
        status: "validating", message: "Iniciando validação...", erros: 0, valid: 0,
      });

      let processedCount = 0;
      let validCount = 0;
      let invalidCount = 0;
      let errorCount = 0;
      let hasMore = true;
      let attempt = 0;
      let lastRemaining = revalidateCount;
      let noProgressCount = 0;

      while (hasMore) {
        attempt++;
        setValidationProgress((prev) => ({
          ...prev,
          message: `Validando lote ${attempt}... (${processedCount}/${revalidateCount})`,
        }));

        const { data, error } = await supabase.functions.invoke(
          "validar-whatsapp-lote",
          { body: { lista_id: listaId, force: forceRevalidate, limit: 50 } }
        );

        if (error) throw error;

        if (data && (data as { success: boolean }).success === false) {
          const errData = data as { error: string; message?: string; details?: string };
          if (errData.error === "API_NAO_SUPORTA_VALIDACAO") {
            setValidationProgress((prev) => ({
              ...prev, status: "error",
              message: errData.message || "A API não suporta validação.",
            }));
            await refetch();
            return { validCount, invalidCount };
          }
          throw new Error(errData.message || "Erro retornado pela API.");
        }

        const batchData = data as {
          remaining?: number; processed?: number; hasMore?: boolean;
          validos?: number; invalidos?: number; erros?: number;
          diagnostico?: { updates_sucesso?: number; retornados_api?: number };
        };

        const currentRemaining = batchData.remaining ?? 0;
        const currentProcessed = batchData.processed ?? 0;

        if (currentProcessed > 0 && currentRemaining >= lastRemaining) {
          noProgressCount++;
          if (noProgressCount >= 10) {
            throw new Error("Processo travado. Verifique se o WhatsApp está conectado.");
          }
        } else if (currentProcessed > 0) {
          noProgressCount = 0;
        }

        lastRemaining = currentRemaining;
        processedCount = revalidateCount - currentRemaining;
        validCount += batchData.validos ?? 0;
        invalidCount += batchData.invalidos ?? 0;
        errorCount += batchData.erros ?? 0;
        hasMore = (batchData.hasMore ?? false) && (currentProcessed > 0 || currentRemaining > 0);

        if (currentProcessed === 0 && currentRemaining === 0) hasMore = false;

        setValidationProgress((prev) => ({
          ...prev,
          current: processedCount,
          valid: validCount,
          invalid: invalidCount,
          erros: errorCount,
        }));

        await refetch();
        if (hasMore) await new Promise((r) => setTimeout(r, 1000));
      }

      setValidationProgress((prev) => ({
        ...prev, status: "done", message: "Validação concluída!",
      }));

      return { validCount, invalidCount };
    },
    [contatos, listaId, refetch]
  );

  const handleEnriquecer = useCallback(
    async (): Promise<{ successCount: number; errorCount: number }> => {
      const comWebsite = contatos?.filter(
        (item) => item.contatos?.website?.trim()
      ) ?? [];

      if (comWebsite.length === 0) return { successCount: 0, errorCount: 0 };

      setEnrichmentProgress({
        status: "running", current: 0, total: comWebsite.length, successCount: 0,
      });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < comWebsite.length; i++) {
        const item = comWebsite[i];
        try {
          const { data, error } = await supabase.functions.invoke("enriquecer-contato", {
            body: { contato_id: item.contato_id, website: item.contatos.website },
          });

          const result = data as { sucesso?: boolean } | null;
          if (!error && result?.sucesso) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }

        setEnrichmentProgress((prev) => ({ ...prev, current: i + 1, successCount }));
        if (i < comWebsite.length - 1) {
          await new Promise((r) => setTimeout(r, 7000));
        }
      }

      setEnrichmentProgress((prev) => ({ ...prev, status: "done" }));
      await refetch();
      return { successCount, errorCount };
    },
    [contatos, refetch]
  );

  const invalidateContatos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["lista-contatos", listaId] });
  }, [queryClient, listaId]);

  return {
    // Data
    lista, contatos, loadingLista, loadingContatos, refetch,
    // Progress states
    validationProgress, setValidationProgress,
    searchProgress, setSearchProgress,
    autoSearchProgress, setAutoSearchProgress,
    enrichmentProgress, setEnrichmentProgress,
    // Actions
    handleBuscaAutomatica,
    handleAtualizarLista,
    handleCancelarBusca,
    handleValidarWhatsApp,
    handleResetarErros,
    handleEnriquecer,
    invalidateContatos,
  };
}
