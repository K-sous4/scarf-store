'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ProductStockList } from '@/components/ProductStockList'
import { CreateProductForm } from '@/components/CreateProductForm'

function AdminDashboardContent() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'estoque' | 'criar'>('estoque')

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-amber-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🧣 Scarf Store Admin</h1>
            <p className="text-amber-100 text-sm">Bem-vindo, {user?.full_name || user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-amber-800 hover:bg-amber-900 px-4 py-2 rounded-lg transition duration-200"
          >
            🚪 Sair
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('estoque')}
            className={`px-6 py-3 font-semibold transition duration-200 ${
              activeTab === 'estoque'
                ? 'border-b-2 border-amber-700 text-amber-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📦 Gerenciar Estoque
          </button>
          <button
            onClick={() => setActiveTab('criar')}
            className={`px-6 py-3 font-semibold transition duration-200 ${
              activeTab === 'criar'
                ? 'border-b-2 border-amber-700 text-amber-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ➕ Criar Produto
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'estoque' && <StockManagementSection />}
          {activeTab === 'criar' && <CreateProductSection />}
        </div>
      </div>
    </div>
  )
}

function StockManagementSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gerenciar Estoque</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <ProductStockList />
      </div>
    </div>
  )
}

function CreateProductSection() {
  return (
    <div className="flex justify-center">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Criar Novo Produto</h2>
        <CreateProductForm />
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
