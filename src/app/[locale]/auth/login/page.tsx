"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Script from "next/script"
import { useTranslations } from "next-intl"
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "../../../hooks/useAuth"

// Google Client IDs are public by design (embedded in every frontend that
// uses Sign In With Google) - no secret involved, safe to ship in source.
const GOOGLE_CLIENT_ID = "238230383068-mp504sgi1oj0rhgl0qq0tlc0smblk8k6.apps.googleusercontent.com"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void
          renderButton: (parent: HTMLElement, options: Record<string, string>) => void
        }
      }
    }
  }
}

const DASHBOARD_ROUTES = {
  SUPERADMIN: "/dashboard/admin",
  ADMIN: "/dashboard/admin",
  B2B: "/dashboard/business",
  B2B_TEAM_MEMBER: "/dashboard/business",
  B2C: "/dashboard/indivisual",
} as const

type UserRole = keyof typeof DASHBOARD_ROUTES

export default function SignInPage() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1]
  const { login, loginWithGoogle, loading, error } = useAuth()
  const t = useTranslations("auth_page.login")
  const tZod = useTranslations("zodErrors")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [localError, setLocalError] = useState("")
  const [googleReady, setGoogleReady] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement>(null)

  const goToDashboard = () => {
    const userRole = localStorage.getItem("userRole") as UserRole
    const dashboardRoute = DASHBOARD_ROUTES[userRole] || "/dashboard"
    router.push(`/${locale}${dashboardRoute}`)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError("")

    if (!email || !password) {
      setLocalError(t("messages.error_fill_all_fields"))
      return
    }

    if (!email.includes("@")) {
      setLocalError(tZod("email_invalid"))
      return
    }

    const success = await login({ email, password })

    if (success) {
      goToDashboard()
    }
  }

  const handleGoogleCredential = async (response: { credential: string }) => {
    setLocalError("")
    const success = await loginWithGoogle(response.credential)
    if (success) {
      goToDashboard()
    }
  }

  useEffect(() => {
    if (!googleReady || !window.google || !googleButtonRef.current) return

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    })
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "rectangular",
      width: "220",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleReady])

  const displayError = localError || error

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setGoogleReady(true)}
      />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">{t("header.title")}</h1>
            <p className="text-muted-foreground">{t("header.subtitle")}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {displayError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm mb-6">
                {displayError}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t("form.label_email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setLocalError("")
                    }}
                    placeholder="you@company.com"
                    className="pl-10 h-11"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("form.label_password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setLocalError("")
                    }}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-11"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={loading}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                    {t("form.remember_me")}
                  </Label>
                </div>
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  {t("form.forgot_password")}
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t("form.button_loading")}
                  </>
                ) : (
                  t("form.button_text")
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">{t("messages.social_divider")}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div ref={googleButtonRef} className="h-11 flex items-center justify-center overflow-hidden" />
              <Button
                variant="outline"
                type="button"
                disabled
                title="Facebook sign-in is coming soon"
                className="h-11 opacity-50 cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-center text-sm text-muted-foreground">
              {t("messages.no_account_prefix")}{" "}
              <Link
                href={`/${locale}/auth/register`}
                className="text-primary hover:text-primary/80 font-medium"
              >
                {t("messages.sign_up_link")}
              </Link>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              {t("messages.terms_prefix")}{" "}
              <Link href={`/${locale}/terms`} className="text-primary hover:text-primary/80">
                {t("messages.terms_link")}
              </Link>{" "}
              {t("messages.and_connector")}{" "}
              <Link href={`/${locale}/privacy`} className="text-primary hover:text-primary/80">
                {t("messages.privacy_link")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
