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
  category: string
  price: number
  stock: number
  reserved_stock: number
  available_stock: number
  low_stock_threshold: number
  is_active: boolean
  color: string | null
  material: string | null
  size: string | null
}

type StockFilter = "all" | "ok" | "low" | "out"
type AdjustOp = "add" | "remove" | "set"

function stockStatus(product: Product): "out" | "low" | "ok" {
  if (product.available_stock <= 0) return "out"
  if (product.available_stock <= product.low_stock_threshold) return "low"
  return "ok"
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "out" | "low" | "ok" }) {
  const map = {
    out: "bg-red-50 text-red-700",
    low: "bg-amber-50 text-amber-700",
    ok:  "bg-green-50 text-green-700",
  }
  const label = { out: "Sem estoque", low: "Estoque baixo", ok: "Normal" }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {label[status]}
    </span>
  )
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: "red" | "amber" | "zinc"
}) {
  const color = accent === "red"
    ? "text-red-600"
    : accent === "amber"
    ? "text-amber-600"
    : "text-zinc-900"
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

// ── Stock Adjust Modal ────────────────────────────────────────────────────────

function AdjustModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product
  onClose: () => void
  onSaved: () => void
}) {
  const [op, setOp] = useState<AdjustOp>("add")
  const [qty, setQty] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = stockStatus(product)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const quantity = parseInt(qty, 10)
    if (isNaN(quantity) || quantity < 0) {
      setError("Informe uma quantidade válida (≥ 0)")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.post(`/products/${product.id}/stock`, { quantity, operation: op })
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao ajustar estoque")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Ajustar estoque</h3>
            <p className="mt-0.5 text-xs text-zinc-500">{product.sku} · {product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current stock summary */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-3 text-xs text-zinc-500">
          <span>Em estoque: <strong className="text-zinc-900">{product.stock}</strong></span>
          <span>Reservado: <strong className="text-zinc-900">{product.reserved_stock}</strong></span>
          <span>Disponível: <strong className={status === "out" ? "text-red-600" : status === "low" ? "text-amber-600" : "text-green-700"}>{product.available_stock}</strong></span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Operation */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-600">Operação</span>
            <div className="grid grid-cols-3 gap-2">
              {(["add", "remove", "set"] as AdjustOp[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOp(o)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    op === o
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {o === "add" ? "Adicionar" : o === "remove" ? "Remover" : "Definir"}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-600">
              Quantidade{op === "set" ? " (novo valor total)" : ""}
            </label>
            <input
              type="number"
              min="0"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 transition"
              placeholder={op === "set" ? "Ex: 50" : "Ex: 10"}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
              autoFocus
            />
          </div>

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
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Salvando…" : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StockPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [adjusting, setAdjusting] = useState<Product | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<StockFilter>("all")

  useEffect(() => {
    if (!isLoading && user?.role !== "admin") router.replace("/home")
  }, [isLoading, user, router])

  const load = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const data = await api.get<{ products: Product[] }>(
        "/products/admin/all?limit=500&active_only=false"
      )
      setProducts(data.products ?? [])
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)

      const st = stockStatus(p)
      const matchFilter =
        filter === "all" ||
        (filter === "out" && st === "out") ||
        (filter === "low" && st === "low") ||
        (filter === "ok"  && st === "ok")

      return matchSearch && matchFilter
    })
  }, [products, search, filter])

  // Summary counts
  const totalOut = useMemo(() => products.filter((p) => stockStatus(p) === "out").length, [products])
  const totalLow = useMemo(() => products.filter((p) => stockStatus(p) === "low").length, [products])

  if (isLoading || user?.role !== "admin") {
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
          <h1 className="text-xl font-semibold text-zinc-900">Gestão de Estoque</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Controle e ajuste o estoque de todos os produtos</p>
        </div>
        <a
          href="/products"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Gerenciar Produtos
        </a>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Total de produtos" value={products.length} />
        <SummaryCard label="Estoque baixo" value={totalLow} accent="amber" />
        <SummaryCard label="Sem estoque" value={totalOut} accent="red" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 transition"
            placeholder="Buscar por nome, SKU ou categoria…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white p-1">
          {(["all", "ok", "low", "out"] as StockFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {f === "all" ? "Todos" : f === "ok" ? "Normal" : f === "low" ? "Baixo" : "Sem estoque"}
            </button>
          ))}
        </div>
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
            {products.length === 0 && (
              <a href="/products" className="mt-3 text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900">
                Cadastrar produtos
              </a>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wide border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3 text-left">Produto</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Reservado</th>
                  <th className="px-4 py-3 text-right">Disponível</th>
                  <th className="px-4 py-3 text-right">Mínimo</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((product) => {
                  const st = stockStatus(product)
                  return (
                    <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-900 leading-tight">{product.name}</span>
                          <span className="text-xs text-zinc-400 font-mono mt-0.5">{product.sku}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{product.category}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-700">{product.stock}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400">{product.reserved_stock}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${
                        st === "out" ? "text-red-600" : st === "low" ? "text-amber-600" : "text-green-700"
                      }`}>
                        {product.available_stock}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-400">{product.low_stock_threshold}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={st} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setAdjusting(product)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                        >
                          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Footer count */}
            <div className="border-t border-zinc-100 px-4 py-2.5 text-xs text-zinc-400">
              {filtered.length} produto{filtered.length !== 1 ? "s" : ""}
              {filtered.length !== products.length ? ` de ${products.length}` : ""}
            </div>
          </div>
        )}
      </div>

      {/* Adjust modal */}
      {adjusting && (
        <AdjustModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={() => {
            setAdjusting(null)
            load()
          }}
        />
      )}
    </div>
  )
}
