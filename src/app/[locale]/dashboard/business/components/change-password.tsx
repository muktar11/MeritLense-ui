"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Info, Lock } from "lucide-react"
import { SectionCard } from "./profile/section-card"
import { useProfile } from "../../../../hooks/useProfile"

export function ChangePassword({ id }: { id?: string }) {
  const t = useTranslations("dashboard.indivisual.settings.security-tab")
  const tPage = useTranslations("dashboard.business.company-profile")
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

  const passwordField = (
    name: "current_password" | "new_password" | "confirm_new_password",
    label: string,
    placeholder: string,
    shown: boolean,
    toggle: () => void,
    extraClass = "",
  ) => (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-xs">{label} <span className="text-red-600">*</span></Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={shown ? "text" : "password"}
          value={formData[name]}
          onChange={handleChange}
          placeholder={placeholder}
          required
          minLength={name === "new_password" ? 8 : undefined}
          autoComplete={name === "current_password" ? "current-password" : "new-password"}
          className={`h-9 pe-10 ${extraClass}`}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={label}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {shown ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )

  const check = (ok: boolean, text: string) => (
    <span className="inline-flex items-center gap-1">
      {ok ? <CheckCircle size={12} className="text-green-600" /> : <span className="text-xs font-bold text-red-600">✕</span>}
      <span className="text-xs text-gray-600">{text}</span>
    </span>
  )

  return (
    <SectionCard id={id} icon={Lock} title={tPage("sections.security")} subtitle={tPage("security.subtitle")}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {success && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">{t("success.title")}</p>
              <p className="text-sm text-green-600">{t("success.message")}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          {passwordField("current_password", t("currentPassword"), t("currentPasswordPlaceholder"), showCurrentPassword, () => setShowCurrentPassword(!showCurrentPassword))}
          {passwordField("new_password", t("newPassword"), t("newPasswordPlaceholder"), showNewPassword, () => setShowNewPassword(!showNewPassword))}
          {passwordField(
            "confirm_new_password",
            t("confirmNewPassword"),
            t("confirmNewPasswordPlaceholder"),
            showConfirmPassword,
            () => setShowConfirmPassword(!showConfirmPassword),
            formData.new_password && formData.confirm_new_password && !doPasswordsMatch ? "border-red-500" : "",
          )}
          <Button type="submit" disabled={loading} className="h-9 bg-purple-600 text-white hover:bg-purple-700">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("buttonChanging")}
              </>
            ) : (
              t("buttonChange")
            )}
          </Button>
        </div>

        {formData.new_password && (
          <div className="space-y-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
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
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {check(passwordValidation.minLength, t("strength.minLength"))}
              {check(passwordValidation.hasNumber, t("strength.hasNumber"))}
              {check(passwordValidation.hasSymbol, t("strength.hasSymbol"))}
            </div>
          </div>
        )}
        {formData.new_password && formData.confirm_new_password && !doPasswordsMatch && (
          <p className="text-xs text-red-600">{t("passwordMismatch")}</p>
        )}

        <p className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {tPage("security.note")}
        </p>
      </form>
    </SectionCard>
  )
}
