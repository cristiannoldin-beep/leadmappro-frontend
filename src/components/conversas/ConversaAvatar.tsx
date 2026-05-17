'use client'

const AVATAR_COLORS = [
  '#3b82f6','#8b5cf6','#ec4899','#f97316',
  '#14b8a6','#84cc16','#f59e0b','#06b6d4',
  '#6366f1','#10b981','#ef4444','#a855f7'
]

function gerarCorPorNome(nome: string) {
  let hash = 0
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function iniciais(nome: string) {
  if (!nome) return '?'
  return nome.split(' ').slice(0, 1).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

interface ConversaAvatarProps {
  nome: string
  fotoUrl?: string | null
  tamanho?: number
  contatoId?: string
  telefone?: string
}

export function ConversaAvatar({ nome, fotoUrl, tamanho = 40 }: ConversaAvatarProps) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm"
      style={{ width: tamanho, height: tamanho, minWidth: tamanho, background: fotoUrl ? 'transparent' : gerarCorPorNome(nome) }}
    >
      {fotoUrl ? (
        <img src={fotoUrl} alt={nome} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-white" style={{ fontSize: tamanho * 0.4 }}>
          {iniciais(nome)}
        </span>
      )}
    </div>
  )
}
