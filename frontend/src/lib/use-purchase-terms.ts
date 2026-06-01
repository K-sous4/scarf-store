"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { PURCHASE_TERMS_TITLE } from "@/lib/purchase-terms"

export interface PurchaseTermsData {
  version: string
  title: string
  summary: string
  clauses: string[]
  delivery_commitment_days: number
}

const FALLBACK: PurchaseTermsData = {
  version: "2026-06-01-d7",
  title: PURCHASE_TERMS_TITLE,
  summary:
    "Pagamento vinculado ao pedido, confirmacao em duas etapas e registro de entrega pela loja.",
  clauses: [],
  delivery_commitment_days: 7,
}

export function usePurchaseTerms() {
  const [terms, setTerms] = useState<PurchaseTermsData>(FALLBACK)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<PurchaseTermsData>("/orders/purchase-terms")
      setTerms(data)
    } catch {
      setTerms(FALLBACK)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { terms, loading, reload }
}
