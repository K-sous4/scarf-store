/**
 * ProtectedRoute
 * 
 * Component to protect routes that require authentication
 */

'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/use-auth'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'user'
}

export function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuth()

  useEffect(() => {
    // Still loading, wait
    if (isLoading) return

    // Not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }

    // Check role if required
    if (requiredRole && user.role !== requiredRole) {
      router.push('/')
      return
    }
  }, [isAuthenticated, user, isLoading, requiredRole, router])

  // Still loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Not authenticated or wrong role
  if (!isAuthenticated || !user || (requiredRole && user.role !== requiredRole)) {
    return null
  }

  return <>{children}</>
}
