'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/use-auth'

/**
 * MainNavigation
 * 
 * Renders the main navigation header with:
 * - Brand logo
 * - Navigation menu
 * - Links to main sections
 * - Admin panel link (for admins only)
 * - Logout button
 */
export default function MainNavigation() {
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <header className="bg-amber-700 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/home" className="flex items-center gap-2 hover:opacity-80 transition">
          <div className="text-3xl font-bold text-white">🧣</div>
          <h1 className="text-2xl font-bold text-white">Scarf Store</h1>
        </Link>
        <nav className="flex gap-6 items-center">
          <a href="#" className="text-amber-100 hover:text-white transition">
            Início
          </a>
          <a href="#products" className="text-amber-100 hover:text-white transition">
            Produtos
          </a>
          <a href="#" className="text-amber-100 hover:text-white transition">
            Sobre
          </a>
          <a href="#" className="text-amber-100 hover:text-white transition">
            Contato
          </a>

          {/* Admin Panel Link */}
          {isAuthenticated && user?.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="bg-amber-800 hover:bg-amber-900 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
            >
              📊 Gestão
            </Link>
          )}

          {/* Logout Button */}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="bg-amber-800 hover:bg-amber-900 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
            >
              🚪 Sair
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
