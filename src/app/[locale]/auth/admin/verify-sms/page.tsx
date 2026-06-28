"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react"

export default function AdminSMSVerifyPage() {
  const router = useRouter()
    const pathname = usePathname()
    const locale = pathname.split("/")[1]
  const [mobileNumber, setMobileNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+1")
  const [code, setCode] = useState(["", "", "", ""])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(125)
  const [error, setError] = useState("")
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    // Get registration data
    const regData = localStorage.getItem("adminRegistration")
    if (regData) {
      const data = JSON.parse(regData)
      setEmail(data.email || "")
      setMobileNumber(data.mobileNumber || "")
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatCountdown = () => {
    const mins = Math.floor(countdown / 60)
    const secs = countdown % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate code (dummy validation - any 4 digits work)
    if (code.some((c) => !c)) {
      setError("Please enter the complete verification code")
      return
    }

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    // Update registration with password
    const regData = localStorage.getItem("adminRegistration")
    if (regData) {
      const data = JSON.parse(regData)
      localStorage.setItem(
        "adminRegistration",
        JSON.stringify({
          ...data,
          email,
          password,
          verified: true,
        }),
      )
    }

     router.push(`/${locale}/auth/admin/verify-email`)
  }

  const formattedPhone = `${countryCode} ${mobileNumber.slice(0, 3)}-${mobileNumber.slice(3, 6)}-${mobileNumber.slice(6, 8)}-${mobileNumber.slice(8, 10)}`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
     

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">Verify using SMS</h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-3 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+91">+91</option>
                    <option value="+234">+234</option>
                  </select>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="345 567 23 56"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* SMS Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code from SMS</label>
                <div className="flex gap-3">
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

              {/* SMS Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800">SMS was sent to your number {formattedPhone}</p>
                  <p className="text-sm text-blue-600">It will be valid for {formatCountdown()}</p>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="youremail@gmail.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Create Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                Register
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
