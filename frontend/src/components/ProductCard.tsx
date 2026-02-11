'use client'

import Image from 'next/image'
import type { Product } from '@/types'

/**
 * ProductCard
 * 
 * Renders a single product card with:
 * - Product image
 * - Price with and without discount
 * - Discount and featured badges
 * - Stock status
 * - Add to cart button
 */

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const finalPrice = product.discount_price || product.price

  return (
    <div className="bg-amber-50 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="bg-gray-100 h-56 flex items-center justify-center overflow-hidden relative">
        {product.images && product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="text-gray-400 text-4xl">🧣</div>
        )}
        
        {/* Sale Badge */}
        {product.discount_percentage > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{product.discount_percentage}%
          </div>
        )}

        {/* Featured Badge */}
        {product.is_featured && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
            Destaque
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <p className="text-xs text-amber-800 uppercase tracking-wider mb-1">
          {product.sku}
        </p>
        
        <h3 className="text-lg font-semibold text-amber-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {product.short_description && (
          <p className="text-sm text-amber-700 mb-3 line-clamp-2">
            {product.short_description}
          </p>
        )}

        {/* Color Badge */}
        {product.color && (
          <div className="flex gap-2 mb-3">
            <span className="inline-block px-2 py-1 bg-amber-200 text-amber-900 text-xs rounded">
              {product.color}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-amber-900">
            ${finalPrice.toFixed(2)}
          </span>
          {product.discount_price && (
            <span className="text-sm text-amber-600 line-through">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mb-4">
          {product.stock > 10 ? (
            <p className="text-sm text-green-600 font-medium">Em Estoque</p>
          ) : product.stock > 0 ? (
            <p className="text-sm text-yellow-600 font-medium">
              Apenas {product.stock} disponíveis
            </p>
          ) : (
            <p className="text-sm text-red-600 font-medium">Fora de Estoque</p>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          disabled={product.stock === 0}
          className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-secondary transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  )
}
