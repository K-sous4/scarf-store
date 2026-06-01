"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PixQrCode } from "@/components/PixQrCode"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import {
  buildPixPayload,
  normalizePixPhoneKey,
  PIX_MERCHANT_CITY,
  PIX_MERCHANT_NAME,
} from "@/lib/pix"

interface OrderItem {
  product_id: number
  product_name: string
  unit_price: number
  quantity: number
  total_price: number
}

type OrderStatus = "pending_payment" | "payment_reported" | "paid" | "cancelled"

interface Order {
  id: number
  status: OrderStatus
  payment_method: string
  total_amount: number
  created_at: string
  pix_txid?: string | null
  pix_key?: string | null
  payment_reference?: string | null
  items: OrderItem[]
}

const statusStyles: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-50 text-amber-700",
  payment_reported: "bg-sky-50 text-sky-700",
  paid: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-500",
}

const statusLabels: Record<OrderStatus, string> = {
  pending_payment: "Aguardando pagamento",
  payment_reported: "Pagamento informado",
  paid: "Pago",
  cancelled: "Cancelado",
}

function formatPrice(value: number | string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

export default function PurchasesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [references, setReferences] = useState<Record<number, string>>({})
  const [pixOpenId, setPixOpenId] = useState<number | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isLoading && user?.role === "admin") router.replace("/orders")
  }, [isLoading, user, router])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Order[]>("/orders/me")
      setOrders(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar compras")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const cancelOrder = useCallback(async (orderId: number) => {
    setCancellingId(orderId)
    setError(null)
    try {
      const updated = await api.post<Order>(`/orders/${orderId}/cancel`)
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)))
      setPixOpenId((id) => (id === orderId ? null : id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel cancelar o pedido")
    } finally {
      setCancellingId(null)
    }
  }, [])

  const confirmPayment = useCallback(async (orderId: number) => {
    const reference = (references[orderId] ?? "").trim()
    if (reference.length < 3) {
      setError("Informe uma referencia valida para o pagamento.")
      return
    }
    setConfirmingId(orderId)
    try {
      const updated = await api.post<Order>(`/orders/${orderId}/confirm-payment`, { reference })
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)))
      setReferences((prev) => ({ ...prev, [orderId]: "" }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel confirmar o pagamento")
    } finally {
      setConfirmingId(null)
    }
  }, [references])

  if (isLoading || user?.role === "admin") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Minhas compras</h1>
          <p className="mt-1 text-sm text-zinc-500">Acompanhe seus pedidos e pagamentos</p>
        </div>
        <button
          onClick={loadOrders}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
          <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 mr-3" />
          Carregando compras...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center text-zinc-400">
          Nenhuma compra registrada ainda.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Pedido #{order.id}</p>
                  <p className="text-xs text-zinc-400">{formatDate(order.created_at)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.product_id}`} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-zinc-900">{item.product_name}</p>
                      <p className="text-xs text-zinc-400">{item.quantity}x {formatPrice(item.unit_price)}</p>
                    </div>
                    <span className="font-semibold text-zinc-900">{formatPrice(item.total_price)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                <div className="text-sm text-zinc-500">
                  Total: <span className="font-semibold text-zinc-900">{formatPrice(order.total_amount)}</span>
                </div>
                {order.payment_reference && (
                  <div className="text-xs text-zinc-500">
                    Referencia informada: {order.payment_reference}
                  </div>
                )}
                {order.status === "pending_payment" && order.pix_key && order.pix_txid && (
                  <div className="mt-4 w-full border-t border-zinc-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setPixOpenId(pixOpenId === order.id ? null : order.id)}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
                    >
                      {pixOpenId === order.id ? "Ocultar PIX" : "Ver QR PIX"}
                    </button>
                    {pixOpenId === order.id && (
                      <div className="mt-4 flex flex-col items-center gap-3">
                        <PixQrCode
                          payload={buildPixPayload({
                            key: normalizePixPhoneKey(order.pix_key),
                            merchantName: PIX_MERCHANT_NAME,
                            merchantCity: PIX_MERCHANT_CITY,
                            amount: order.total_amount,
                            txid: order.pix_txid,
                          })}
                        />
                        <p className="text-xs text-zinc-500">TXID: {order.pix_txid}</p>
                      </div>
                    )}
                  </div>
                )}
                {(order.status === "pending_payment" || order.status === "payment_reported") && (
                  <button
                    type="button"
                    onClick={() => cancelOrder(order.id)}
                    disabled={cancellingId === order.id}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {cancellingId === order.id ? "Cancelando..." : "Cancelar pedido"}
                  </button>
                )}
                {order.status === "pending_payment" && (
                  <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                    <input
                      value={references[order.id] ?? ""}
                      onChange={(event) =>
                        setReferences((prev) => ({
                          ...prev,
                          [order.id]: event.target.value,
                        }))
                      }
                      placeholder="Referencia do comprovante"
                      className="w-full sm:w-64 rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400 transition"
                    />
                    <button
                      onClick={() => confirmPayment(order.id)}
                      disabled={confirmingId === order.id}
                      className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {confirmingId === order.id ? "Confirmando..." : "Confirmar pagamento"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}
