'use client'

import { PrefetchLink } from '@/components/PrefetchLink'

/**
 * 404 Not Found Page
 * 
 * Displayed when a route doesn't exist
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="text-6xl mb-4">🔍</div>

        {/* Error Code */}
        <h1 className="text-5xl font-bold text-amber-700 mb-2">404</h1>

        {/* Error Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Página não encontrada
        </h2>

        {/* Error Message */}
        <p className="text-gray-600 mb-8">
          Desculpe, a página que você está procurando não existe ou foi removida.
        </p>

        {/* Helpful Links */}
        <div className="space-y-3 mb-8">
          <p className="text-sm text-gray-500 font-semibold">Lugares úteis:</p>
          <div className="flex flex-col gap-2 text-sm">
            <PrefetchLink
              href="/"
              prefetchStrategy="visible"
              className="text-amber-700 hover:text-amber-900 hover:underline"
            >
              🏠 Página Inicial
            </PrefetchLink>
            <PrefetchLink
              href="/home"
              prefetchStrategy="visible"
              className="text-amber-700 hover:text-amber-900 hover:underline"
            >
              🛍️ Produtos
            </PrefetchLink>
            <PrefetchLink
              href="/login"
              prefetchStrategy="visible"
              className="text-amber-700 hover:text-amber-900 hover:underline"
            >
              🔑 Login
            </PrefetchLink>
          </div>
        </div>

        {/* Action Button */}
        <PrefetchLink
          href="/"
          prefetchStrategy="immediate"
          className="inline-block w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg transition"
        >
          ← Voltar para Home
        </PrefetchLink>

        {/* Support Info */}
        <p className="text-xs text-gray-500 mt-6">
          Encontrou um link quebrado?{' '}
          <a
            href="mailto:support@scarfstore.com"
            className="text-amber-700 hover:underline"
          >
            Avise-nos
          </a>
        </p>
      </div>
    </div>
  )
}
