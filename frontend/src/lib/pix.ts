export const PIX_MERCHANT_NAME = "Scarf Store"
export const PIX_MERCHANT_CITY = "Sao Paulo"

export function sanitizePixText(value: string, maxLen: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLen)
    .toUpperCase()
}

export function normalizePixPhoneKey(value: string) {
  const digits = value.replace(/\D/g, "")
  if (!digits) return ""
  if (value.includes("+")) return `+${digits}`
  if (digits.startsWith("55")) return `+${digits}`
  return `+55${digits}`
}

function tlv(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`
}

function crc16Ccitt(payload: string) {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

export function buildPixPayload({
  key,
  merchantName,
  merchantCity,
  amount,
  txid,
}: {
  key: string
  merchantName: string
  merchantCity: string
  amount: number
  txid: string
}) {
  if (!key || !txid) return ""

  const merchantAccountInfo = tlv("00", "BR.GOV.BCB.PIX") + tlv("01", key)
  const name = sanitizePixText(merchantName, 25)
  const city = sanitizePixText(merchantCity, 15)
  const txidValue = sanitizePixText(txid, 25)
  const amountValue = amount > 0 ? amount.toFixed(2) : ""

  const payload = [
    "000201",
    tlv("26", merchantAccountInfo),
    "52040000",
    "5303986",
    amountValue ? tlv("54", amountValue) : "",
    "5802BR",
    tlv("59", name),
    tlv("60", city),
    txidValue ? tlv("62", tlv("05", txidValue)) : "",
  ].join("")

  const payloadWithCrc = `${payload}6304`
  const crc = crc16Ccitt(payloadWithCrc)
  return `${payloadWithCrc}${crc}`
}
