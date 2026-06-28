"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { setAuthToken } from "@/app/api/auth/client"

const DASHBOARD_ROUTES = {
  SUPERADMIN: "/dashboard/admin",
  ADMIN: "/dashboard/admin",
  B2B: "/dashboard/business",
  B2B_TEAM_MEMBER: "/dashboard/business",
  B2C: "/dashboard/indivisual",
} as const

type UserRole = keyof typeof DASHBOARD_ROUTES

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1]
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    const role = localStorage.getItem("userRole") as UserRole | null

    if (!token || !role) {
      router.replace(`/${locale}/auth/login`)
      return
    }

    setAuthToken(token)

    if (allowedRoles && !allowedRoles.includes(role)) {
      const correctRoute = DASHBOARD_ROUTES[role]
      if (correctRoute) {
        router.replace(`/${locale}${correctRoute}`)
      } else {
        router.replace(`/${locale}/auth/login`)
      }
      return
    }

    setIsAuthorized(true)
    setIsChecking(false)
  }, [router, pathname, locale, allowedRoles])

  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
