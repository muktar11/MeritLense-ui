"use client"

import type React from "react"
import { Suspense, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Upload, Loader2, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ProgressStepper from "../components/auth/progress-stepper"
import { useAuth } from "../../../../hooks/useAuth"
import { COMPANY_SIZES, LANGUAGES } from "../../../../api/auth/endpoints"
import type { B2BRegistrationData } from "@/app/api/auth/auth"

export default function EmployerRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    }>
      <EmployerRegistrationContent />
    </Suspense>
  )
}

function EmployerRegistrationContent() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1]
  const { registerB2B, loading, error } = useAuth()

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    company_name: "",
    company_registration_number: "",
    company_size: "",
    country: "",
    city: "",
    preferred_language: "EN",
    phone_number: "",
    website: "",
    industry: "",
    address: "",
    registration_certificate: null as File | null,
    resachetified_license: null as File | null,
    tax_id_document: null as File | null,
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    if (!formData.email) errors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid"

    if (!formData.first_name) errors.first_name = "First name is required"
    if (!formData.last_name) errors.last_name = "Last name is required"

    if (!formData.password) errors.password = "Password is required"
    else if (formData.password.length < 8) errors.password = "Password must be at least 8 characters"

    if (formData.password !== formData.confirm_password) {
      errors.confirm_password = "Passwords do not match"
    }

    if (!formData.company_name) errors.company_name = "Company name is required"
    if (!formData.company_registration_number) errors.company_registration_number = "Registration number is required"
    if (!formData.company_size) errors.company_size = "Company size is required"
    if (!formData.country) errors.country = "Country is required"
    if (!formData.city) errors.city = "City is required"
    if (!formData.phone_number) errors.phone_number = "Phone number is required"

    if (!formData.registration_certificate) errors.registration_certificate = "Registration certificate is required"
    if (!formData.resachetified_license) errors.resachetified_license = "License document is required"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const registrationData: B2BRegistrationData = {
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      password: formData.password,
      confirm_password: formData.confirm_password,
      company_name: formData.company_name,
      company_registration_number: formData.company_registration_number,
      company_size: formData.company_size,
      country: formData.country,
      city: formData.city,
      preferred_language: formData.preferred_language,
      phone_number: formData.phone_number,
      website: formData.website || undefined,
      industry: formData.industry || undefined,
      address: formData.address || undefined,
      registration_certificate: formData.registration_certificate!,
      resachetified_license: formData.resachetified_license!,
      tax_id_document: formData.tax_id_document || undefined,
    }

    const success = await registerB2B(registrationData)
    if (success) {
      localStorage.setItem("registrationEmail", formData.email)
      router.push(`/${locale}/auth/register/email-verify`)
    }
  }

  const FieldError = ({ field }: { field: string }) =>
    formErrors[field] ? <p className="mt-1 text-xs text-destructive">{formErrors[field]}</p> : null

  const FileUploadBox = ({
    field,
    label,
    file,
    required = true,
  }: {
    field: string
    label: string
    file: File | null
    required?: boolean
  }) => (
    <div className="space-y-2">
      <Label>{label} {required && "*"}</Label>
      <label
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition ${
          formErrors[field] ? "border-destructive" : "border-border"
        }`}
      >
        {file ? (
          <>
            <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
            <span className="text-sm text-green-600 text-center truncate max-w-full">{file.name}</span>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Click to upload</span>
          </>
        )}
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileUpload(e, field)}
          className="hidden"
        />
      </label>
      <FieldError field={field} />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProgressStepper currentStep={1} />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-1">Company Registration</h1>
          <p className="text-muted-foreground mb-8">Register your company for B2B evaluations</p>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Information */}
            <div className="space-y-4 border-b pb-6">
              <h2 className="text-lg font-semibold">Account Information</h2>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="company@example.com"
                  className={`h-11 ${formErrors.email ? "border-destructive" : ""}`}
                />
                <FieldError field="email" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="First name"
                    className={`h-11 ${formErrors.first_name ? "border-destructive" : ""}`}
                  />
                  <FieldError field="first_name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    className={`h-11 ${formErrors.last_name ? "border-destructive" : ""}`}
                  />
                  <FieldError field="last_name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min. 8 characters"
                    className={`h-11 ${formErrors.password ? "border-destructive" : ""}`}
                  />
                  <FieldError field="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password *</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    className={`h-11 ${formErrors.confirm_password ? "border-destructive" : ""}`}
                  />
                  <FieldError field="confirm_password" />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4 border-b pb-6">
              <h2 className="text-lg font-semibold">Company Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="TechCorp Solutions"
                    className={`h-11 ${formErrors.company_name ? "border-destructive" : ""}`}
                  />
                  <FieldError field="company_name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_registration_number">Registration Number *</Label>
                  <Input
                    id="company_registration_number"
                    name="company_registration_number"
                    value={formData.company_registration_number}
                    onChange={handleInputChange}
                    placeholder="REG123456"
                    className={`h-11 ${formErrors.company_registration_number ? "border-destructive" : ""}`}
                  />
                  <FieldError field="company_registration_number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_size">Company Size *</Label>
                  <select
                    id="company_size"
                    name="company_size"
                    value={formData.company_size}
                    onChange={handleInputChange}
                    className={`flex h-11 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${
                      formErrors.company_size ? "border-destructive" : "border-input"
                    }`}
                  >
                    <option value="">Select company size</option>
                    {COMPANY_SIZES.map((size) => (
                      <option key={size.key} value={size.key}>{size.label}</option>
                    ))}
                  </select>
                  <FieldError field="company_size" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="Software Development"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                    className={`h-11 ${formErrors.phone_number ? "border-destructive" : ""}`}
                  />
                  <FieldError field="phone_number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="United States"
                    className={`h-11 ${formErrors.country ? "border-destructive" : ""}`}
                  />
                  <FieldError field="country" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="San Francisco"
                    className={`h-11 ${formErrors.city ? "border-destructive" : ""}`}
                  />
                  <FieldError field="city" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Business Ave, Suite 100"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_language">Preferred Language *</Label>
                <select
                  id="preferred_language"
                  name="preferred_language"
                  value={formData.preferred_language}
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.key} value={lang.key}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Document Uploads</h2>

              <div className="grid grid-cols-2 gap-4">
                <FileUploadBox
                  field="registration_certificate"
                  label="Registration Certificate"
                  file={formData.registration_certificate}
                />
                <FileUploadBox
                  field="resachetified_license"
                  label="Business License"
                  file={formData.resachetified_license}
                />
              </div>

              <FileUploadBox
                field="tax_id_document"
                label="Tax ID Document"
                file={formData.tax_id_document}
                required={false}
              />
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
                  Registering Company...
                </>
              ) : (
                "Register Company"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
