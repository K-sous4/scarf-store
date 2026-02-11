'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@/lib/hooks'
import { apiClient } from '@/lib/api-client'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })

  const { execute: createCategory, loading: creating } = useMutation<Category>('POST')
  const { execute: updateCategory, loading: updating } = useMutation<Category>('PUT')
  const { execute: deleteCategory, loading: deleting } = useMutation<void>('DELETE')

  // Fetch categories
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<Category[]>('/v1/admin/parameters/categories')
      if (response.error) throw new Error(response.error)
      setCategories(response.data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.slug) {
      setError('Nome e slug são obrigatórios')
      return
    }

    if (editingId) {
      // Update
      const response = await updateCategory(
        `/v1/admin/parameters/categories/${editingId}`,
        formData
      )
      if (!response.error) {
        await fetchCategories()
        resetForm()
      } else {
        setError('Erro ao atualizar categoria')
      }
    } else {
      // Create
      const response = await createCategory(
        '/v1/admin/parameters/categories',
        formData
      )
      if (!response.error) {
        await fetchCategories()
        resetForm()
      } else {
        setError('Erro ao criar categoria')
      }
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja deletar esta categoria?')) return

    const response = await deleteCategory(
      `/v1/admin/parameters/categories/${id}`
    )
    if (!response.error) {
      await fetchCategories()
    } else {
      setError('Erro ao deletar categoria')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '' })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Carregando categorias...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Gerenciar Categorias</h3>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg transition"
        >
          {showForm ? '✕ Cancelar' : '➕ Nova Categoria'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Editar Categoria' : 'Nova Categoria'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (Opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={creating || updating}
              className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
            >
              {creating || updating ? '⏳ Salvando...' : '✅ Salvar'}
            </button>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            Nenhuma categoria criada ainda
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Slug</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{cat.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{cat.slug}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      cat.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {cat.is_active ? '✅ Ativo' : '⊘ Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
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
        )}
      </div>
    </div>
  )
}
