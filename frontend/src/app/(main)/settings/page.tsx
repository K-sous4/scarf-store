"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api, ApiError } from "@/lib/api"

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "categories" | "colors" | "materials" | "users"

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
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
  description: string | null
  is_active: boolean
}

interface User {
  id: number
  username: string
  email: string | null
  role: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionHeader({
  title,
  onAdd,
}: {
  title: string
  onAdd: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-zinc-800">{title}</h2>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
      >
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Adicionar
      </button>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-14 text-zinc-400">
      <svg className="size-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-sm">Nenhum {label} cadastrado</p>
    </div>
  )
}

function DeleteConfirm({
  label,
  onConfirm,
  onCancel,
  loading,
}: {
  label: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-zinc-900">Confirmar exclusão</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Tem certeza que deseja excluir <span className="font-medium text-zinc-800">{label}</span>? Esta ação não pode ser desfeita.
        </p>
        <div className="mt-5 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  "rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 transition"

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  onSubmit,
  loading,
  error,
  children,
}: {
  title: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  error: string | null
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4">
          {children}
          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Categories Tab ────────────────────────────────────────────────────────────

function CategoriesTab() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<"create" | "edit" | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({ name: "", slug: "", description: "", is_active: true })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Category[]>("/categories/")
      setItems(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ name: "", slug: "", description: "", is_active: true })
    setError(null)
    setModal("create")
  }

  function openEdit(item: Category) {
    setEditing(item)
    setForm({ name: item.name, slug: item.slug, description: item.description ?? "", is_active: item.is_active })
    setError(null)
    setModal("edit")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (modal === "create") {
        await api.post("/categories/", form)
      } else {
        await api.put(`/categories/${editing!.id}`, form)
      }
      setModal(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeletingId(true)
    try {
      await api.delete(`/categories/${deleting!.id}`)
      setDeleting(null)
      load()
    } catch {
      // ignore
    } finally {
      setDeletingId(false)
    }
  }

  return (
    <>
      <SectionHeader title="Categorias" onAdd={openCreate} />
      {loading ? (
        <div className="text-sm text-zinc-400 py-8 text-center">Carregando…</div>
      ) : items.length === 0 ? (
        <EmptyState label="categoria" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{item.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.is_active ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {item.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowActions onEdit={() => openEdit(item)} onDelete={() => setDeleting(item)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal === "create" ? "Nova Categoria" : "Editar Categoria"}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          loading={saving}
          error={error}
        >
          <Field label="Nome *">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
              placeholder="Ex: Silk Scarves"
              required
            />
          </Field>
          <Field label="Slug *">
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="Ex: silk-scarves"
              required
            />
          </Field>
          <Field label="Descrição">
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descrição da categoria…"
            />
          </Field>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="size-4 rounded border-zinc-300 accent-zinc-900"
            />
            <span className="text-sm text-zinc-700">Categoria ativa</span>
          </label>
        </Modal>
      )}

      {deleting && (
        <DeleteConfirm
          label={deleting.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deletingId}
        />
      )}
    </>
  )
}

// ── Colors Tab ────────────────────────────────────────────────────────────────

function ColorsTab() {
  const [items, setItems] = useState<Color[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<"create" | "edit" | null>(null)
  const [editing, setEditing] = useState<Color | null>(null)
  const [deleting, setDeleting] = useState<Color | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingNow, setDeletingNow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", hex_code: "#000000" })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Color[]>("/colors/")
      setItems(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ name: "", hex_code: "#000000" })
    setError(null)
    setModal("create")
  }

  function openEdit(item: Color) {
    setEditing(item)
    setForm({ name: item.name, hex_code: item.hex_code ?? "#000000" })
    setError(null)
    setModal("edit")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (modal === "create") {
        await api.post("/colors/", form)
      } else {
        await api.put(`/colors/${editing!.id}`, form)
      }
      setModal(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeletingNow(true)
    try {
      await api.delete(`/colors/${deleting!.id}`)
      setDeleting(null)
      load()
    } catch {
      // ignore
    } finally {
      setDeletingNow(false)
    }
  }

  return (
    <>
      <SectionHeader title="Cores" onAdd={openCreate} />
      {loading ? (
        <div className="text-sm text-zinc-400 py-8 text-center">Carregando…</div>
      ) : items.length === 0 ? (
        <EmptyState label="cor" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Cor</th>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Hex</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className="flex size-6 rounded-full border border-zinc-200 shadow-sm"
                      style={{ background: item.hex_code ?? "#ccc" }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{item.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{item.hex_code ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <RowActions onEdit={() => openEdit(item)} onDelete={() => setDeleting(item)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal === "create" ? "Nova Cor" : "Editar Cor"}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          loading={saving}
          error={error}
        >
          <Field label="Nome *">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Dusty Rose"
              required
            />
          </Field>
          <Field label="Cor">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.hex_code}
                onChange={(e) => setForm((f) => ({ ...f, hex_code: e.target.value }))}
                className="size-10 cursor-pointer rounded-lg border border-zinc-200 p-0.5"
              />
              <input
                className={`${inputCls} flex-1`}
                value={form.hex_code}
                onChange={(e) => setForm((f) => ({ ...f, hex_code: e.target.value }))}
                placeholder="#DCAE96"
              />
            </div>
          </Field>
        </Modal>
      )}

      {deleting && (
        <DeleteConfirm
          label={deleting.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deletingNow}
        />
      )}
    </>
  )
}

// ── Materials Tab ─────────────────────────────────────────────────────────────

function MaterialsTab() {
  const [items, setItems] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<"create" | "edit" | null>(null)
  const [editing, setEditing] = useState<Material | null>(null)
  const [deleting, setDeleting] = useState<Material | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingNow, setDeletingNow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", slug: "", description: "", is_active: true })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Material[]>("/materials/")
      setItems(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ name: "", slug: "", description: "", is_active: true })
    setError(null)
    setModal("create")
  }

  function openEdit(item: Material) {
    setEditing(item)
    setForm({ name: item.name, slug: item.slug, description: item.description ?? "", is_active: item.is_active })
    setError(null)
    setModal("edit")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (modal === "create") {
        await api.post("/materials/", form)
      } else {
        await api.put(`/materials/${editing!.id}`, form)
      }
      setModal(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeletingNow(true)
    try {
      await api.delete(`/materials/${deleting!.id}`)
      setDeleting(null)
      load()
    } catch {
      // ignore
    } finally {
      setDeletingNow(false)
    }
  }

  return (
    <>
      <SectionHeader title="Materiais" onAdd={openCreate} />
      {loading ? (
        <div className="text-sm text-zinc-400 py-8 text-center">Carregando…</div>
      ) : items.length === 0 ? (
        <EmptyState label="material" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{item.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.is_active ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {item.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowActions onEdit={() => openEdit(item)} onDelete={() => setDeleting(item)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal === "create" ? "Novo Material" : "Editar Material"}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          loading={saving}
          error={error}
        >
          <Field label="Nome *">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
              placeholder="Ex: Cashmere"
              required
            />
          </Field>
          <Field label="Slug *">
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="Ex: cashmere"
              required
            />
          </Field>
          <Field label="Descrição">
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descrição do material…"
            />
          </Field>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="size-4 rounded border-zinc-300 accent-zinc-900"
            />
            <span className="text-sm text-zinc-700">Material ativo</span>
          </label>
        </Modal>
      )}

      {deleting && (
        <DeleteConfirm
          label={deleting.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deletingNow}
        />
      )}
    </>
  )
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [items, setItems] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<"create" | "edit" | null>(null)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingNow, setDeletingNow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ users: User[] }>("/users/")
      setItems(data.users ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setForm({ username: "", email: "", password: "", role: "user" })
    setError(null)
    setModal("create")
  }

  function openEdit(item: User) {
    setEditing(item)
    setForm({ username: item.username, email: item.email ?? "", password: "", role: item.role as "user" | "admin" })
    setError(null)
    setModal("edit")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (modal === "create") {
        await api.post("/users/", {
          username: form.username,
          email: form.email || undefined,
          password: form.password,
          role: form.role,
        })
      } else {
        await api.put(`/users/${editing!.id}`, {
          username: form.username || undefined,
          email: form.email || undefined,
          password: form.password || undefined,
          role: form.role,
        })
      }
      setModal(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeletingNow(true)
    try {
      await api.delete(`/users/${deleting!.id}`)
      setDeleting(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir")
    } finally {
      setDeletingNow(false)
    }
  }

  return (
    <>
      <SectionHeader title="Usuários" onAdd={openCreate} />
      {loading ? (
        <div className="text-sm text-zinc-400 py-8 text-center">Carregando…</div>
      ) : items.length === 0 ? (
        <EmptyState label="usuário" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Usuário</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Perfil</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 uppercase">
                        {item.username[0]}
                      </div>
                      <span className="font-medium text-zinc-900">{item.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{item.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.role === "admin" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {item.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowActions
                      onEdit={() => openEdit(item)}
                      onDelete={item.role !== "admin" ? () => setDeleting(item) : undefined}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal === "create" ? "Novo Usuário" : "Editar Usuário"}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          loading={saving}
          error={error}
        >
          <Field label="Username *">
            <input
              className={inputCls}
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="Ex: joao_silva"
              required
            />
          </Field>
          <Field label="E-mail">
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Ex: joao@exemplo.com"
            />
          </Field>
          <Field label={modal === "create" ? "Senha *" : "Nova senha (deixe em branco para manter)"}>
            <input
              type="password"
              className={inputCls}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              required={modal === "create"}
            />
          </Field>
          <Field label="Perfil">
            <select
              className={inputCls}
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "user" | "admin" }))}
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </Field>
        </Modal>
      )}

      {deleting && (
        <DeleteConfirm
          label={deleting.username}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deletingNow}
        />
      )}
    </>
  )
}

// ── Row Actions ───────────────────────────────────────────────────────────────

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 transition-colors"
      >
        <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Editar
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Excluir
        </button>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "categories", label: "Categorias" },
  { id: "colors",     label: "Cores" },
  { id: "materials",  label: "Materiais" },
  { id: "users",      label: "Usuários" },
]

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("categories")

  useEffect(() => {
    if (!isLoading && user?.role !== "admin") {
      router.replace("/home")
    }
  }, [isLoading, user, router])

  if (isLoading || user?.role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-400 p-8">
        Verificando acesso…
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Configurações</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gerencie categorias, cores, materiais e usuários do sistema.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-zinc-100 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "colors"     && <ColorsTab />}
        {activeTab === "materials"  && <MaterialsTab />}
        {activeTab === "users"      && <UsersTab />}
      </div>
    </div>
  )
}
