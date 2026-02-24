'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/use-auth'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, error: authError, isLoading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLocalError(null)

    // Validation
    if (!username || !password) {
      setLocalError('Usuário e senha são obrigatórios')
      return
    }

    const result = await login({ username, password })

    if (!result.success) {
      setLocalError(result.error || 'Falha ao fazer login')
    }
  }

  const displayError = localError || authError

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🧣</div>
          <h1 className="text-3xl font-bold text-gray-900">Scarf Store</h1>
          <p className="text-gray-600 mt-2">Área Administrativa</p>
        </div>

        {/* Error Message */}
        {displayError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">⚠️ {displayError}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="seu usuário"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? '⏳ Entrando...' : '🔓 Entrar'}
          </button>
        </form>

        {/* Test Credentials */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm font-semibold text-gray-700 mb-3">📋 Credenciais de Teste</p>
          
          {/* Username */}
          <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Usuário:</p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-amber-200 flex-1">
                testuser
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('testuser')
                  alert('✓ Usuário copiado!')
                }}
                className="px-2 py-1 text-xs bg-amber-200 hover:bg-amber-300 rounded text-amber-900 font-medium transition"
              >
                Copiar
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Senha:</p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-amber-200 flex-1">
                securePassword123
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('securePassword123')
                  alert('✓ Senha copiada!')
                }}
                className="px-2 py-1 text-xs bg-amber-200 hover:bg-amber-300 rounded text-amber-900 font-medium transition"
              >
                Copiar
              </button>
            </div>
          </div>

          {/* Auto-fill button */}
          <button
            onClick={() => {
              setUsername('testuser')
              setPassword('securePassword123')
            }}
            className="w-full mt-3 px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-700 font-medium transition"
          >
            🚀 Auto-preencher
          </button>
        </div>
      </div>
    </div>
  )
}
