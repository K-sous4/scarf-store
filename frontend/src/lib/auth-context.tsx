"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { User, LoginRequest, SignUpRequest, AuthResponse } from "@/types/auth"

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  signUp: (data: SignUpRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Restaura a sessão ao montar o provider (refresh da página, nova aba, etc.)
  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get<User>("/auth/profile")
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const login = useCallback(async (credentials: LoginRequest) => {
    const data = await api.post<AuthResponse>("/auth/login", credentials)
    setUser(data.user)
  }, [])

  const signUp = useCallback(async (data: SignUpRequest) => {
    const response = await api.post<AuthResponse>("/auth/sign-in", data)
    setUser(response.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout")
    } finally {
      setUser(null)
      router.push("/")
    }
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
