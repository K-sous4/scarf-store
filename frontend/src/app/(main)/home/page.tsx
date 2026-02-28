"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product {
  id: number
  name: string
  short_description: string | null
  price: number
  discount_percentage: number
  discount_price: number | null
  category: string
  color: string | null
  material: string | null
  is_new: boolean
  is_featured: boolean
  images: string[] | null
  available_stock: number
  low_stock_threshold: number
}

interface CartItem {
  product: Product
  qty: number
}

function formatPrice(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function unitPrice(p: Product) {
  return p.discount_price ?? p.price
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────

function CartDrawer({
  items,
  onClose,
  onChangeQty,
  onRemove,
  onClear,
}: {
  items: CartItem[]
  onClose: () => void
  onChangeQty: (id: number, delta: number) => void
  onRemove: (id: number) => void
  onClear: () => void
}) {
  const total = items.reduce((s, i) => s + unitPrice(i.product) * i.qty, 0)
  const totalItems = items.reduce((s, i) => s + i.qty, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        {/* Checkout stock errors */}
        {items.some((i) => i.qty > i.product.available_stock) && (
          <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
            <p className="font-semibold mb-1">Atenção: problemas de estoque</p>
            <ul className="space-y-0.5">
              {items
                .filter((i) => i.qty > i.product.available_stock)
                .map((i) => (
                  <li key={i.product.id}>
                    • <strong>{i.product.name}</strong>: apenas{" "}
                    {i.product.available_stock > 0
                      ? `${i.product.available_stock} disponível(is)`
                      : "sem estoque"}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <svg className="size-5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-base font-semibold text-zinc-900">
              Carrinho
              {totalItems > 0 && (
                <span className="ml-1.5 text-sm font-normal text-zinc-400">({totalItems} {totalItems === 1 ? "item" : "itens"})</span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400">
              <svg className="size-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm">Seu carrinho está vazio.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map(({ product, qty }) => {
                const image = product.images?.[0] ??
                  `https://placehold.co/80x80/f4f4f5/71717a?text=${encodeURIComponent(product.name)}`
                return (
                  <li key={product.id} className="flex gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={product.name}
                      className="size-16 flex-shrink-0 rounded-lg object-cover bg-zinc-200"
                    />
                    <div className="flex flex-1 flex-col justify-between gap-1 min-w-0">
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 line-clamp-2 leading-snug">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-zinc-400">{product.category}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          {qty > product.available_stock && (
                            <p className="text-[10px] text-amber-600 font-medium">
                              {product.available_stock === 0
                                ? "Sem estoque"
                                : `Máx: ${product.available_stock}`}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onChangeQty(product.id, -1)}
                              className="flex size-6 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 transition text-sm font-bold leading-none"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-sm font-medium text-zinc-900">{qty}</span>
                            <button
                              onClick={() => onChangeQty(product.id, +1)}
                              disabled={qty >= product.available_stock}
                              className="flex size-6 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 transition text-sm font-bold leading-none disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900">
                            {formatPrice(unitPrice(product) * qty)}
                          </span>
                          <button
                            onClick={() => onRemove(product.id)}
                            className="text-zinc-300 hover:text-rose-500 transition"
                            aria-label="Remover"
                          >
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-zinc-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Total</span>
              <span className="text-base font-bold text-zinc-900">{formatPrice(total)}</span>
            </div>
            <button
              disabled={items.some((i) => i.qty > i.product.available_stock)}
              className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Finalizar pedido
            </button>
            <button
              onClick={onClear}
              className="w-full rounded-lg border border-zinc-200 py-2 text-xs text-zinc-500 transition hover:bg-zinc-50"
            >
              Limpar carrinho
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product
  onAddToCart: (p: Product) => void
}) {
  const [added, setAdded] = useState(false)
  const displayPrice = product.discount_price ?? product.price
  const hasDiscount = product.discount_percentage > 0
  const isOutOfStock = product.available_stock <= 0
  const isLowStock =
    !isOutOfStock && product.available_stock <= product.low_stock_threshold
  const image =
    product.images?.[0] ??
    `https://placehold.co/400x300/f4f4f5/71717a?text=${encodeURIComponent(product.name)}`

  function handleAdd() {
    if (isOutOfStock) return
    onAddToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <div className="group flex-shrink-0 w-56 rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      <div className="relative h-40 bg-zinc-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isOutOfStock && (
            <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
              Esgotado
            </span>
          )}
          {isLowStock && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
              Últimas unidades
            </span>
          )}
          {product.is_new && !isOutOfStock && (
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
              Novo
            </span>
          )}
          {hasDiscount && (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
              -{product.discount_percentage}%
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3 gap-2">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium mb-0.5">
            {product.category}
          </p>
          <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-zinc-900">{formatPrice(displayPrice)}</span>
          {hasDiscount && (
            <span className="text-xs text-zinc-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`mt-auto w-full rounded-lg py-1.5 text-xs font-semibold transition ${
            isOutOfStock
              ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              : added
              ? "bg-emerald-500 text-white"
              : "bg-zinc-900 text-white hover:bg-zinc-700"
          }`}
        >
          {isOutOfStock ? "Sem estoque" : added ? "✓ Adicionado" : "Adicionar ao carrinho"}
        </button>
      </div>
    </div>
  )
}

// ── Carousel ──────────────────────────────────────────────────────────────────

function Carousel({
  title,
  products,
  onAddToCart,
}: {
  title: string
  products: Product[]
  onAddToCart: (p: Product) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const SCROLL_BY = 240

  function update() {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 0)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    update()
    const el = trackRef.current
    el?.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      el?.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [products])

  if (!products.length) return null

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        <div className="flex gap-1.5">
          <button
            onClick={() => trackRef.current?.scrollBy({ left: -SCROLL_BY, behavior: "smooth" })}
            disabled={!canLeft}
            className="flex size-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => trackRef.current?.scrollBy({ left: SCROLL_BY, behavior: "smooth" })}
            disabled={!canRight}
            className="flex size-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
        ))}
      </div>
    </section>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(!isAdmin)

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const addToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        // Cap at available_stock
        if (existing.qty >= product.available_stock) return prev
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { product, qty: 1 }]
    })
  }, [])

  const changeQty = useCallback((id: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== id) return i
          const next = i.qty + delta
          // Cap increment at available_stock
          if (delta > 0 && next > i.product.available_stock) return i
          return { ...i, qty: next }
        })
        .filter((i) => i.qty > 0)
    )
  }, [])

  const removeItem = useCallback((id: number) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== id))
  }, [])

  const clearCart = useCallback(() => setCartItems([]), [])

  useEffect(() => {
    if (isAdmin) return
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1"
    fetch(`${apiBase}/products/?limit=500`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { products: Product[] } | Product[]) => {
        const list = Array.isArray(data) ? data : (data as { products: Product[] }).products ?? []
        setProducts(list)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [isAdmin])

  const featured = products.filter((p) => p.is_featured)
  const newest = products.filter((p) => p.is_new)
  const byCategory = products.reduce<Record<string, Product[]>>((acc, p) => {
    ;(acc[p.category] ??= []).push(p)
    return acc
  }, {})

  return (
    <div className="relative p-6 lg:p-8">
      {/* Greeting + cart button */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Olá, {user?.username} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Bem-vindo ao painel da Scarf Store.
          </p>
        </div>

        {/* Cart button — only for non-admin */}
        {!isAdmin && (
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:shadow"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Carrinho
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Admin: stat cards */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Produtos"
            description="Gerencie o catálogo de produtos"
            href="/products"
            icon={
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatCard
            label="Estoque"
            description="Controle os níveis de estoque dos produtos"
            href="/stock"
            icon={
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            label="Configurações"
            description="Categorias, cores, materiais e usuários"
            href="/settings"
            icon={
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Non-admin: product carousels */}
      {!isAdmin && (
        <>
          {loadingProducts ? (
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="mb-3 h-5 w-32 animate-pulse rounded-lg bg-zinc-200" />
                  <div className="flex gap-3 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex-shrink-0 w-56 h-64 animate-pulse rounded-2xl bg-zinc-200" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {featured.length > 0 && <Carousel title="Destaques" products={featured} onAddToCart={addToCart} />}
              {newest.length > 0 && <Carousel title="Novidades" products={newest} onAddToCart={addToCart} />}
              {Object.entries(byCategory).map(([cat, items]) => (
                <Carousel key={cat} title={cat} products={items} onAddToCart={addToCart} />
              ))}
              {products.length === 0 && (
                <p className="text-sm text-zinc-400">Nenhum produto disponível no momento.</p>
              )}
            </>
          )}
        </>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <CartDrawer
          items={cartItems}
          onClose={() => setCartOpen(false)}
          onChangeQty={changeQty}
          onRemove={removeItem}
          onClear={clearCart}
        />
      )}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  description,
  href,
  icon,
}: {
  label: string
  description: string
  href: string
  icon: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition group-hover:bg-zinc-200">
        {icon}
      </div>
      <div>
        <p className="font-medium text-zinc-900">{label}</p>
        <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
      </div>
    </a>
  )
}
