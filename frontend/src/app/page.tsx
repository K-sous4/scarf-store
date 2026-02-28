"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const displayPrice = product.discount_price ?? product.price
  const hasDiscount = product.discount_percentage > 0
  const image = product.images?.[0] ?? `https://placehold.co/400x300/f4f4f5/71717a?text=${encodeURIComponent(product.name)}`

  return (
    <div className="group flex-shrink-0 w-64 rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="relative h-48 bg-zinc-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_new && (
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

      {/* Info */}
      <div className="p-4">
        <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium mb-1">
          {product.category}
        </p>
        <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug mb-2">
          {product.name}
        </h3>
        {product.short_description && (
          <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
            {product.short_description}
          </p>
        )}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-base font-bold text-zinc-900">
            {formatPrice(displayPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-zinc-400 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
        {product.color && (
          <p className="mt-1 text-[11px] text-zinc-400">{product.color} · {product.material ?? ""}</p>
        )}
      </div>
    </div>
  )
}

// ── Carousel ──────────────────────────────────────────────────────────────────

function Carousel({ title, products }: { title: string; products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const SCROLL_BY = 288 // card width + gap

  function updateScrollState() {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    updateScrollState()
    const el = trackRef.current
    el?.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)
    return () => {
      el?.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [products])

  function scroll(dir: "left" | "right") {
    trackRef.current?.scrollBy({ left: dir === "left" ? -SCROLL_BY : SCROLL_BY, behavior: "smooth" })
  }

  if (products.length === 0) return null

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="flex size-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Anterior"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="flex size-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Próximo"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Sign-up Modal ────────────────────────────────────────────────────────────

function SignUpModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError("As senhas não coincidem.")
      return
    }
    if (form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1"
      const res = await fetch(`${apiBase}/auth/sign-in`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          email: form.email || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.detail ?? "Erro ao criar conta. Tente novamente.")
        return
      }
      // Session cookie is set by the backend — navigate to dashboard
      router.push("/home")
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Criar conta</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Preencha os dados para se cadastrar</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-700">
              Usuário <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="Seu nome de usuário"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-700">
              E-mail <span className="text-zinc-400">(opcional)</span>
            </label>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-700">
              Senha <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-700">
              Confirmar senha <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
              placeholder="Repita a senha"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 border border-rose-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Criando conta…" : "Criar conta"}
          </button>

          <p className="text-center text-xs text-zinc-400">
            Já tem conta?{" "}
            <Link href="/login" className="text-zinc-700 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showSignUp, setShowSignUp] = useState(false)

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1"
    fetch(`${apiBase}/products/?limit=500`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { products: Product[]; total: number } | Product[]) => {
        const list = Array.isArray(data) ? data : (data as { products: Product[] }).products ?? []
        setProducts(list)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const featured = products.filter((p) => p.is_featured)
  const newest   = products.filter((p) => p.is_new)

  // Group by category
  const byCategory = products.reduce<Record<string, Product[]>>((acc, p) => {
    ;(acc[p.category] ??= []).push(p)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900">
              <svg className="size-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <span className="text-base font-semibold text-zinc-900 tracking-tight">Scarf Store</span>
          </div>

          {/* CTA */}
          {!authLoading && (
            user ? (
              <Link
                href="/home"
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Ir para o painel
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSignUp(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  Criar conta
                </button>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Entrar
                </Link>
              </div>
            )
          )}
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-400">
              Coleção exclusiva
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              Lenços e <br />
              <span className="text-zinc-500">acessórios únicos</span>
            </h1>
            <p className="mt-6 text-lg text-zinc-500 leading-relaxed">
              Peças artesanais em seda, cashmere, lã e algodão — cada lenço conta uma história.
              Descubra nossa coleção e encontre o que combina com você.
            </p>
            <div className="mt-8 flex gap-3">
              <a
                href="#catalogo"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
              >
                Ver catálogo
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              {!user && (
                <>
                  <button
                    onClick={() => setShowSignUp(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    Criar conta grátis
                  </button>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-zinc-500 transition hover:text-zinc-700"
                  >
                    Entrar na conta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Loading skeleton ────────────────────────────────────────────────── */}
      {loading && (
        <div className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 h-6 w-40 animate-pulse rounded-lg bg-zinc-200" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64 h-72 animate-pulse rounded-2xl bg-zinc-200" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Catalog ─────────────────────────────────────────────────────────── */}
      {!loading && (
        <div id="catalogo">
          {featured.length > 0 && (
            <Carousel title="Destaques" products={featured} />
          )}
          {newest.length > 0 && (
            <Carousel title="Novidades" products={newest} />
          )}
          {Object.entries(byCategory).map(([category, items]) => (
            <Carousel key={category} title={category} products={items} />
          ))}
          {products.length === 0 && (
            <div className="py-24 text-center text-zinc-400">
              <p className="text-lg">Nenhum produto disponível no momento.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-zinc-900">
                <svg className="size-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-zinc-900">Scarf Store</span>
            </div>
            <p className="text-xs text-zinc-400">© {new Date().getFullYear()} Scarf Store. Todos os direitos reservados.</p>
            {!user && (
              <Link href="/login" className="text-xs text-zinc-500 underline-offset-2 hover:underline">
                Acesso para lojistas
              </Link>
            )}
          </div>
        </div>
      </footer>

      {/* ── Sign-up Modal ───────────────────────────────────────────────────── */}
      {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} />}
    </div>
  )
}
