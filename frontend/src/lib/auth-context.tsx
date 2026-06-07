"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import type { User, LoginRequest, SignUpRequest, AuthResponse } from "@/types/auth"

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  signUp: (data: SignUpRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Restaura a sessão ao montar o provider (refresh da página, nova aba, etc.)
  const clearStaleSession = useCallback(async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // ignore — cookie may already be invalid
    }
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get<User>("/auth/profile")
      setUser(data)
    } catch (err) {
      setUser(null)
      if (err instanceof ApiError && err.status === 401) {
        await clearStaleSession()
      }
    } finally {
      setIsLoading(false)
    }
  }, [clearStaleSession])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const establishSession = useCallback(async () => {
    const data = await api.get<User>("/auth/profile")
    setUser(data)
    return data
  }, [])

  const login = useCallback(
    async (credentials: LoginRequest) => {
      await api.post<AuthResponse>("/auth/login", credentials)
      try {
        await establishSession()
      } catch (err) {
        await clearStaleSession()
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [establishSession, clearStaleSession]
  )

  const signUp = useCallback(
    async (data: SignUpRequest) => {
      await api.post<AuthResponse>("/auth/sign-in", data)
      try {
        await establishSession()
      } catch (err) {
        await clearStaleSession()
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [establishSession, clearStaleSession]
  )

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
        refreshUser: fetchProfile,
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
