export interface ShippingAddress {
  recipient_name: string
  phone: string
  postal_code: string
  street: string
  number: string
  complement?: string | null
  neighborhood: string
  city: string
  state: string
}

export interface UserProfile {
  id: number
  username: string
  email: string | null
  role: "user" | "admin"
  full_name: string | null
  phone: string | null
  postal_code: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  has_shipping_address?: boolean
}

export function profileHasEmail(profile: UserProfile): boolean {
  return Boolean(profile.email?.trim())
}

export function profileHasShippingAddress(profile: UserProfile): boolean {
  if (profile.has_shipping_address === true) {
    return true
  }
  if (profile.has_shipping_address === false) {
    return isShippingComplete(profileToShipping(profile))
  }
  return isShippingComplete(profileToShipping(profile))
}

/** Perfil pronto para comprar: e-mail + endereço completo (mesma regra do backend). */
export function profileReadyForCheckout(profile: UserProfile): boolean {
  return profileHasEmail(profile) && profileHasShippingAddress(profile)
}

export const EMPTY_SHIPPING: ShippingAddress = {
  recipient_name: "",
  phone: "",
  postal_code: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
}

export function isShippingComplete(address: ShippingAddress): boolean {
  return Boolean(
    address.recipient_name.trim() &&
      address.phone.trim() &&
      address.postal_code.replace(/\D/g, "").length === 8 &&
      address.street.trim() &&
      address.number.trim() &&
      address.neighborhood.trim() &&
      address.city.trim() &&
      address.state.trim().length === 2
  )
}

export function profileToShipping(profile: UserProfile): ShippingAddress {
  return {
    recipient_name: profile.full_name?.trim() || profile.username,
    phone: profile.phone?.trim() || "",
    postal_code: profile.postal_code?.trim() || "",
    street: profile.street?.trim() || "",
    number: profile.number?.trim() || "",
    complement: profile.complement?.trim() || "",
    neighborhood: profile.neighborhood?.trim() || "",
    city: profile.city?.trim() || "",
    state: profile.state?.trim().toUpperCase() || "",
  }
}

export function formatShippingLine(order: {
  shipping_address_formatted?: string | null
  shipping_street?: string | null
  shipping_number?: string | null
  shipping_city?: string | null
  shipping_state?: string | null
  shipping_postal_code?: string | null
}): string | null {
  if (order.shipping_address_formatted) return order.shipping_address_formatted
  if (!order.shipping_street) return null
  const parts = [
    `${order.shipping_street}, ${order.shipping_number}`,
    order.shipping_city && order.shipping_state
      ? `${order.shipping_city} - ${order.shipping_state}`
      : null,
    order.shipping_postal_code ? `CEP ${order.shipping_postal_code}` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(" · ") : null
}

export function formatShippingAddressSummary(address: ShippingAddress): string {
  const parts = [
    address.recipient_name,
    `${address.street}, ${address.number}`,
    address.complement,
    address.neighborhood,
    `${address.city} - ${address.state}`,
    `CEP ${address.postal_code}`,
    `Tel: ${address.phone}`,
  ].filter(Boolean)
  return parts.join(" · ")
}
