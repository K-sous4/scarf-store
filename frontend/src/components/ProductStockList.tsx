/**
 * ProductStockList
 * 
 * Component to display and manage product stock
 */

'use client'

import { useState, useEffect } from 'react'
import { useProducts } from '@/lib/hooks'
import { useMutation } from '@/lib/hooks'
import type { Product } from '@/types'

interface ProductRow {
  id: number
  sku: string
  name: string
  price: number
  stock: number
  is_active: boolean
  actions: boolean
}

export function ProductStockList() {
  const { products, loading, error, refetch } = useProducts(0, 100)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingStock, setEditingStock] = useState<Record<number, number>>({})
  const [showEditModal, setShowEditModal] = useState(false)
  const { execute: updateProduct, loading: updating } = useMutation<Product>('PUT')
  const { execute: deleteProduct, loading: deleting } = useMutation<void>('DELETE')

  const handleEditStock = (product: Product) => {
    setSelectedProduct(product)
    setEditingStock({ [product.id]: product.stock })
    setShowEditModal(true)
  }

  const handleSaveStock = async () => {
    if (!selectedProduct) return

    const newStock = editingStock[selectedProduct.id]
    if (newStock === selectedProduct.stock) {
      setShowEditModal(false)
      return
    }

    const response = await updateProduct(
      `/v1/admin/products/${selectedProduct.id}`,
      { stock: newStock }
    )

    if (!response.error) {
      setShowEditModal(false)
      setSelectedProduct(null)
      // Refetch products list
      refetch()
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${product.name}"?`)) {
      return
    }

    const response = await deleteProduct(`/v1/admin/products/${product.id}`)

    if (!response.error) {
      // Product deleted successfully - refetch the list
      refetch()
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Carregando produtos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-medium">⚠️ Erro ao carregar produtos</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="text-lg">📦 Nenhum produto disponível</p>
      </div>
    )
  }

  return (
    <>
      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Produto</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Preço</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Estoque</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.sku}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.name}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  R$ {parseFloat(String(product.price)).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      product.stock > 10
                        ? 'bg-green-100 text-green-800'
                        : product.stock > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.stock} un.
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ✅ Ativo
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleEditStock(product)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition disabled:opacity-50"
                    >
                      🗑️ Deletar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Editar Estoque: {selectedProduct.name}
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade em Estoque
              </label>
              <input
                type="number"
                value={editingStock[selectedProduct.id] || 0}
                onChange={(e) =>
                  setEditingStock({
                    ...editingStock,
                    [selectedProduct.id]: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStock}
                disabled={updating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
              >
                {updating ? '⏳ Salvando...' : '✅ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
