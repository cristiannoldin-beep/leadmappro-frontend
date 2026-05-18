// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── Tipos locais (sem dependência do Supabase) ───────────────────────────────
export interface ContatoData {
  id: string;
  nome_empresa: string;
  contato_nome?: string | null;
  telefone: string;
  cidade?: string | null;
  estado?: string | null;
  cnpj?: string | null;
  website?: string | null;
  gancho_personalizacao?: string | null;
  prova_social?: string | null;
}

export interface ListaContatoEnriquecido {
  id: string;
  lista_id: string;
  contato_id: string;
  status_whatsapp: string | null;
  mensagem_enviada: boolean | null;
  fonte_busca: string | null;
  created_at: string | null;
  contatos: ContatoData;
  outras_listas: string[];
}

export interface Lista {
  id: string;
  nome: string;
  origem: string;
  segmento?: string | null;
  cidade?: string | null;
  estado?: string | null;
  googleQueriesUsadas: string[];
  googleVariacoesIa: string[];
  createdAt: string;
  totalContatos: number;
}

// ── Tipos dos estados de progresso ───────────────────────────────────────────
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

// ── Hook principal ───────────────────────────────────────────────────────────
export function useListaContatos(listaId: string | undefined) {
  const queryClient = useQueryClient();
  const abortSearchRef = useRef<boolean>(false);

  // ── Estado de progresso ──────────────────────────────────────────────────
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

  // ── Query: dados da lista ────────────────────────────────────────────────
  const { data: lista, isLoading: loadingLista } = useQuery({
    queryKey: ["lista", listaId],
    queryFn: async (): Promise<Lista | null> => {
      if (!listaId) return null;
      const res = await api.get<{ lista: Lista }>(`/listas/${listaId}`);
      return res.lista;
    },
    enabled: !!listaId,
  });

  // Sincroniza progresso de buscas com o BD
  useEffect(() => {
    if (!lista) return;
    const usadas = lista.googleQueriesUsadas?.length ?? 0;
    const total = lista.googleVariacoesIa?.length ?? 12;
    const restantes = Math.max(0, total - usadas);
    setSearchProgress({
      queryAtual: lista.googleQueriesUsadas?.[usadas - 1] ?? null,
      queriesRestantes: restantes,
      todasUsadas: restantes === 0,
    });
  }, [lista]);

  // ── Query: contatos paginados ────────────────────────────────────────────
  const { data: contatos, refetch, isLoading: loadingContatos } = useQuery({
    queryKey: ["lista-contatos", listaId],
    queryFn: async (): Promise<ListaContatoEnriquecido[]> => {
      if (!listaId) return [];

      const PAGE_SIZE = 500;
      let page = 1;
      let all: ListaContatoEnriquecido[] = [];
      let hasMore = true;

      while (hasMore) {
        const res = await api.get<{
          contatos: ListaContatoEnriquecido[];
          hasMore: boolean;
          total: number;
        }>(`/listas/${listaId}/contatos?page=${page}&limit=${PAGE_SIZE}`);

        all = [...all, ...(res.contatos ?? [])];
        hasMore = res.hasMore ?? false;
        page++;

        if (page > 50) break; // válvula de segurança: 25k registros max
      }

      return all;
    },
    enabled: !!listaId,
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

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
          const data = await api.post<{
            inseridos: number;
            duplicados: number;
            queryUtilizada: string;
            queriesRestantes: number;
            todasQueriesUsadas: boolean;
          }>("/prospeccao/google-maps", { listaId });

          queriesProcessadas++;
          totalNovos += data.inseridos ?? 0;
          totalDuplicados += data.duplicados ?? 0;
          todasUsadas = data.todasQueriesUsadas ?? false;

          setAutoSearchProgress((prev) => ({
            ...prev,
            currentQuery: data.queryUtilizada ?? "",
            completedQueries: queriesProcessadas,
            totalQueries: queriesProcessadas + (data.queriesRestantes ?? 0),
            totalNovos,
            totalDuplicados,
          }));

          setSearchProgress({
            queryAtual: data.queryUtilizada ?? null,
            queriesRestantes: data.queriesRestantes ?? 0,
            todasUsadas: data.todasQueriesUsadas ?? false,
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
    await api.patch(`/listas/${listaId!}`, { googleQueriesUsadas: [] });
    setSearchProgress({ queryAtual: null, queriesRestantes: 12, todasUsadas: false });
    return handleBuscaAutomaticaInternal(true);
  }, [listaId, handleBuscaAutomaticaInternal]);

  const handleCancelarBusca = useCallback(() => {
    abortSearchRef.current = true;
    setAutoSearchProgress((prev) => ({ ...prev, status: "cancelled" }));
  }, []);

  const handleResetarErros = useCallback(
    async (listaIdParam: string) => {
      const erroCount = contatos?.filter((c) => c.status_whatsapp === "erro").length ?? 0;
      if (erroCount === 0) return { erroCount: 0 };
      await api.post(`/listas/${listaIdParam}/resetar-erros`, {});
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
            item.status_whatsapp === "erro"
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

        const data = await api.post<{
          processados: number;
          validos: number;
          invalidos: number;
          erros: number;
          remaining: number;
          hasMore: boolean;
        }>("/prospeccao/validar-whatsapp", {
          listaId: listaId!,
          force: forceRevalidate,
          limit: 50,
        });

        if (data.success === false) {
          setValidationProgress((prev) => ({
            ...prev, status: "error",
            message: data.message || "A API não suporta validação.",
          }));
          await refetch();
          return { validCount, invalidCount };
        }

        const currentRemaining = data.remaining ?? 0;
        const currentProcessed = data.processados ?? 0;

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
        validCount += data.validos ?? 0;
        invalidCount += data.invalidos ?? 0;
        errorCount += data.erros ?? 0;
        hasMore = (data.hasMore ?? false) && (currentProcessed > 0 || currentRemaining > 0);

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
      const comWebsite = contatos?.filter((item) => item.contatos?.website?.trim()) ?? [];

      if (comWebsite.length === 0) return { successCount: 0, errorCount: 0 };

      setEnrichmentProgress({
        status: "running", current: 0, total: comWebsite.length, successCount: 0,
      });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < comWebsite.length; i++) {
        const item = comWebsite[i];
        try {
          await api.post(`/contatos/${item.contato_id}/enriquecer`, {});
          successCount++;
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
