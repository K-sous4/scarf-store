'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@/lib/hooks'
import { apiClient } from '@/lib/api-client'

interface Color {
  id: number
  name: string
  hex_code: string | null
  created_at: string
  updated_at: string
}

export default function ColorsManager() {
  const [colors, setColors] = useState<Color[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    hex_code: '',
  })

  const { execute: createColor, loading: creating } = useMutation<Color>('POST')
  const { execute: updateColor, loading: updating } = useMutation<Color>('PUT')
  const { execute: deleteColor, loading: deleting } = useMutation<void>('DELETE')

  // Fetch colors
  useEffect(() => {
    fetchColors()
  }, [])

  const fetchColors = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<Color[]>('/v1/admin/parameters/colors')
      if (response.error) throw new Error(response.error)
      setColors(response.data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      setError('Nome é obrigatório')
      return
    }

    if (editingId) {
      // Update
      const response = await updateColor(
        `/v1/admin/parameters/colors/${editingId}`,
        formData
      )
      if (!response.error) {
        await fetchColors()
        resetForm()
      } else {
        setError('Erro ao atualizar cor')
      }
    } else {
      // Create
      const response = await createColor(
        '/v1/admin/parameters/colors',
        formData
      )
      if (!response.error) {
        await fetchColors()
        resetForm()
      } else {
        setError('Erro ao criar cor')
      }
    }
  }

  const handleEdit = (color: Color) => {
    setEditingId(color.id)
    setFormData({
      name: color.name,
      hex_code: color.hex_code || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja deletar esta cor?')) return

    const response = await deleteColor(
      `/v1/admin/parameters/colors/${id}`
    )
    if (!response.error) {
      await fetchColors()
    } else {
      setError('Erro ao deletar cor')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', hex_code: '' })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Carregando cores...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Gerenciar Cores</h3>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg transition"
        >
          {showForm ? '✕ Cancelar' : '➕ Nova Cor'}
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
            {editingId ? 'Editar Cor' : 'Nova Cor'}
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
                placeholder="Ex: Vermelho, Azul, Preto"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código Hex (Opcional)
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={formData.hex_code}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                  placeholder="#FF0000"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700 bg-white text-gray-900"
                />
                {formData.hex_code && (
                  <div
                    className="w-12 h-12 border border-gray-300 rounded-lg"
                    style={{ backgroundColor: formData.hex_code }}
                    title="Preview da cor"
                  />
                )}
              </div>
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
        {colors.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            Nenhuma cor criada ainda
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Código</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {colors.map((color) => (
                <tr key={color.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{color.name}</td>
                  <td className="px-6 py-4">
                    {color.hex_code && (
                      <div
                        className="w-8 h-8 border border-gray-300 rounded"
                        style={{ backgroundColor: color.hex_code }}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {color.hex_code || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(color)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(color.id)}
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
