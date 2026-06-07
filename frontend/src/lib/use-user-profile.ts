"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { api } from "@/lib/api"
import {
  profileReadyForCheckout,
  profileToShipping,
  type ShippingAddress,
  type UserProfile,
} from "@/types/shipping"

export const PROFILE_UPDATED_EVENT = "scarf-profile-updated"

export function useUserProfile(enabled: boolean) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null)
  const [hasShippingAddress, setHasShippingAddress] = useState(false)
  const [isLoading, setIsLoading] = useState(enabled)

  const reload = useCallback(async () => {
    if (!enabled) {
      setProfile(null)
      setShippingAddress(null)
      setHasShippingAddress(false)
      setIsLoading(false)
      return null
    }

    setIsLoading(true)
    try {
      const data = await api.get<UserProfile>("/users/me")
      setProfile(data)
      setShippingAddress(profileToShipping(data))
      setHasShippingAddress(profileReadyForCheckout(data))
      return data
    } catch {
      setProfile(null)
      setShippingAddress(null)
      setHasShippingAddress(false)
      return null
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
    profile,
    shippingAddress,
    hasShippingAddress,
    isLoading,
    reload,
  }
}
