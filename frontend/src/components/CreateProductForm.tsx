/**
 * CreateProductForm
 * 
 * Form component for creating new products
 */

'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@/lib/hooks'
import { apiClient } from '@/lib/api-client'
import type { Product } from '@/types'

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

interface ProductFormData {
  sku: string
  name: string
  short_description: string
  description: string
  category: string
  price: number
  discount_percentage: number
  stock: number
  color: string
  material: string
  images?: string[]
  is_featured: boolean
  is_new: boolean
  is_active: boolean
}

const defaultFormData: ProductFormData = {
  sku: '',
  name: '',
  short_description: '',
  description: '',
  category: '',
  price: 0,
  discount_percentage: 0,
  stock: 0,
  color: '',
  material: '',
  images: [],
  is_featured: false,
  is_new: true,
  is_active: true,
}

export function CreateProductForm() {
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData)
  const [validationErrors, setValidationErrors] = useState<Partial<ProductFormData>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const { execute: createProduct, loading, error, success } = useMutation<Product>('POST')

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

  const validateForm = (): boolean => {
    const errors: Partial<ProductFormData> = {}

    // SKU validation
    if (!formData.sku.trim()) {
      errors.sku = 'SKU é obrigatório' as any
    } else if (formData.sku.trim().length < 2) {
      errors.sku = 'SKU deve ter no mínimo 2 caracteres' as any
    }

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório' as any
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Nome deve ter no mínimo 3 caracteres' as any
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Nome não pode exceder 100 caracteres' as any
    }

    // Category validation
    if (!formData.category.trim()) {
      errors.category = 'Categoria é obrigatória' as any
    }

    // Short description validation
    if (!formData.short_description.trim()) {
      errors.short_description = 'Descrição curta é obrigatória' as any
    } else if (formData.short_description.trim().length < 10) {
      errors.short_description = 'Descrição deve ter no mínimo 10 caracteres' as any
    } else if (formData.short_description.trim().length > 300) {
      errors.short_description = 'Descrição não pode exceder 300 caracteres' as any
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Descrição completa é obrigatória' as any
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Descrição deve ter no mínimo 10 caracteres' as any
    }

    // Price validation
    if (formData.price <= 0) {
      errors.price = 'Preço deve ser maior que 0' as any
    } else if (formData.price > 999999) {
      errors.price = 'Preço não pode exceder R$ 999.999' as any
    }

    // Stock validation
    if (formData.stock < 0) {
      errors.stock = 'Estoque não pode ser negativo' as any
    } else if (!Number.isInteger(formData.stock)) {
      errors.stock = 'Estoque deve ser um número inteiro' as any
    } else if (formData.stock > 999999) {
      errors.stock = 'Estoque não pode exceder 999.999 unidades' as any
    }

    // Discount validation
    if (formData.discount_percentage < 0) {
      errors.discount_percentage = 'Desconto não pode ser negativo' as any
    } else if (formData.discount_percentage > 100) {
      errors.discount_percentage = 'Desconto não pode exceder 100%' as any
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      console.warn('Validação falhou')
      return
    }

    console.log('Enviando produto:', formData)
    const response = await createProduct('/v1/admin/products', formData)
    console.log('Resposta do servidor:', response)

    if (!response.error) {
      // Reset form after successful creation
      setFormData(defaultFormData)
      alert('✅ Produto criado com sucesso!')
    } else {
      console.error('Erro ao criar produto:', response.error)
      alert(`❌ Erro: ${response.error}`)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    let finalValue: any = value

    if (type === 'checkbox') {
      finalValue = checked
    } else if (type === 'number') {
      // For stock, use parseInt; for price and discount, use parseFloat
      if (name === 'stock') {
        finalValue = value === '' ? 0 : parseInt(value, 10)
      } else {
        finalValue = value === '' ? 0 : parseFloat(value)
      }
    }

    setFormData({
      ...formData,
      [name]: finalValue,
    })

    // Clear error for this field
    if (validationErrors[name as keyof ProductFormData]) {
      setValidationErrors({
        ...validationErrors,
        [name]: undefined,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full mx-auto">
      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">✅ Produto criado com sucesso!</p>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SKU *
          </label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="ex: SCARF-001"
            minLength={2}
            maxLength={50}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900 ${
              validationErrors.sku ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {validationErrors.sku && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.sku}</p>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Produto *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="ex: Cachecol Luxo"
            minLength={3}
            maxLength={100}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900 ${
              validationErrors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {validationErrors.name && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preço (R$) *
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            max="999999"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900 ${
              validationErrors.price ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {validationErrors.price && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.price}</p>
          )}
        </div>

        {/* Discount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desconto (%) 
          </label>
          <input
            type="number"
            name="discount_percentage"
            value={formData.discount_percentage}
            onChange={handleChange}
            placeholder="0"
            min="0"
            max="100"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900 ${
              validationErrors.discount_percentage
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {validationErrors.discount_percentage && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.discount_percentage}</p>
          )}
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estoque *
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            placeholder="0"
            min="0"
            max="999999"
            step="1"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900 ${
              validationErrors.stock ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {validationErrors.stock && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.stock}</p>
          )}
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cor
          </label>
          <select
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
            disabled={loading || loadingOptions}
          >
            <option value="">Selecione uma cor...</option>
            {colors.map((color) => (
              <option key={color.id} value={color.name}>
                {color.name}
              </option>
            ))}
          </select>
        </div>

        {/* Material */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Material
          </label>
          <select
            name="material"
            value={formData.material}
            onChange={handleChange}
            disabled={loading || loadingOptions}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
          >
            <option value="">Selecione um material...</option>
            {materials.map((material) => (
              <option key={material.id} value={material.name}>
                {material.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900 ${
              validationErrors.category ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading || loadingOptions}
          >
            <option value="">Selecione uma categoria...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          {validationErrors.category && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.category}</p>
          )}
        </div>
      </div>

      {/* Short Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição Curta * ({formData.short_description.length}/300)
        </label>
        <textarea
          name="short_description"
          value={formData.short_description}
          onChange={handleChange}
          placeholder="Descrição breve do produto (10-300 caracteres)"
          rows={2}
          minLength={10}
          maxLength={300}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900 ${
            validationErrors.short_description
              ? 'border-red-500'
              : 'border-gray-300'
          }`}
          disabled={loading}
        />
        {validationErrors.short_description && (
          <p className="text-red-600 text-sm mt-1">{validationErrors.short_description}</p>
        )}
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição Completa * ({formData.description.length}/caracteres)
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descrição detalhada do produto (mínimo 10 caracteres)"
          rows={4}
          minLength={10}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900 ${
            validationErrors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={loading}
        />
        {validationErrors.description && (
          <p className="text-red-600 text-sm mt-1">{validationErrors.description}</p>
        )}
      </div>

      {/* Imagens */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Imagens (URLs)
        </label>
        <div className="space-y-2">
          {formData.images && formData.images.length > 0 ? (
            <div className="space-y-2">
              {formData.images.map((image: string, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => {
                      const newImages = [...(formData.images || [])]
                      newImages[index] = e.target.value
                      setFormData({ ...formData, images: newImages })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900 text-sm"
                    placeholder="URL da imagem"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = (formData.images || []).filter((_, i) => i !== index)
                      setFormData({ ...formData, images: newImages })
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition disabled:opacity-50"
                    disabled={loading}
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
              const newImages = [...(formData.images || [])]
              newImages.push('')
              setFormData({ ...formData, images: newImages })
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition font-medium disabled:opacity-50"
            disabled={loading}
          >
            + Adicionar Imagem
          </button>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_featured"
            checked={formData.is_featured}
            onChange={handleChange}
            disabled={loading}
          />
          <span className="text-sm text-gray-700">Destaque</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_new"
            checked={formData.is_new}
            onChange={handleChange}
            disabled={loading}
          />
          <span className="text-sm text-gray-700">Novo</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            disabled={loading}
          />
          <span className="text-sm text-gray-700">Ativo</span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Criando...' : '✅ Criar Produto'}
        </button>
        <button
          type="button"
          onClick={() => setFormData(defaultFormData)}
          disabled={loading}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-3 rounded-lg transition disabled:opacity-50"
        >
          🔄 Limpar
        </button>
      </div>
    </form>
  )
}
