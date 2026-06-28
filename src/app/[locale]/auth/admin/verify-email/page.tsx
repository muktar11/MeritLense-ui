"use client"


import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ArrowRight } from "lucide-react"
import ProgressStepper from "../../register/components/auth/progress-stepper"

export default function AdminEmailVerifyPage() {
  const router = useRouter()
    const pathname = usePathname()
    const locale = pathname.split("/")[1]
  const [code, setCode] = useState(["", "", "", "", ""])
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]


  useEffect(() => {
    const regData = localStorage.getItem("adminRegistration")
    if (regData) {
      const data = JSON.parse(regData)
      setEmail(data.email || "admin@example.com")
    }
  }, [])

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs[index + 1].current?.focus()
    }
  }

  
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate code (dummy validation - any 5 digits work)
    if (code.some((c) => !c)) {
      setError("Please enter the complete verification code")
      return
    }

    // Update registration as verified
    const regData = localStorage.getItem("adminRegistration")
    if (regData) {
      const data = JSON.parse(regData)
      localStorage.setItem(
        "adminRegistration",
        JSON.stringify({
          ...data,
          emailVerified: true,
        }),
      )
    }

  // Redirect to contract page
    router.push(`/${locale}/auth/register/contract`)
  }

  const handleResend = () => {
    setCode(["", "", "", "", ""])
    setError("")
    // Simulate resending code
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
     

     

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-lg p-10">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Verify your email</h1>
            <p className="text-center text-gray-600 mb-8">We just sent 5-digit code to {email}, enter it bellow:</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              {/* Code Inputs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Code</label>
                <div className="flex gap-3 justify-center">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-14 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                Verify email
              </button>

              {/* Resend Link */}
              <p className="text-center text-sm text-gray-600">
                Wrong email?{" "}
                <button type="button" onClick={handleResend} className="text-blue-600 hover:text-blue-700 font-medium">
                  Send to different email
                </button>
              </p>
            </form>
          </div>

          {/* Next Step Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleVerify}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 transition"
            >
              Next Step
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
