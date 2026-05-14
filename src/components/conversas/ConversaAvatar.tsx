// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ConversaAvatarProps {
  nome: string;
  fotoUrl?: string | null;
  tamanho?: number;
  contatoId?: string;
  telefone?: string;
}

const AVATAR_COLORS = [
  '#3b82f6','#8b5cf6','#ec4899','#f97316',
  '#14b8a6','#84cc16','#f59e0b','#06b6d4',
  '#6366f1','#10b981','#ef4444','#a855f7'
];

function gerarCorPorNome(nome: string) {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function iniciais(nome: string) {
  if (!nome) return "?";
  return nome.split(' ').slice(0, 1).map(p => p[0]?.toUpperCase() || '').join('');
}

export function ConversaAvatar({
  nome,
  fotoUrl,
  tamanho = 40,
  contatoId,
  telefone
}: ConversaAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(fotoUrl);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  useEffect(() => {
    setCurrentUrl(fotoUrl);
    setImgError(false);
  }, [fotoUrl]);

  const tentarBuscarFoto = async () => {
    if (isFetchingUrl || !contatoId || !telefone) return;
    setIsFetchingUrl(true);
    setImgError(false);
    
    try {
      const { data } = await supabase.functions.invoke("buscar-foto-perfil", {
        body: { contato_id: contatoId, telefone }
      });
      
      if (data?.foto_url) {
        setCurrentUrl(data.foto_url);
        setImgError(false);
      } else {
        setImgError(true);
      }
    } catch {
      setImgError(true);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  useEffect(() => {
    // Se a montagem inicial nÃ£o tiver fotoUrl, tentamos buscar via UazAPI
    if (!fotoUrl && contatoId && telefone && !currentUrl && !imgError && !isFetchingUrl) {
      tentarBuscarFoto();
    }
  }, [fotoUrl, contatoId, telefone]);

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm"
      style={{
        width: tamanho,
        height: tamanho,
        minWidth: tamanho,
        background: currentUrl && !imgError ? 'transparent' : gerarCorPorNome(nome),
      }}
    >
      {currentUrl && !imgError ? (
        <img
          src={currentUrl}
          alt={nome}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={tentarBuscarFoto}
        />
      ) : (
        <span className="font-bold text-white" style={{ fontSize: tamanho * 0.4 }}>
          {iniciais(nome)}
        </span>
      )}
    </div>
  );
}
