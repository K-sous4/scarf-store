/**
 * ProductStockList
 * 
 * Component to display and manage product stock
 */

'use client'

import { useState, useEffect } from 'react'
import { useProducts } from '@/lib/hooks'
import { useMutation } from '@/lib/hooks'
import { apiClient } from '@/lib/api-client'
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

interface Category {
  id: number
  name: string
  slug: string
}

interface Color {
  id: number
  name: string
  hex_code: string | null
}

interface Material {
  id: number
  name: string
  slug: string
}

export function ProductStockList() {
  const { products, loading, error, refetch } = useProducts(0, 100)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingData, setEditingData] = useState<Partial<Product>>({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const { execute: updateProduct, loading: updating } = useMutation<Product>('PUT')
  const { execute: deleteProduct, loading: deleting } = useMutation<void>('DELETE')

  // Fetch categories and colors
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [categoriesRes, colorsRes, materialsRes] = await Promise.all([
          apiClient.get<Category[]>('/v1/admin/parameters/categories'),
          apiClient.get<Color[]>('/v1/admin/parameters/colors'),
          apiClient.get<Material[]>('/v1/admin/parameters/materials'),
        ])

        if (!categoriesRes.error && categoriesRes.data) {
          setCategories(categoriesRes.data)
        }

        if (!colorsRes.error && colorsRes.data) {
          setColors(colorsRes.data)
        }

        if (!materialsRes.error && materialsRes.data) {
          setMaterials(materialsRes.data)
        }
      } catch (err) {
        console.error('Erro ao carregar opções:', err)
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchOptions()
  }, [])

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditingData({
      name: product.name,
      price: product.price,
      discount_price: product.discount_price,
      short_description: product.short_description,
      color: product.color,
      stock: product.stock,
      is_featured: product.is_featured,
      is_active: product.is_active,
      images: product.images || [],
    })
    setShowEditModal(true)
  }

  const handleSaveProduct = async () => {
    if (!selectedProduct) return

    const response = await updateProduct(
      `/v1/admin/products/${selectedProduct.id}`,
      editingData
    )

    if (!response.error) {
      setShowEditModal(false)
      setSelectedProduct(null)
      setEditingData({})
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
                      onClick={() => handleEditProduct(product)}
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
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Editar Produto: {selectedProduct.name}
            </h3>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={editingData.name || ''}
                  onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
                />
              </div>

              {/* Preço e Preço com Desconto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingData.price || 0}
                    onChange={(e) => setEditingData({ ...editingData, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço com Desconto (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingData.discount_price || ''}
                    onChange={(e) => setEditingData({ ...editingData, discount_price: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
                  />
                </div>
              </div>

              {/* Descrição Curta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição Curta
                </label>
                <textarea
                  value={editingData.short_description || ''}
                  onChange={(e) => setEditingData({ ...editingData, short_description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
                  rows={3}
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={editingData.category || ''}
                  onChange={(e) => setEditingData({ ...editingData, category: e.target.value })}
                  disabled={loadingOptions}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor
                </label>
                <select
                  value={editingData.color || ''}
                  onChange={(e) => setEditingData({ ...editingData, color: e.target.value })}
                  disabled={loadingOptions}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
                >
                  <option value="">Selecione uma cor...</option>
                  {colors.map((color) => (
                    <option key={color.id} value={color.name}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estoque */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade em Estoque
                </label>
                <input
                  type="number"
                  value={editingData.stock || 0}
                  onChange={(e) => setEditingData({ ...editingData, stock: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
                />
              </div>

              {/* Imagens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagens (URLs)
                </label>
                <div className="space-y-2">
                  {(editingData.images && Array.isArray(editingData.images) && editingData.images.length > 0) ? (
                    <div className="space-y-2">
                      {editingData.images.map((image: string, index: number) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={image}
                            onChange={(e) => {
                              const newImages = [...(editingData.images as string[])]
                              newImages[index] = e.target.value
                              setEditingData({ ...editingData, images: newImages })
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900 text-sm"
                            placeholder="URL da imagem"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = (editingData.images as string[]).filter((_, i) => i !== index)
                              setEditingData({ ...editingData, images: newImages })
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Nenhuma imagem adicionada</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = [...(editingData.images as string[] || [])]
                      newImages.push('')
                      setEditingData({ ...editingData, images: newImages })
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition font-medium"
                  >
                    + Adicionar Imagem
                  </button>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={editingData.is_featured || false}
                    onChange={(e) => setEditingData({ ...editingData, is_featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Destaque
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editingData.is_active !== false}
                    onChange={(e) => setEditingData({ ...editingData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700">
                    Ativo
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={updating}
                className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
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
