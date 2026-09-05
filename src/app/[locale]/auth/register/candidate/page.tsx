"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Upload, Loader2, FileText, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ProgressStepper from "../components/auth/progress-stepper"
import { useAuth } from "../../../../hooks/useAuth"
import { JOB_ROLES, NATIONALITIES, LANGUAGES } from "../../../../api/auth/endpoints"
import type { B2CRegistrationData } from "@/app/api/auth/auth"

export default function CandidateRegistrationPage() {
  const t = useTranslations("auth_page.register_candidate")
  const tZod = useTranslations("zodErrors")
  const tRoles = useTranslations("dashboard.indivisual.settings.edit-profile-tab.jobRoles")
  const tNationalities = useTranslations("dashboard.indivisual.settings.edit-profile-tab.nationalities")
  const tLanguages = useTranslations("dashboard.indivisual.settings.edit-profile-tab.languages")
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1]
  const { registerB2C, loading, error } = useAuth()

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    passport_id: "",
    job_role: "",
    nationality: "",
    preferred_language: "EN",
    phone_number: "",
    date_of_birth: "",
    address: "",
    id_document: null as File | null,
    resume_document: null as File | null,
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, [field]: file }))
      if (formErrors[field]) {
        setFormErrors((prev) => {
          const next = { ...prev }
          delete next[field]
          return next
        })
      }
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.email) errors.email = tZod("email_required")
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = tZod("email_invalid")

    if (!formData.first_name) errors.first_name = t("errors.firstNameRequired")
    if (!formData.last_name) errors.last_name = t("errors.lastNameRequired")

    if (!formData.password) errors.password = t("errors.passwordRequired")
    else if (formData.password.length < 8) errors.password = tZod("password_min_8")

    if (formData.password !== formData.confirm_password) {
      errors.confirm_password = tZod("passwords_not_match")
    }

    if (!formData.passport_id) errors.passport_id = t("errors.passportRequired")
    if (!formData.job_role) errors.job_role = t("errors.jobRoleRequired")
    if (!formData.nationality) errors.nationality = t("errors.nationalityRequired")
    if (!formData.phone_number) errors.phone_number = t("errors.phoneRequired")
    if (!formData.id_document) errors.id_document = t("errors.idDocumentRequired")
    if (!formData.resume_document) errors.resume_document = t("errors.resumeRequired")

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const registrationData: B2CRegistrationData = {
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      password: formData.password,
      confirm_password: formData.confirm_password,
      passport_id: formData.passport_id,
      job_role: formData.job_role,
      nationality: formData.nationality,
      preferred_language: formData.preferred_language,
      phone_number: formData.phone_number,
      date_of_birth: formData.date_of_birth || undefined,
      address: formData.address || undefined,
      id_document: formData.id_document!,
      resume_document: formData.resume_document!,
    }

    const success = await registerB2C(registrationData)
    if (success) {
      localStorage.setItem("registrationEmail", formData.email)
      router.push(`/${locale}/auth/register/email-verify`)
    }
  }

  const FieldError = ({ field }: { field: string }) =>
    formErrors[field] ? <p className="mt-1 text-xs text-destructive">{formErrors[field]}</p> : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProgressStepper currentStep={1} />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-1">{t("pageTitle")}</h1>
          <p className="text-muted-foreground mb-8">{t("pageSubtitle")}</p>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Information */}
            <div className="space-y-4 border-b pb-6">
              <h2 className="text-lg font-semibold">{t("sections.account")}</h2>

              <div className="space-y-2">
                <Label htmlFor="email">{t("fields.email")} *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.email")}
                  className={`h-11 ${formErrors.email ? "border-destructive" : ""}`}
                />
                <FieldError field="email" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">{t("fields.firstName")} *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.firstName")}
                    className={`h-11 ${formErrors.first_name ? "border-destructive" : ""}`}
                  />
                  <FieldError field="first_name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">{t("fields.lastName")} *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.lastName")}
                    className={`h-11 ${formErrors.last_name ? "border-destructive" : ""}`}
                  />
                  <FieldError field="last_name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t("fields.password")} *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.password")}
                    className={`h-11 ${formErrors.password ? "border-destructive" : ""}`}
                  />
                  <FieldError field="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">{t("fields.confirmPassword")} *</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.confirmPassword")}
                    className={`h-11 ${formErrors.confirm_password ? "border-destructive" : ""}`}
                  />
                  <FieldError field="confirm_password" />
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4 border-b pb-6">
              <h2 className="text-lg font-semibold">{t("sections.personal")}</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passport_id">{t("fields.passportId")} *</Label>
                  <Input
                    id="passport_id"
                    name="passport_id"
                    value={formData.passport_id}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.passportId")}
                    className={`h-11 ${formErrors.passport_id ? "border-destructive" : ""}`}
                  />
                  <FieldError field="passport_id" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">{t("fields.phoneNumber")} *</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.phoneNumber")}
                    className={`h-11 ${formErrors.phone_number ? "border-destructive" : ""}`}
                  />
                  <FieldError field="phone_number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">{t("fields.dateOfBirth")}</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("fields.address")}</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.address")}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_role">{t("fields.jobRole")} *</Label>
                  <select
                    id="job_role"
                    name="job_role"
                    value={formData.job_role}
                    onChange={handleInputChange}
                    className={`flex h-11 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${
                      formErrors.job_role ? "border-destructive" : "border-input"
                    }`}
                  >
                    <option value="">{t("placeholders.selectJobRole")}</option>
                    {JOB_ROLES.map((role) => (
                      <option key={role.key} value={role.key}>{tRoles(role.key)}</option>
                    ))}
                  </select>
                  <FieldError field="job_role" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">{t("fields.nationality")} *</Label>
                  <select
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className={`flex h-11 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${
                      formErrors.nationality ? "border-destructive" : "border-input"
                    }`}
                  >
                    <option value="">{t("placeholders.selectNationality")}</option>
                    {NATIONALITIES.map((nation) => (
                      <option key={nation.key} value={nation.key}>{tNationalities(nation.key)}</option>
                    ))}
                  </select>
                  <FieldError field="nationality" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_language">{t("fields.preferredLanguage")} *</Label>
                <select
                  id="preferred_language"
                  name="preferred_language"
                  value={formData.preferred_language}
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.key} value={lang.key}>{tLanguages(lang.key)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{t("sections.documents")}</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("documents.idDocumentLabel")} *</Label>
                  <label
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition ${
                      formErrors.id_document ? "border-destructive" : "border-border"
                    }`}
                  >
                    {formData.id_document ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
                        <span className="text-sm text-green-600 text-center truncate max-w-full">
                          {formData.id_document.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">{t("documents.idDocumentUpload")}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, "id_document")}
                      className="hidden"
                    />
                  </label>
                  <FieldError field="id_document" />
                </div>
                <div className="space-y-2">
                  <Label>{t("documents.resumeLabel")} *</Label>
                  <label
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition ${
                      formErrors.resume_document ? "border-destructive" : "border-border"
                    }`}
                  >
                    {formData.resume_document ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
                        <span className="text-sm text-green-600 text-center truncate max-w-full">
                          {formData.resume_document.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-6 h-6 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">{t("documents.resumeUpload")}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, "resume_document")}
                      className="hidden"
                    />
                  </label>
                  <FieldError field="resume_document" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("buttons.registering")}
                </>
              ) : (
                t("buttons.createAccount")
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
