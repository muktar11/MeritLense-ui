"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2, Mail, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import ProgressStepper from "../components/auth/progress-stepper"
import { useAuth } from "../../../../hooks/useAuth"

export default function EmailVerifyPage() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1]
  const { verifyEmail, resendVerification, loading, error } = useAuth()

  const [code, setCode] = useState(["", "", "", "", ""])
  const [email, setEmail] = useState("")
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    const storedEmail = localStorage.getItem("registrationEmail")
    if (storedEmail) {
      setEmail(storedEmail)
    } else {
      router.push(`/${locale}/auth/register`)
    }
  }, [locale, router])

  const handleCodeChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 4) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement
      nextInput?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement
      prevInput?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5)
    if (pastedData.length > 0) {
      const newCode = [...code]
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i]
      }
      setCode(newCode)
      const focusIndex = Math.min(pastedData.length, 4)
      const input = document.getElementById(`code-${focusIndex}`) as HTMLInputElement
      input?.focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join("")
    if (fullCode.length !== 5) return

    const success = await verifyEmail({ email, code: fullCode })
    if (success) {
      router.push(`/${locale}/auth/login`)
    }
  }

  const handleResendCode = async () => {
    const success = await resendVerification(email)
    if (success) {
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000)
    }
  }

  const isCodeComplete = code.every((digit) => digit !== "")

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProgressStepper currentStep={2} />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
          <p className="text-muted-foreground mb-1">We sent a 5-digit code to:</p>
          <p className="font-semibold text-foreground mb-6">{email}</p>

          <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleCodeChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                maxLength={1}
                className="w-12 h-14 text-center border-2 border-input rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-lg font-semibold transition"
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {resendSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-600">Verification code resent!</p>
            </div>
          )}

          <Button
            onClick={handleVerify}
            disabled={!isCodeComplete || loading}
            className="w-full h-11 mb-4"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>

          <div className="space-y-2">
            <button
              onClick={handleResendCode}
              disabled={loading}
              className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50"
            >
              Didn&apos;t receive a code? Resend
            </button>

            <button
              onClick={() => router.push(`/${locale}/auth/register`)}
              disabled={loading}
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 block mx-auto"
            >
              Wrong email? Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
