"use client"

import { PURCHASE_TERMS_TITLE } from "@/lib/purchase-terms"
import type { PurchaseTermsData } from "@/lib/use-purchase-terms"

export function PurchaseTermsModal({
  open,
  onClose,
  terms,
}: {
  open: boolean
  onClose: () => void
  terms: PurchaseTermsData
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <div
        className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">{PURCHASE_TERMS_TITLE}</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Versão {terms.version} · Prazo de entrega: {terms.delivery_commitment_days} dias úteis
          </p>
        </div>
        <ol className="flex-1 overflow-y-auto px-6 py-4 space-y-3 text-sm text-zinc-700 list-decimal list-inside">
          {terms.clauses.map((clause) => (
            <li key={clause} className="leading-relaxed">
              {clause}
            </li>
          ))}
        </ol>
        <div className="border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
