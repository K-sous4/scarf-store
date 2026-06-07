"use client"

import { useState } from "react"
import { fetchViaCep } from "@/lib/viacep"
import {
  formatShippingForDisplay,
  maskCep,
  maskCityName,
  maskHouseNumber,
  maskPersonName,
  maskPhone,
  maskUf,
} from "@/lib/input-masks"
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

  const update = (patch: Partial<ShippingAddress>) => {
    onChange({ ...value, ...patch })
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
      const filled = formatShippingForDisplay({
        ...value,
        postal_code: maskCep(data.cep || rawCep),
        street: data.logradouro || value.street,
        neighborhood: maskCityName(data.bairro || value.neighborhood),
        city: maskCityName(data.localidade || value.city),
        state: maskUf(data.uf || value.state),
        complement: value.complement || data.complemento || "",
      })
      onChange(filled)
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
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs text-zinc-500">Nome do destinatário *</span>
          <input
            className={inputClass}
            value={value.recipient_name}
            onChange={(e) => update({ recipient_name: maskPersonName(e.target.value) })}
            placeholder="Nome completo"
            autoComplete="name"
            required
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">Telefone *</span>
          <input
            className={inputClass}
            type="tel"
            inputMode="numeric"
            value={value.phone}
            onChange={(e) => update({ phone: maskPhone(e.target.value) })}
            placeholder="(11) 99999-9999"
            autoComplete="tel"
            maxLength={15}
            required
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">CEP *</span>
          <input
            className={inputClass}
            type="text"
            inputMode="numeric"
            value={value.postal_code}
            onChange={(e) => update({ postal_code: maskCep(e.target.value) })}
            onBlur={(e) => lookupCep(e.target.value)}
            placeholder="00000-000"
            autoComplete="postal-code"
            maxLength={9}
            required
          />
          {cepLoading && (
            <span className="mt-1 block text-xs text-zinc-400">Buscando CEP...</span>
          )}
          {cepHint && !cepLoading && (
            <span className="mt-1 block text-xs text-amber-700">{cepHint}</span>
          )}
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs text-zinc-500">Rua / Avenida *</span>
          <input
            className={inputClass}
            value={value.street}
            onChange={(e) => update({ street: e.target.value.slice(0, 200) })}
            autoComplete="street-address"
            required
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">Número *</span>
          <input
            className={inputClass}
            value={value.number}
            onChange={(e) => update({ number: maskHouseNumber(e.target.value) })}
            placeholder="424 ou S/N"
            inputMode="text"
            required
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">Complemento</span>
          <input
            className={inputClass}
            value={value.complement ?? ""}
            onChange={(e) => update({ complement: e.target.value.slice(0, 80) })}
            placeholder="Apto, bloco (opcional)"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">Bairro *</span>
          <input
            className={inputClass}
            value={value.neighborhood}
            onChange={(e) => update({ neighborhood: maskCityName(e.target.value) })}
            required
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">Cidade *</span>
          <input
            className={inputClass}
            value={value.city}
            onChange={(e) => update({ city: maskCityName(e.target.value) })}
            autoComplete="address-level2"
            required
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-zinc-500">UF *</span>
          <input
            className={inputClass}
            value={value.state}
            onChange={(e) => update({ state: maskUf(e.target.value) })}
            placeholder="SP"
            autoComplete="address-level1"
            maxLength={2}
            required
          />
        </label>
      </div>
    </div>
  )
}
