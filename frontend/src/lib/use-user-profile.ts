"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { api } from "@/lib/api"
import { formatShippingForDisplay } from "@/lib/input-masks"
import {
  formatMissingShippingFields,
  missingShippingFields,
  profileHasEmail,
  profileReadyForCheckout,
  profileToShipping,
  type ShippingAddress,
  type UserProfile,
} from "@/types/shipping"

export const PROFILE_UPDATED_EVENT = "scarf-profile-updated"

export function useUserProfile(enabled: boolean) {
  const pathname = usePathname()
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null)
  const [hasShippingAddress, setHasShippingAddress] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [missingFieldsLabel, setMissingFieldsLabel] = useState("")
  const [isLoading, setIsLoading] = useState(enabled)

  const reload = useCallback(async () => {
    if (!enabled) {
      setShippingAddress(null)
      setHasShippingAddress(false)
      setMissingFields([])
      setMissingFieldsLabel("")
      setIsLoading(false)
      return false
    }

    setIsLoading(true)
    try {
      const data = await api.get<UserProfile>("/users/me")
      const shipping = formatShippingForDisplay(profileToShipping(data))
      const missing = [...missingShippingFields(shipping)]
      if (!profileHasEmail(data)) missing.unshift("e-mail")
      const ready = profileReadyForCheckout(data)
      setShippingAddress(shipping)
      setHasShippingAddress(ready)
      setMissingFields(missing)
      setMissingFieldsLabel(
        missing.length === 0
          ? ""
          : missing.length === 1
            ? missing[0]
            : `${missing.slice(0, -1).join(", ")} e ${missing.at(-1)}`
      )
      return ready
    } catch {
      setShippingAddress(null)
      setHasShippingAddress(false)
      setMissingFields([])
      setMissingFieldsLabel("")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    reload()
  }, [reload, pathname])

  useEffect(() => {
    if (!enabled) return

    const onProfileUpdated = () => {
      reload()
    }
    const onFocus = () => {
      reload()
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated)
    window.addEventListener("focus", onFocus)
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated)
      window.removeEventListener("focus", onFocus)
    }
  }, [enabled, reload])

  return {
    shippingAddress,
    hasShippingAddress,
    missingFields,
    missingFieldsLabel,
    isLoading,
    reload,
  }
}
