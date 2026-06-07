"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatShippingLine } from "@/types/shipping"

interface OrderUser {
  id: number
  username: string
  email?: string | null
}

interface OrderItem {
  product_id: number
  product_name: string
  unit_price: number
  quantity: number
  total_price: number
}

type OrderStatus = "pending_payment" | "payment_reported" | "paid" | "delivered" | "cancelled"

interface Order {
  id: number
  user_id: number
  buyer_username: string
  buyer_email?: string | null
  status: OrderStatus
  payment_method: string
  total_amount: number
  created_at: string
  pix_txid?: string | null
  payment_reference?: string | null
  terms_version?: string | null
  delivery_note?: string | null
  delivered_at?: string | null
  shipping_address_formatted?: string | null
  shipping_street?: string | null
  shipping_number?: string | null
  shipping_city?: string | null
  shipping_state?: string | null
  shipping_postal_code?: string | null
  user?: OrderUser
  items: OrderItem[]
}

function buyerLabel(order: Order) {
  const name = order.buyer_username || order.user?.username || "Cliente"
  const email = order.buyer_email ?? order.user?.email
  return { name, email }
}

const statusStyles: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-50 text-amber-700",
  payment_reported: "bg-sky-50 text-sky-700",
  paid: "bg-emerald-50 text-emerald-700",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-zinc-100 text-zinc-500",
}

const statusLabels: Record<OrderStatus, string> = {
  pending_payment: "Aguardando pagamento",
  payment_reported: "Pagamento informado",
  paid: "Pago — enviar produto",
  delivered: "Entregue",
  cancelled: "Cancelado",
}

function formatPrice(value: number | string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

export default function OrdersPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [savingTrackingId, setSavingTrackingId] = useState<number | null>(null)
  const [deliveryNotes, setDeliveryNotes] = useState<Record<number, string>>({})

  useEffect(() => {
    if (!isLoading && user?.role !== "admin") router.replace("/home")
  }, [isLoading, user, router])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Order[]>("/orders/admin")
      setOrders(data)
      setDeliveryNotes(
        Object.fromEntries(
          data
            .filter((order) => order.delivery_note)
            .map((order) => [order.id, order.delivery_note!])
        )
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar pedidos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const markPaid = useCallback(async (orderId: number) => {
    setConfirmingId(orderId)
    try {
      const updated = await api.post<Order>(`/orders/${orderId}/mark-paid`)
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel confirmar o pagamento")
    } finally {
      setConfirmingId(null)
    }
  }, [])

  const saveTracking = useCallback(async (orderId: number) => {
    const note = (deliveryNotes[orderId] ?? "").trim()
    if (note.length < 3) {
      setError("Informe um codigo de rastreio valido.")
      return
    }
    setSavingTrackingId(orderId)
    setError(null)
    try {
      const updated = await api.post<Order>(`/orders/${orderId}/tracking`, {
        delivery_note: note,
      })
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar o rastreio")
    } finally {
      setSavingTrackingId(null)
    }
  }, [deliveryNotes])

  const markDelivered = useCallback(async (orderId: number) => {
    setConfirmingId(orderId)
    try {
      const note = (deliveryNotes[orderId] ?? "").trim()
      const updated = await api.post<Order>(`/orders/${orderId}/mark-delivered`, {
        delivery_note: note || undefined,
      })
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel registrar a entrega")
    } finally {
      setConfirmingId(null)
    }
  }, [deliveryNotes])

  if (isLoading || user?.role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Pedidos recebidos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Confirme pagamentos e registre entrega (obrigacao do termo aceito pelo cliente)
          </p>
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
          Carregando pedidos...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center text-zinc-400">
          Nenhum pedido registrado ainda.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const buyer = buyerLabel(order)
            return (
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

              <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Cliente</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{buyer.name}</p>
                <p className="text-xs text-zinc-500">ID do usuario: {order.user_id}</p>
                {buyer.email && (
                  <p className="text-xs text-zinc-600 break-all">{buyer.email}</p>
                )}
              </div>

              {formatShippingLine(order) && (
                <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Endereço de entrega
                  </p>
                  <p className="mt-1 text-sm text-zinc-800">{formatShippingLine(order)}</p>
                </div>
              )}

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
                <div className="text-xs text-zinc-500">
                  {order.payment_reference
                    ? `Referencia: ${order.payment_reference}`
                    : order.pix_txid
                    ? `TXID: ${order.pix_txid}`
                    : ""}
                </div>
                {order.terms_version && (
                  <span className="text-xs text-zinc-500">Termo v{order.terms_version} aceito</span>
                )}
                {order.status === "payment_reported" && (
                  <button
                    onClick={() => markPaid(order.id)}
                    disabled={confirmingId === order.id}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {confirmingId === order.id ? "Confirmando..." : "Marcar como pago"}
                  </button>
                )}
                {order.status === "paid" && (
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <input
                      value={deliveryNotes[order.id] ?? order.delivery_note ?? ""}
                      onChange={(e) =>
                        setDeliveryNotes((prev) => ({ ...prev, [order.id]: e.target.value }))
                      }
                      placeholder="Codigo de rastreio"
                      className="w-full sm:w-56 rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={() => saveTracking(order.id)}
                      disabled={savingTrackingId === order.id}
                      className="rounded-lg border border-sky-200 px-4 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                    >
                      {savingTrackingId === order.id ? "Salvando..." : "Salvar rastreio"}
                    </button>
                    <button
                      onClick={() => markDelivered(order.id)}
                      disabled={confirmingId === order.id}
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {confirmingId === order.id ? "Salvando..." : "Registrar entrega"}
                    </button>
                  </div>
                )}
                {order.status === "delivered" && order.delivery_note && (
                  <span className="text-xs text-emerald-700">
                    Rastreio: {order.delivery_note}
                  </span>
                )}
                {order.status === "pending_payment" && (
                  <span className="text-xs text-amber-700">Aguardando cliente informar pagamento</span>
                )}
              </div>
            </div>
          )})}
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
