"use client"

import type React from "react"
import { useState } from "react"
import { useProfile } from "../../../../../hooks/useProfile"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function SecurityTab() {
  const { changePassword, loading, error } = useProfile()

  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  })

  const [success, setSuccess] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasSymbol: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === 'new_password') {
      setPasswordValidation({
        minLength: value.length >= 8,
        hasNumber: /\d/.test(value),
        hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await changePassword(formData)

    if (result) {
      setSuccess(true)
      setFormData({
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      })
      setTimeout(() => setSuccess(false), 5000)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Password changed successfully!</p>
              <p className="text-sm text-green-600">Please use your new password next time you log in.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <section className="border-b pb-6 sm:pb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
            Change Password
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Current Password *
              </label>
              <input
                type="password"
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                placeholder="Enter current password"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New Password *
              </label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                placeholder="Enter new password"
                required
                minLength={8}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    passwordValidation.minLength && passwordValidation.hasNumber && passwordValidation.hasSymbol
                      ? "w-full bg-green-500"
                      : passwordValidation.minLength && passwordValidation.hasNumber
                        ? "w-2/3 bg-yellow-500"
                        : passwordValidation.minLength
                          ? "w-1/3 bg-red-500"
                          : "w-0"
                  }`}
                />
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2">
                  {passwordValidation.minLength ? (
                    <CheckCircle size={14} className="text-green-600" />
                  ) : (
                    <span className="text-red-600 font-bold text-xs">✕</span>
                  )}
                  <span className="text-xs text-gray-600">8 characters minimum</span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordValidation.hasNumber ? (
                    <CheckCircle size={14} className="text-green-600" />
                  ) : (
                    <span className="text-red-600 font-bold text-xs">✕</span>
                  )}
                  <span className="text-xs text-gray-600">Contains a number</span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordValidation.hasSymbol ? (
                    <CheckCircle size={14} className="text-green-600" />
                  ) : (
                    <span className="text-red-600 font-bold text-xs">✕</span>
                  )}
                  <span className="text-xs text-gray-600">Contains a symbol</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm New Password *
              </label>
              <input
                type="password"
                name="confirm_new_password"
                value={formData.confirm_new_password}
                onChange={handleChange}
                placeholder="Confirm new password"
                required
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formData.new_password && formData.confirm_new_password &&
                  formData.new_password !== formData.confirm_new_password
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
              />
              {formData.new_password && formData.confirm_new_password &&
               formData.new_password !== formData.confirm_new_password && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-red-600 mb-2">
            Delete Account
          </h3>
          <p className="text-sm text-red-600 mb-4">
            Deleting your account is permanent and will remove all associated data. This action cannot be undone.
          </p>
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
          >
            Delete Account
          </button>
        </section>

        <div className="flex justify-center sm:justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Changing...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
