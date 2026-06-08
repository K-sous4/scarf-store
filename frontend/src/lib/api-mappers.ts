/** Campos expostos ao catálogo público — sem custo, SKU ou estoque interno. */

export interface PublicProduct {
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
  is_active: boolean
  images: string[] | null
  available_stock: number
  is_low_stock: boolean
}

export interface PurchaseOrderItem {
  product_id: number | null
  product_name: string
  unit_price: number
  quantity: number
  total_price: number
}

export type PurchaseOrderStatus =
  | "pending_payment"
  | "payment_reported"
  | "paid"
  | "delivered"
  | "cancelled"

export interface PurchaseOrder {
  id: number
  status: PurchaseOrderStatus
  payment_method: string
  total_amount: number
  created_at: string
  pix_txid?: string | null
  pix_key?: string | null
  payment_reference?: string | null
  terms_version?: string | null
  delivered_at?: string | null
  delivery_note?: string | null
  shipping_address_formatted?: string | null
  shipping_street?: string | null
  shipping_number?: string | null
  shipping_city?: string | null
  shipping_state?: string | null
  shipping_postal_code?: string | null
  items: PurchaseOrderItem[]
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toOptionalString(value: unknown): string | null {
  if (value == null || value === "") return null
  return String(value)
}

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object" && "products" in data) {
    const products = (data as { products: unknown }).products
    return Array.isArray(products) ? products : []
  }
  return []
}

export function mapPublicProduct(raw: Record<string, unknown>): PublicProduct {
  return {
    id: toNumber(raw.id),
    name: String(raw.name ?? ""),
    short_description: toOptionalString(raw.short_description),
    price: toNumber(raw.price),
    discount_percentage: toNumber(raw.discount_percentage),
    discount_price: raw.discount_price != null ? toNumber(raw.discount_price) : null,
    category: String(raw.category ?? ""),
    color: toOptionalString(raw.color),
    material: toOptionalString(raw.material),
    is_new: Boolean(raw.is_new),
    is_featured: Boolean(raw.is_featured),
    is_active: raw.is_active !== false,
    images: Array.isArray(raw.images) ? (raw.images as string[]) : null,
    available_stock: toNumber(raw.available_stock),
    is_low_stock: Boolean(raw.is_low_stock),
  }
}

export function mapPublicProducts(data: unknown): PublicProduct[] {
  return extractList(data).map((item) =>
    mapPublicProduct(item && typeof item === "object" ? (item as Record<string, unknown>) : {})
  )
}

function mapPurchaseOrderItem(raw: Record<string, unknown>): PurchaseOrderItem {
  return {
    product_id: raw.product_id != null ? toNumber(raw.product_id) : null,
    product_name: String(raw.product_name ?? ""),
    unit_price: toNumber(raw.unit_price),
    quantity: toNumber(raw.quantity),
    total_price: toNumber(raw.total_price),
  }
}

export function mapPurchaseOrder(raw: Record<string, unknown>): PurchaseOrder {
  const items = Array.isArray(raw.items) ? raw.items : []
  return {
    id: toNumber(raw.id),
    status: String(raw.status ?? "pending_payment") as PurchaseOrderStatus,
    payment_method: String(raw.payment_method ?? "pix"),
    total_amount: toNumber(raw.total_amount),
    created_at: String(raw.created_at ?? ""),
    pix_txid: toOptionalString(raw.pix_txid),
    pix_key: toOptionalString(raw.pix_key),
    payment_reference: toOptionalString(raw.payment_reference),
    terms_version: toOptionalString(raw.terms_version),
    delivered_at: toOptionalString(raw.delivered_at),
    delivery_note: toOptionalString(raw.delivery_note),
    shipping_address_formatted: toOptionalString(raw.shipping_address_formatted),
    shipping_street: toOptionalString(raw.shipping_street),
    shipping_number: toOptionalString(raw.shipping_number),
    shipping_city: toOptionalString(raw.shipping_city),
    shipping_state: toOptionalString(raw.shipping_state),
    shipping_postal_code: toOptionalString(raw.shipping_postal_code),
    items: items.map((item) =>
      mapPurchaseOrderItem(item && typeof item === "object" ? (item as Record<string, unknown>) : {})
    ),
  }
}

export function mapPurchaseOrders(data: unknown): PurchaseOrder[] {
  if (!Array.isArray(data)) return []
  return data.map((item) =>
    mapPurchaseOrder(item && typeof item === "object" ? (item as Record<string, unknown>) : {})
  )
}
