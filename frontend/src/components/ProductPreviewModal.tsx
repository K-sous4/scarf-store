"use client"

import { useEffect } from "react"
import Link from "next/link"

export interface ProductPreview {
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
  images: string[] | null
}

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function resolveImageUrl(url: string, apiBase: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  if (!apiBase) return url
  const base = apiBase.replace(/\/$/, "")
  const normalized = url.startsWith("/") ? url : `/${url}`
  const path = base.endsWith("/api/v1") && normalized.startsWith("/api/v1/")
    ? normalized.replace(/^\/api\/v1/, "")
    : normalized
  return `${base}${path}`
}

function pickImage(product: ProductPreview, apiBase: string) {
  const list = product.images ?? []
  const raw =
    list.find((u) => u.startsWith("/api/v1/products/images/")) ??
    list.find((u) => !u.includes("placehold.co")) ??
    list[0]
  if (!raw) {
    return `https://placehold.co/480x360/f4f4f5/71717a?text=${encodeURIComponent(product.name)}`
  }
  return resolveImageUrl(raw, apiBase)
}

export function ProductPreviewModal({
  product,
  apiBase,
  onClose,
  showAuthActions = true,
}: {
  product: ProductPreview
  apiBase: string
  onClose: () => void
  showAuthActions?: boolean
}) {
  const image = pickImage(product, apiBase)
  const displayPrice = product.discount_price ?? product.price
  const hasDiscount = product.discount_percentage > 0

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <div
        className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-44 sm:h-52 bg-zinc-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={product.name} className="h-full w-full object-cover" />
          <div className="absolute left-3 top-3 flex gap-1">
            {product.is_new && (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                Novo
              </span>
            )}
            {hasDiscount && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                -{product.discount_percentage}%
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-zinc-500 shadow-sm"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          <p className="text-[11px] uppercase tracking-wider text-zinc-400">{product.category}</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-900 leading-snug">{product.name}</h2>
          {product.short_description && (
            <p className="mt-2 text-sm text-zinc-500 line-clamp-4">{product.short_description}</p>
          )}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xl font-bold text-zinc-900">{formatPrice(displayPrice)}</span>
            {hasDiscount && (
              <span className="text-sm text-zinc-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>
          {(product.color || product.material) && (
            <p className="mt-2 text-xs text-zinc-500">
              {[product.color, product.material].filter(Boolean).join(" · ")}
            </p>
          )}
          {showAuthActions && (
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/login"
                className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-center text-sm font-semibold text-white hover:bg-zinc-700 transition"
              >
                Entrar para comprar
              </Link>
              <Link
                href="/login"
                className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Criar conta
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
