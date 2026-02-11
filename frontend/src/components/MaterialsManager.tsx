'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@/lib/hooks'
import { apiClient } from '@/lib/api-client'

interface Material {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function MaterialsManager() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })

  const { execute: createMaterial, loading: creating } = useMutation<Material>('POST')
  const { execute: updateMaterial, loading: updating } = useMutation<Material>('PUT')
  const { execute: deleteMaterial, loading: deleting } = useMutation<void>('DELETE')

  // Fetch materials
  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<Material[]>('/v1/admin/parameters/materials')
      if (response.error) throw new Error(response.error)
      setMaterials(response.data || [])
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
      const response = await updateMaterial(
        `/v1/admin/parameters/materials/${editingId}`,
        formData
      )
      if (!response.error) {
        await fetchMaterials()
        resetForm()
      } else {
        setError('Erro ao atualizar material')
      }
    } else {
      // Create
      const response = await createMaterial(
        '/v1/admin/parameters/materials',
        formData
      )
      if (!response.error) {
        await fetchMaterials()
        resetForm()
      } else {
        setError('Erro ao criar material')
      }
    }
  }

  const handleEdit = (material: Material) => {
    setEditingId(material.id)
    setFormData({
      name: material.name,
      slug: material.slug,
      description: material.description || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja deletar este material?')) return

    const response = await deleteMaterial(
      `/v1/admin/parameters/materials/${id}`
    )
    if (!response.error) {
      await fetchMaterials()
    } else {
      setError('Erro ao deletar material')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '' })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Carregando materiais...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Gerenciar Materiais</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          + Novo Material
        </button>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Editar Material' : 'Novo Material'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
                placeholder="Ex: Seda, Lã, Algodão"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
                placeholder="Ex: seda, la, algodao"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
                rows={3}
                placeholder="Descrição do material (opcional)"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating || updating}
                className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
              >
                {creating || updating ? '⏳ Salvando...' : '✅ Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {materials.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum material cadastrado</div>
      ) : (
        <div className="space-y-2">
          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition"
            >
              <div>
                <h4 className="font-semibold text-gray-900">{material.name}</h4>
                <p className="text-sm text-gray-500">{material.slug}</p>
                {material.description && (
                  <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(material)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(material.id)}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition disabled:opacity-50"
                >
                  🗑️ Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
