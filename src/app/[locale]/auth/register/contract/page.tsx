"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import ProgressStepper from "../components/auth/progress-stepper"

export default function ContractPage() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1] // get [locale] from URL

  const [agreed, setAgreed] = useState(false)

  const handleAgree = () => {
    if (!agreed) {
      alert("Please agree to the terms and conditions")
      return
    }

    localStorage.setItem("contractAgreed", "true")
    router.push(`/${locale}/auth/register/success`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
     

      {/* Progress Stepper */}
      <ProgressStepper currentStep={4} />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl bg-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold mb-8">Terms of Agreement</h1>

          {/* Terms Content */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 max-h-96 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
            <div className="text-sm text-gray-700 space-y-4">
              <p>
                1. These Website Standard Terms and Conditions written on this webpage shall manage your use of our
                website, Website Name accessible at Website URL.
              </p>
              <p>
                2. By using our Website, you accepted these terms and conditions in full. If you disagree with these
                terms and conditions or any part of these terms and conditions, you must not use our Website.
              </p>
              <p>
                3. Intellectual Property Rights. Unless otherwise stated, we own the intellectual property rights in the
                website and material on the website. Subject to the license below, all these intellectual property
                rights are reserved.
              </p>
              <p>
                4. License to use Website. You may view, download for caching purposes only, and print pages from the
                website for your own personal use, subject to restrictions set out below and elsewhere in these terms
                and conditions.
              </p>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">I agree to the Terms and Conditions</span>
            </label>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-700 font-medium">
              ← Previous
            </button>
            <button
              onClick={handleAgree}
              className={`${
                agreed ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
              } text-white font-medium px-6 py-2 rounded-lg transition`}
              disabled={!agreed}
            >
              Agree and Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
