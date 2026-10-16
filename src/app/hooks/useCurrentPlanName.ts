"use client"

import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import paymentService from "@/app/api/payments/endpoints"
import { localizedPlanName } from "@/app/api/payments/types"

// The account's active plan for the header badge, in the page language.
// null while loading, when there is no active plan, or when the user may
// not see billing (team members without the payment permission).
let cached: Promise<string | null> | null = null

function loadPlanName(): Promise<string | null> {
  cached ??= paymentService
    .getAllSubscriptions()
    .then((subs) => {
      const active = (subs || [])
        .filter((s) => ["ACTIVE", "TRIALING"].includes(String(s.status).toUpperCase()))
        .sort((a, b) => new Date(b.current_period_end).getTime() - new Date(a.current_period_end).getTime())[0]
      return active?.plan_name || null
    })
    .catch(() => {
      cached = null
      return null
    })
  return cached
}

export function useCurrentPlanName(): string | null {
  const locale = useLocale()
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    loadPlanName().then((n) => {
      if (active) setName(n)
    })
    return () => {
      active = false
    }
  }, [])
  return name ? localizedPlanName(name, locale) : null
}
