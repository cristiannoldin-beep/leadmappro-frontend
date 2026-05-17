'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  nomeCompleto: string | null
  celular: string | null
  role: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  accountId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, nomeCompleto: string, celular?: string, address?: Record<string, string>) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User; accountId: string }>('/auth/me')
      setUser(data.user)
      setAccountId(data.accountId)
    } catch {
      setUser(null)
      setAccountId(null)
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.post<{ user: User; token: string }>('/auth/login', { email, password })
      setUser(data.user)
      toast.success('Login realizado com sucesso!')
      router.push('/dashboard')
      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login.'
      toast.error(message)
      return { error: message }
    }
  }

  const signUp = async (email: string, password: string, nomeCompleto: string, celular?: string, address?: Record<string, string>) => {
    try {
      const data = await api.post<{ user: User; token: string }>('/auth/register', {
        email, password, nomeCompleto, celular, ...address,
      })
      setUser(data.user)
      toast.success('Conta criada com sucesso!')
      router.push('/dashboard')
      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta.'
      toast.error(message)
      return { error: message }
    }
  }

  const signOut = async () => {
    try {
      await api.post('/auth/logout', {})
    } catch {}
    setUser(null)
    setAccountId(null)
    router.push('/')
    toast.success('Logout realizado com sucesso!')
  }

  return (
    <AuthContext.Provider value={{ user, accountId, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
