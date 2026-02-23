'use client'

import ProductCard from './ProductCard'
import { useProducts } from '@/lib/hooks'
import { SkeletonProductGrid } from './LoadingSkeletons'

/**
 * ProductGrid
 * 
 * Renders a responsive grid of products with:
 * - Automatic product fetching from API using useProducts hook
 * - Loading, error, and empty states
 * - Responsive grid (1, 2, 3, 4 columns)
 * - Skeleton loading for better UX
 */
export default function ProductGrid() {
  const { products, loading, error } = useProducts()

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Nossos Produtos</h2>
        <SkeletonProductGrid />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-medium">⚠️ Erro ao carregar produtos</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
        <p className="text-red-500 text-xs mt-4">
          Certifique-se que o backend está rodando em {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
        </p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Nenhum produto disponível ainda</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <ProductCard 
          key={product.id} 
          product={product}
          priority={index < 4}
        />
      ))}
    </div>
  )
}
