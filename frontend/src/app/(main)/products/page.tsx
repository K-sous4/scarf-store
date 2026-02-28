"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api, ApiError } from "@/lib/api"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product {
  id: number
  sku: string
  name: string
  short_description: string | null
  description: string
  category: string
  subcategory: string | null
  tags: string[] | null
  price: number
  cost: number | null
  discount_percentage: number
  discount_price: number | null
  stock: number
  reserved_stock: number
  available_stock: number
  low_stock_threshold: number
  material: string | null
  color: string | null
  size: string | null
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  is_active: boolean
  is_featured: boolean
  is_new: boolean
  images: string[] | null
}

interface FilterOption {
  id: number
  name: string
  slug?: string
}

type FormTab = "basic" | "details"

const EMPTY_FORM = {
  sku: "",
  name: "",
  short_description: "",
  description: "",
  category: "",
  subcategory: "",
  price: "",
  cost: "",
  discount_percentage: "0",
  stock: "0",
  low_stock_threshold: "10",
  material: "",
  color: "",
  size: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  is_active: true,
  is_featured: false,
  is_new: true,
  tags: "",      // comma-separated
  images: "",    // comma-separated URLs
}

type FormState = typeof EMPTY_FORM

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 transition w-full"

function Field({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${half ? "col-span-1" : "col-span-2"}`}>
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  )
}

function productToForm(p: Product): FormState {
  return {
    sku: p.sku,
    name: p.name,
    short_description: p.short_description ?? "",
    description: p.description,
    category: p.category,
    subcategory: p.subcategory ?? "",
    price: String(p.price),
    cost: p.cost != null ? String(p.cost) : "",
    discount_percentage: String(p.discount_percentage),
    stock: String(p.stock),
    low_stock_threshold: String(p.low_stock_threshold),
    material: p.material ?? "",
    color: p.color ?? "",
    size: p.size ?? "",
    weight: p.weight != null ? String(p.weight) : "",
    length: p.length != null ? String(p.length) : "",
    width: p.width != null ? String(p.width) : "",
    height: p.height != null ? String(p.height) : "",
    is_active: p.is_active,
    is_featured: p.is_featured,
    is_new: p.is_new,
    tags: (p.tags ?? []).join(", "),
    images: (p.images ?? []).join(", "),
  }
}

function formToPayload(f: FormState) {
  const num = (v: string) => v.trim() !== "" ? parseFloat(v) : undefined
  const int = (v: string) => v.trim() !== "" ? parseInt(v, 10) : undefined
  const arr = (v: string) => v.trim() !== "" ? v.split(",").map((s) => s.trim()).filter(Boolean) : []

  return {
    sku: f.sku.trim().toUpperCase(),
    name: f.name.trim(),
    description: f.description.trim(),
    short_description: f.short_description.trim() || undefined,
    category: f.category.trim(),
    subcategory: f.subcategory.trim() || undefined,
    price: num(f.price),
    cost: num(f.cost),
    discount_percentage: num(f.discount_percentage) ?? 0,
    stock: int(f.stock) ?? 0,
    low_stock_threshold: int(f.low_stock_threshold) ?? 10,
    material: f.material.trim() || undefined,
    color: f.color.trim() || undefined,
    size: f.size.trim() || undefined,
    weight: num(f.weight),
    length: num(f.length),
    width: num(f.width),
    height: num(f.height),
    is_active: f.is_active,
    is_featured: f.is_featured,
    is_new: f.is_new,
    tags: arr(f.tags),
    images: arr(f.images),
  }
}

// ── Status badge ──────────────────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${active ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
      {active ? "Ativo" : "Inativo"}
    </span>
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  name,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-zinc-900">Confirmar exclusão</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Tem certeza que deseja excluir <span className="font-medium text-zinc-800">{name}</span>? Esta ação não pode ser desfeita.
        </p>
        <div className="mt-5 flex gap-3 justify-end">
          <button onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors">
            {loading ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Product Modal ─────────────────────────────────────────────────────────────

function ProductModal({
  mode,
  form,
  onChange,
  onSubmit,
  onClose,
  saving,
  error,
  categories,
  colors,
  materials,
}: {
  mode: "create" | "edit"
  form: FormState
  onChange: (patch: Partial<FormState>) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  saving: boolean
  error: string | null
  categories: FilterOption[]
  colors: FilterOption[]
  materials: FilterOption[]
}) {
  const [tab, setTab] = useState<FormTab>("basic")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 shrink-0">
          <h3 className="text-base font-semibold text-zinc-900">
            {mode === "create" ? "Novo Produto" : "Editar Produto"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors">
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-zinc-100 px-6 shrink-0">
          {(["basic", "details"] as FormTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`py-2.5 px-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {t === "basic" ? "Informações" : "Detalhes"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-5">
            {tab === "basic" ? (
              <div className="grid grid-cols-2 gap-4">
                <Field label="SKU *" half>
                  <input className={inputCls} value={form.sku} onChange={(e) => onChange({ sku: e.target.value })} placeholder="Ex: SILK-RED-001" required />
                </Field>
                <Field label="Nome *" half>
                  <input className={inputCls} value={form.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Ex: Lenço de Seda Vermelho" required />
                </Field>
                <Field label="Descrição curta">
                  <input className={inputCls} value={form.short_description} onChange={(e) => onChange({ short_description: e.target.value })} placeholder="Resumo exibido na listagem" />
                </Field>
                <Field label="Descrição completa *">
                  <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Descrição detalhada do produto" required />
                </Field>
                <Field label="Categoria *" half>
                  <input
                    list="categories-list"
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => onChange({ category: e.target.value })}
                    placeholder="Selecione ou escreva"
                    required
                  />
                  <datalist id="categories-list">
                    {categories.map((c) => <option key={c.id} value={c.name} />)}
                  </datalist>
                </Field>
                <Field label="Subcategoria" half>
                  <input className={inputCls} value={form.subcategory} onChange={(e) => onChange({ subcategory: e.target.value })} placeholder="Opcional" />
                </Field>
                <Field label="Preço (R$) *" half>
                  <input type="number" step="0.01" min="0.01" className={inputCls} value={form.price} onChange={(e) => onChange({ price: e.target.value })} placeholder="0.00" required />
                </Field>
                <Field label="Custo (R$)" half>
                  <input type="number" step="0.01" min="0" className={inputCls} value={form.cost} onChange={(e) => onChange({ cost: e.target.value })} placeholder="0.00" />
                </Field>
                <Field label="Desconto (%)" half>
                  <input type="number" step="1" min="0" max="100" className={inputCls} value={form.discount_percentage} onChange={(e) => onChange({ discount_percentage: e.target.value })} />
                </Field>
                <Field label="Tags (separadas por vírgula)" half>
                  <input className={inputCls} value={form.tags} onChange={(e) => onChange({ tags: e.target.value })} placeholder="Ex: silk, vermelho, luxo" />
                </Field>
                <Field label="Estoque inicial" half>
                  <input type="number" min="0" className={inputCls} value={form.stock} onChange={(e) => onChange({ stock: e.target.value })} />
                </Field>
                <Field label="Mínimo de estoque" half>
                  <input type="number" min="0" className={inputCls} value={form.low_stock_threshold} onChange={(e) => onChange({ low_stock_threshold: e.target.value })} />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Material" half>
                  <input
                    list="materials-list"
                    className={inputCls}
                    value={form.material}
                    onChange={(e) => onChange({ material: e.target.value })}
                    placeholder="Ex: Seda"
                  />
                  <datalist id="materials-list">
                    {materials.map((m) => <option key={m.id} value={m.name} />)}
                  </datalist>
                </Field>
                <Field label="Cor principal" half>
                  <input
                    list="colors-list"
                    className={inputCls}
                    value={form.color}
                    onChange={(e) => onChange({ color: e.target.value })}
                    placeholder="Ex: Vermelho"
                  />
                  <datalist id="colors-list">
                    {colors.map((c) => <option key={c.id} value={c.name} />)}
                  </datalist>
                </Field>
                <Field label="Tamanho" half>
                  <input className={inputCls} value={form.size} onChange={(e) => onChange({ size: e.target.value })} placeholder="Ex: 90x90cm, P, M, G" />
                </Field>
                <Field label="Peso (kg)" half>
                  <input type="number" step="0.001" min="0" className={inputCls} value={form.weight} onChange={(e) => onChange({ weight: e.target.value })} placeholder="0.000" />
                </Field>
                <Field label="Comprimento (cm)" half>
                  <input type="number" step="0.1" min="0" className={inputCls} value={form.length} onChange={(e) => onChange({ length: e.target.value })} />
                </Field>
                <Field label="Largura (cm)" half>
                  <input type="number" step="0.1" min="0" className={inputCls} value={form.width} onChange={(e) => onChange({ width: e.target.value })} />
                </Field>
                <Field label="Altura (cm)" half>
                  <input type="number" step="0.1" min="0" className={inputCls} value={form.height} onChange={(e) => onChange({ height: e.target.value })} />
                </Field>
                <Field label="URLs das imagens (separadas por vírgula)">
                  <input className={inputCls} value={form.images} onChange={(e) => onChange({ images: e.target.value })} placeholder="https://…, https://…" />
                </Field>

                {/* Flags */}
                <div className="col-span-2 flex flex-col gap-2 pt-1">
                  <span className="text-xs font-medium text-zinc-600">Visibilidade</span>
                  <div className="flex flex-wrap gap-4">
                    {(
                      [
                        { key: "is_active", label: "Produto ativo" },
                        { key: "is_featured", label: "Destaque na vitrine" },
                        { key: "is_new", label: "Marcar como novo" },
                      ] as { key: keyof FormState; label: string }[]
                    ).map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form[key] as boolean}
                          onChange={(e) => onChange({ [key]: e.target.checked })}
                          className="size-4 rounded border-zinc-300 accent-zinc-900"
                        />
                        <span className="text-sm text-zinc-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-100 px-6 py-4 shrink-0 flex flex-col gap-3">
            {error && (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors">
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const isAdmin = user?.role === "admin"

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [colors, setColors] = useState<FilterOption[]>([])
  const [materials, setMaterials] = useState<FilterOption[]>([])

  const [modal, setModal] = useState<"create" | "edit" | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingNow, setDeletingNow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const [search, setSearch] = useState("")
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all")

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login")
    if (!isLoading && user && user.role !== "admin") router.replace("/home")
  }, [isLoading, user, router])

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    try {
      if (isAdmin) {
        const data = await api.get<{ products: Product[] }>("/products/admin/all?limit=500&active_only=false")
        setProducts(data.products ?? [])
      } else {
        const data = await api.get<{ products: Product[] }>("/products/?limit=500")
        setProducts(data.products ?? [])
      }
    } finally {
      setLoadingProducts(false)
    }
  }, [isAdmin])

  const loadFilters = useCallback(async () => {
    const [cats, cols, mats] = await Promise.allSettled([
      api.get<FilterOption[]>("/categories/"),
      api.get<FilterOption[]>("/colors/"),
      api.get<FilterOption[]>("/materials/"),
    ])
    if (cats.status === "fulfilled") setCategories(cats.value)
    if (cols.status === "fulfilled") setColors(cols.value)
    if (mats.status === "fulfilled") setMaterials(mats.value)
  }, [])

  useEffect(() => {
    loadProducts()
    loadFilters()
  }, [loadProducts, loadFilters])

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setModal("create")
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm(productToForm(p))
    setError(null)
    setModal("edit")
  }

  function patchForm(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = formToPayload(form)
      if (modal === "create") {
        await api.post("/products/", payload)
      } else {
        await api.put(`/products/${editing!.id}`, payload)
      }
      setModal(null)
      loadProducts()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar produto")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeletingNow(true)
    try {
      await api.delete(`/products/${deleting!.id}`)
      setDeleting(null)
      loadProducts()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir produto")
      setDeleting(null)
    } finally {
      setDeletingNow(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      const matchActive =
        filterActive === "all" ||
        (filterActive === "active" && p.is_active) ||
        (filterActive === "inactive" && !p.is_active)
      return matchSearch && matchActive
    })
  }, [products, search, filterActive])

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Produtos</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {products.length} produto{products.length !== 1 ? "s" : ""} cadastrado{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <a
              href="/stock"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Estoque
            </a>
          )}
          {isAdmin && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo produto
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 transition"
            placeholder="Buscar por nome, SKU ou categoria…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white p-1">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterActive === f ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Inativos"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {loadingProducts ? (
          <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
            <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 mr-3" />
            Carregando produtos…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <svg className="size-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm">Nenhum produto encontrado</p>
            {isAdmin && (
              <button onClick={openCreate} className="mt-3 text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900">
                Cadastrar primeiro produto
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wide border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3 text-left">Produto</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-right">Preço</th>
                  <th className="px-4 py-3 text-right">Estoque</th>
                  {isAdmin && <th className="px-4 py-3 text-center">Status</th>}
                  {isAdmin && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">{p.name}</span>
                          {p.is_featured && (
                            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Destaque</span>
                          )}
                          {p.is_new && (
                            <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">Novo</span>
                          )}
                        </div>
                        <span className="font-mono text-xs text-zinc-400 mt-0.5">{p.sku}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      <span>{p.category}</span>
                      {p.subcategory && <span className="text-zinc-400"> / {p.subcategory}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        {p.discount_price ? (
                          <>
                            <span className="font-medium text-zinc-900">R$ {Number(p.discount_price).toFixed(2)}</span>
                            <span className="text-xs text-zinc-400 line-through">R$ {Number(p.price).toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="font-medium text-zinc-900">R$ {Number(p.price).toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono font-medium ${p.available_stock <= 0 ? "text-red-600" : p.available_stock <= p.low_stock_threshold ? "text-amber-600" : "text-zinc-700"}`}>
                        {p.available_stock}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-center">
                        <ActiveBadge active={p.is_active} />
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 transition-colors"
                          >
                            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => setDeleting(p)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Excluir
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-zinc-100 px-4 py-2.5 text-xs text-zinc-400">
              {filtered.length} produto{filtered.length !== 1 ? "s" : ""}
              {filtered.length !== products.length ? ` de ${products.length}` : ""}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <ProductModal
          mode={modal}
          form={form}
          onChange={patchForm}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
          saving={saving}
          error={error}
          categories={categories}
          colors={colors}
          materials={materials}
        />
      )}

      {deleting && (
        <DeleteConfirm
          name={deleting.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deletingNow}
        />
      )}
    </div>
  )
}
