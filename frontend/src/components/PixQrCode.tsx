"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"

export function PixQrCode({ payload, size = 260 }: { payload: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!payload) {
      setDataUrl(null)
      return
    }
    QRCode.toDataURL(payload, { width: size, margin: 1 })
      .then(setDataUrl)
      .catch(() => setDataUrl(null))
  }, [payload, size])

  if (!dataUrl) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-xs text-zinc-400"
        style={{ width: size, height: size }}
      >
        QR indisponivel
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={dataUrl} alt="QR Code PIX" width={size} height={size} className="rounded-xl" />
  )
}
