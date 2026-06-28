"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useProfile } from "../../../../hooks/useProfile"

export function ChangePassword() {
  const t = useTranslations("dashboard.indivisual.settings.security-tab")
  const { changePassword, loading } = useProfile()

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  })

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasSymbol: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)

    if (name === 'new_password') {
      setPasswordValidation({
        minLength: value.length >= 8,
        hasNumber: /\d/.test(value),
        hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      })
    }
  }

  const validateForm = (): boolean => {
    if (!formData.current_password) {
      setError("Current password is required")
      return false
    }
    
    if (!formData.new_password) {
      setError("New password is required")
      return false
    }

    if (!passwordValidation.minLength || !passwordValidation.hasNumber || !passwordValidation.hasSymbol) {
      setError("New password does not meet security requirements")
      return false
    }

    if (formData.new_password !== formData.confirm_new_password) {
      setError("New passwords do not match")
      return false
    }

    if (formData.current_password === formData.new_password) {
      setError("New password must be different from current password")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const success = await changePassword(formData)
    
    if (success) {
      setSuccess(true)
      setFormData({
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      })
      setPasswordValidation({
        minLength: false,
        hasNumber: false,
        hasSymbol: false,
      })
      
      setTimeout(() => setSuccess(false), 5000)
    }
  }

  const isPasswordValid = passwordValidation.minLength && passwordValidation.hasNumber && passwordValidation.hasSymbol
  const doPasswordsMatch = formData.new_password && formData.confirm_new_password && 
                          formData.new_password === formData.confirm_new_password

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("changePasswordTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">{t("success.title")}</p>
                <p className="text-sm text-green-600">{t("success.message")}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current_password">{t("currentPassword")} *</Label>
            <div className="relative">
              <Input
                id="current_password"
                name="current_password"
                type={showCurrentPassword ? "text" : "password"}
                value={formData.current_password}
                onChange={handleChange}
                placeholder={t("currentPasswordPlaceholder")}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new_password">{t("newPassword")} *</Label>
            <div className="relative">
              <Input
                id="new_password"
                name="new_password"
                type={showNewPassword ? "text" : "password"}
                value={formData.new_password}
                onChange={handleChange}
                placeholder={t("newPasswordPlaceholder")}
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password strength indicator */}
            <div className="mt-2">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isPasswordValid
                      ? "w-full bg-green-500"
                      : passwordValidation.minLength && (passwordValidation.hasNumber || passwordValidation.hasSymbol)
                        ? "w-2/3 bg-yellow-500"
                        : passwordValidation.minLength
                          ? "w-1/3 bg-red-500"
                          : "w-0"
                  }`}
                />
              </div>

              <div className="mt-3 space-y-1.5">
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
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm_new_password">{t("confirmNewPassword")} *</Label>
            <div className="relative">
              <Input
                id="confirm_new_password"
                name="confirm_new_password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirm_new_password}
                onChange={handleChange}
                placeholder={t("confirmNewPasswordPlaceholder")}
                required
                className={`pr-10 ${
                  formData.new_password && formData.confirm_new_password && !doPasswordsMatch
                    ? 'border-red-500 focus:ring-red-500'
                    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.new_password && formData.confirm_new_password && !doPasswordsMatch && (
              <p className="text-xs text-red-600 mt-1">{t("passwordMismatch")}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("buttonChanging")}
              </>
            ) : (
              t("buttonChange")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}