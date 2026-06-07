"use client"

import { useState } from "react"
import { fetchViaCep } from "@/lib/viacep"
import type { ShippingAddress } from "@/types/shipping"

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"

interface ShippingAddressFormProps {
  value: ShippingAddress
  onChange: (value: ShippingAddress) => void
  compact?: boolean
}

export function ShippingAddressForm({ value, onChange, compact }: ShippingAddressFormProps) {
  const [cepLoading, setCepLoading] = useState(false)
  const [cepHint, setCepHint] = useState<string | null>(null)

  const set = (field: keyof ShippingAddress, raw: string) => {
    onChange({ ...value, [field]: raw })
  }

  const lookupCep = async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, "")
    if (digits.length !== 8) {
      setCepHint(null)
      return
    }
    setCepLoading(true)
    setCepHint(null)
    try {
      const data = await fetchViaCep(rawCep)
      if (!data) {
        setCepHint("CEP não encontrado. Preencha o endereço manualmente.")
        return
      }
      onChange({
        ...value,
        postal_code: data.cep || rawCep,
        street: data.logradouro || value.street,
        neighborhood: data.bairro || value.neighborhood,
        city: data.localidade || value.city,
        state: data.uf || value.state,
        complement: value.complement || data.complemento || "",
      })
      setCepHint("Endereço preenchido pelo CEP. Confira e informe o número.")
    } finally {
      setCepLoading(false)
    }
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className={`font-medium text-zinc-900 ${compact ? "text-xs" : "text-sm"}`}>
        Endereço de entrega
      </p>
      <div className={compact ? "grid gap-2" : "grid gap-3 sm:grid-cols-2"}>
        <label className={compact ? "sm:col-span-2" : "sm:col-span-2"}>
          <span className="mb-1 block text-xs text-zinc-500">Nome do destinatário</span>
          <input
            className={inputClass}
            value={value.recipient_name}
            onChange={(e) => set("recipient_name", e.target.value)}
            placeholder="Nome completo"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">Telefone</span>
          <input
            className={inputClass}
            value={value.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">CEP</span>
          <input
            className={inputClass}
            value={value.postal_code}
            onChange={(e) => set("postal_code", e.target.value)}
            onBlur={(e) => lookupCep(e.target.value)}
            placeholder="00000-000"
          />
          {cepLoading && (
            <span className="mt-1 block text-xs text-zinc-400">Buscando CEP...</span>
          )}
          {cepHint && !cepLoading && (
            <span className="mt-1 block text-xs text-amber-700">{cepHint}</span>
          )}
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs text-zinc-500">Rua / Avenida</span>
          <input
            className={inputClass}
            value={value.street}
            onChange={(e) => set("street", e.target.value)}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">Número</span>
          <input
            className={inputClass}
            value={value.number}
            onChange={(e) => set("number", e.target.value)}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">Complemento</span>
          <input
            className={inputClass}
            value={value.complement ?? ""}
            onChange={(e) => set("complement", e.target.value)}
            placeholder="Apto, bloco (opcional)"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">Bairro</span>
          <input
            className={inputClass}
            value={value.neighborhood}
            onChange={(e) => set("neighborhood", e.target.value)}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">Cidade</span>
          <input
            className={inputClass}
            value={value.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">UF *</span>
          <input
            className={inputClass}
            value={value.state}
            onChange={(e) => set("state", e.target.value.toUpperCase().slice(0, 2))}
            placeholder="SP"
            maxLength={2}
            required
          />
        </label>
      </div>
    </div>
  )
}
