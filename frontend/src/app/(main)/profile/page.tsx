"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShippingAddressForm } from "@/components/ShippingAddressForm"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import {
  EMPTY_SHIPPING,
  isShippingComplete,
  profileToShipping,
  type ShippingAddress,
  type UserProfile,
} from "@/types/shipping"

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [shipping, setShipping] = useState<ShippingAddress>(EMPTY_SHIPPING)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<UserProfile>("/users/me")
      setUsername(data.username)
      setEmail(data.email ?? "")
      setShipping(profileToShipping(data))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel carregar o perfil")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login")
      return
    }
    if (user) loadProfile()
  }, [authLoading, user, router, loadProfile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const body: Record<string, string | null> = {
        username: username.trim() || undefined,
        email: email.trim() || null,
        full_name: shipping.recipient_name.trim() || null,
        phone: shipping.phone.trim() || null,
        postal_code: shipping.postal_code.trim() || null,
        street: shipping.street.trim() || null,
        number: shipping.number.trim() || null,
        complement: shipping.complement?.trim() || null,
        neighborhood: shipping.neighborhood.trim() || null,
        city: shipping.city.trim() || null,
        state: shipping.state.trim() || null,
      }
      if (newPassword) {
        body.current_password = currentPassword
        body.new_password = newPassword
      }
      await api.put<UserProfile>("/users/me", body)
      setSuccess("Perfil atualizado com sucesso.")
      setCurrentPassword("")
      setNewPassword("")
      await loadProfile()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
        <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 mr-3" />
        Carregando perfil...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Meu perfil</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atualize seus dados e o endereço usado nas entregas.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Conta</h2>
          <label>
            <span className="mb-1 block text-xs text-zinc-500">Nome de usuário</span>
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-zinc-500">E-mail</span>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <ShippingAddressForm value={shipping} onChange={setShipping} />
          {!isShippingComplete(shipping) && (
            <p className="mt-3 text-xs text-amber-700">
              Preencha o endereço completo para finalizar compras com entrega.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">Alterar senha</h2>
          <p className="text-xs text-zinc-500">Deixe em branco se nao quiser alterar.</p>
          <label>
            <span className="mb-1 block text-xs text-zinc-500">Senha atual</span>
            <input
              type="password"
              className={inputClass}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-zinc-500">Nova senha</span>
            <input
              type="password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
            />
          </label>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
          <Link
            href="/home"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition"
          >
            Voltar à loja
          </Link>
        </div>
      </form>
    </div>
  )
}
