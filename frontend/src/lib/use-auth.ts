/**
 * Authentication Hook
 * 
 * Manages user authentication, session persistence, and auth state
 * Uses validated storage to prevent data corruption
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { apiClient } from './api-client'
import { storage, validators } from './storage-validators'
import type { User, LoginRequest, LoginResponse } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,  // Start as loading so we can restore from localStorage first
    error: null,
  })

  // Restore auth from localStorage on mount (client-side only)
  // This effect is idempotent and safe to run multiple times (Strict Mode compatible)
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already initialized to prevent duplicate restoration
    const currentAuth = auth.user || auth.isLoading === false
    if (currentAuth) return

    let isMounted = true

    try {
      // Use validated storage to retrieve user data
      const user = storage.getItem(
        validators.user.key,
        validators.user.validate
      )

      if (user) {
        if (isMounted) {
          setAuth({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        }
      } else {
        // No stored auth, mark as not loading
        if (isMounted) {
          setAuth(prev => ({ ...prev, isLoading: false }))
        }
      }
    } catch (err) {
      console.error('Failed to restore auth:', err)
      // Clear corrupted data
      storage.removeItem(validators.user.key)
      
      // Clear loading state on error
      if (isMounted) {
        setAuth(prev => ({ ...prev, isLoading: false }))
      }
    }

    // Cleanup to prevent state updates on unmounted component
    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (credentials: LoginRequest) => {
    setAuth(prev => ({ ...prev, isLoading: true, error: null }))

    const response = await apiClient.post<LoginResponse>('/v1/auth/login', credentials)

    if (response.error || !response.data) {
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: response.error || 'Falha ao fazer login - resposta inválida',
      }))
      return { success: false, error: response.error || 'Resposta inválida do servidor' }
    }

    const { user } = response.data

    // Validate data before storing
    if (!user) {
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: 'Dados de autenticação inválidos',
      }))
      return { success: false, error: 'Dados de autenticação inválidos' }
    }

    // Validate user data
    const validatedUser = validators.user.validate(user)
    if (!validatedUser) {
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: 'Dados de usuário inválidos',
      }))
      return { success: false, error: 'Dados de usuário inválidos' }
    }

    // Store in localStorage with validation (client-side only)
    if (typeof window !== 'undefined') {
      const stored = storage.setItem(validators.user.key, validatedUser)
      if (!stored) {
        console.warn('Failed to store user data in localStorage')
      }
    }

    setAuth({
      user: validatedUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })

    return { success: true }
  }, [])

  const logout = useCallback(async () => {
    setAuth(prev => ({ ...prev, isLoading: true }))

    // Call logout endpoint if needed
    await apiClient.post('/v1/auth/logout', {})

    // Clear storage and state
    if (typeof window !== 'undefined') {
      storage.removeItem(validators.user.key)
    }

    setAuth({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })

    return { success: true }
  }, [])

  return {
    ...auth,
    login,
    logout,
  }
}

export type UseAuthReturn = ReturnType<typeof useAuth>
