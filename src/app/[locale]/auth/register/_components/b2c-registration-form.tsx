"use client"

import { useRouter } from "next/navigation"
import ProgressStepper from "../components/auth/progress-stepper"

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-600 rounded-lg"></div>
        <select className="text-sm text-gray-600">
          <option>Eng</option>
        </select>
      </div>

      {/* Progress Stepper */}
      <ProgressStepper currentStep={0} />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
          <p className="text-center text-gray-600 mb-8">Select your account type to get started</p>

          <div className="space-y-4">
            {/* Candidate Registration */}
            <button
              onClick={() => router.push("/auth/register/candidate")}
              className="w-full border-2 border-gray-300 p-6 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <div className="text-lg font-semibold text-gray-900">Candidate</div>
              <p className="text-sm text-gray-600 mt-1">Register as a job candidate</p>
            </button>

            {/* Employee Registration */}
            <button
              onClick={() => router.push("/auth/register/employee")}
              className="w-full border-2 border-gray-300 p-6 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <div className="text-lg font-semibold text-gray-900">Employer</div>
              <p className="text-sm text-gray-600 mt-1">Register as an employer or manager</p>
            </button>
          </div>

          {/* Sign In Link */}
          <p className="text-center mt-8 text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/auth/sign-in")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
