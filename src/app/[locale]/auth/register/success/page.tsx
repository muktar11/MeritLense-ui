"use client"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import ProgressStepper from "../components/auth/progress-stepper"

export default function SuccessPage() {
  
 const router = useRouter()
  const locale = useLocale() // ✅ current locale
  const handleGetStarted = () => {
    localStorage.setItem("isAuthenticated", "true")
   router.push(`/${locale}/auth/login`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
     
     

      {/* Progress Stepper */}
      <ProgressStepper currentStep={5} />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          {/* Success Illustration */}
          <div className="mb-8">
            <div className="inline-block bg-white rounded-full p-8 shadow-lg">
              <svg className="w-24 h-24 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">You are successfully registered!</h1>
          <p className="text-gray-600 mb-8">
            Welcome to our platform. Your account has been created and is ready to use.
          </p>

          {/* Get Started Button */}
          <button
            onClick={handleGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg inline-flex items-center gap-2 transition"
          >
            Let's Start
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
