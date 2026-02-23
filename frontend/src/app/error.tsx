'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global Error Boundary
 * 
 * Catches unhandled errors at app level
 * Shows error UI and provides recovery option
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to external service (e.g., Sentry)
    console.error('App Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="text-6xl mb-4">⚠️</div>

        {/* Error Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Algo deu errado
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 mb-4">
          Desculpe, ocorreu um erro inesperado. Nosso time foi notificado.
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-mono text-red-800 break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-700 mt-2">
                <strong>ID:</strong> {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg transition"
          >
            🔄 Tentar Novamente
          </button>

          <a
            href="/"
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition text-center"
          >
            🏠 Voltar para Home
          </a>
        </div>

        {/* Support Info */}
        <p className="text-sm text-gray-500 mt-6">
          Se o problema persistir,{' '}
          <a
            href="mailto:support@scarfstore.com"
            className="text-amber-700 hover:underline"
          >
            entre em contato
          </a>
          .
        </p>
      </div>
    </div>
  )
}
