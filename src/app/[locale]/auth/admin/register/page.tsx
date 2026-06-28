"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronDown, Upload, ArrowRight } from "lucide-react"

const ROLES = ["Admin", "Viewer", "Recruiter", "Super Admin"]

export default function AdminRegisterPage() {
   const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1]
  const [formData, setFormData] = useState({
    email: "",
    nationalId: "",
    mobileNumber: "",
    role: "",
    document: null as File | null,
  })
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleRoleSelect = (role: string) => {
    setFormData((prev) => ({ ...prev, role }))
    setIsRoleOpen(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, document: file }))
    }
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.nationalId || !formData.mobileNumber || !formData.role) {
      setError("Please fill in all required fields")
      return
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    // Store admin registration data
    localStorage.setItem(
      "adminRegistration",
      JSON.stringify({
        ...formData,
        document: formData.document?.name || null,
      }),
    )

    // ✅ locale-aware route
    router.push(`/${locale}/auth/admin/verify-sms`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">Role-based Authentication</h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5 mt-6">
              {/* Email & National ID Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="youremail@gmail.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">National ID</label>
                  <input
                    type="text"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleInputChange}
                    placeholder="23123332123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  placeholder="82 123 123 321"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Role Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insert Role</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsRoleOpen(!isRoleOpen)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className={formData.role ? "text-gray-900" : "text-gray-400"}>
                      {formData.role || "Select role"}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`text-gray-500 transition-transform ${isRoleOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isRoleOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleSelect(role)}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload household license :</label>
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition">
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-blue-600">Click to upload or drag and drop</span>
                  <span className="text-xs text-gray-500">pdf & csv</span>
                  <input type="file" accept=".pdf,.csv" onChange={handleFileChange} className="hidden" />
                  {formData.document && <span className="mt-2 text-sm text-green-600">{formData.document.name}</span>}
                </label>
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
