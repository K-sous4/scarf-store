/** Mantém apenas dígitos. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "")
}

/** Telefone BR: (11) 99999-9999 ou (11) 9999-9999 */
export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** CEP: 00000-000 */
export function maskCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

/** UF: somente letras, 2 caracteres. */
export function maskUf(value: string): string {
  return value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2)
}

/** Número do imóvel: dígitos ou S/N. */
export function maskHouseNumber(value: string): string {
  const upper = value.toUpperCase()
  if (/S|N|\//.test(upper)) {
    return upper.replace(/[^0-9SN/]/g, "").slice(0, 6)
  }
  return onlyDigits(value).slice(0, 8)
}

/** Nome de cidade/bairro: letras, espaços e acentos. */
export function maskCityName(value: string): string {
  return value.replace(/[0-9]/g, "").slice(0, 100)
}

/** Nome de pessoa: letras, espaços e acentos. */
export function maskPersonName(value: string): string {
  return value.replace(/[0-9]/g, "").slice(0, 120)
}

/** Usuário: letras, números e underscore. */
export function maskUsername(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 50)
}

/** Aplica máscaras de exibição ao carregar perfil/endereço. */
export function formatShippingForDisplay(address: {
  recipient_name: string
  phone: string
  postal_code: string
  number: string
  state: string
  city: string
  neighborhood: string
  street: string
  complement?: string | null
}): typeof address {
  return {
    ...address,
    recipient_name: maskPersonName(address.recipient_name),
    phone: maskPhone(address.phone),
    postal_code: maskCep(address.postal_code),
    number: maskHouseNumber(address.number),
    state: maskUf(address.state),
    city: maskCityName(address.city),
    neighborhood: maskCityName(address.neighborhood),
  }
}
