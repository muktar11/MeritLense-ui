"use client"

import type React from "react"
import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ProgressStepper from "../components/auth/progress-stepper"
import TermsConsent from "../components/auth/terms-consent"
import { useAuth } from "../../../../hooks/useAuth"
import { COMPANY_SIZES, LANGUAGES } from "../../../../api/auth/endpoints"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { PhoneInput, phoneIsValid } from "@/components/ui/phone-input"
import { CityInput } from "@/components/ui/city-input"
import { OTHER_COUNTRY, countryName, countryOptions, englishCountryName } from "@/lib/geo"
import { detectCountry, detectTimezone, suggestLanguageFromCountry } from "@/lib/location-detection"
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const tConsent = useTranslations("auth_page.consent")
  const t = useTranslations("auth_page.register_company")
  const tLists = useTranslations("auth_page.lists")
  const tLanguages = useTranslations("dashboard.indivisual.settings.edit-profile-tab.languages")

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
    country_other: "",
    city: "",
    preferred_language: "EN",
    target_market: "",
    timezone: "",
    phone_number: "",
    website: "",
    industry: "",
    address: "",
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Location & Localization: detection only ever pre-fills a field the user
  // hasn't touched yet, and never blocks rendering/submission if it's slow
  // or fails. Tracked outside React state (a ref, not re-rendered on write)
  // since it only needs to be read once, when each async detection resolves.
  const touchedFields = useRef<Set<string>>(new Set())

  useEffect(() => {
    const timezone = detectTimezone()
    if (timezone && !touchedFields.current.has("timezone")) {
      setFormData((prev) => (prev.timezone ? prev : { ...prev, timezone }))
    }

    detectCountry().then((detected) => {
      if (!detected) return
      setFormData((prev) => {
        const next = { ...prev }
        if (!touchedFields.current.has("country") && !prev.country) {
          next.country = detected.countryCode
        }
        if (!touchedFields.current.has("target_market") && !prev.target_market) {
          next.target_market = detected.countryCode
        }
        if (!touchedFields.current.has("preferred_language")) {
          const suggested = suggestLanguageFromCountry(detected.countryCode)
          if (suggested) next.preferred_language = suggested
        }
        return next
      })
    })
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    touchedFields.current.add(name)
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  // For the custom pickers (no native change event).
  const setField = (name: string, value: string) => {
    touchedFields.current.add(name)
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      // The hiring market follows the company's country until changed.
      if (name === "country" && !touchedFields.current.has("target_market") && value !== OTHER_COUNTRY) {
        next.target_market = value
      }
      return next
    })
    setFormErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const countries = countryOptions(locale)
  const countryChoices = countries.map((c) => ({ value: c.code, label: c.name, keywords: c.englishName }))
  const otherChoice = [{ value: OTHER_COUNTRY, label: countryName(OTHER_COUNTRY, locale), keywords: "other" }]
  const pickerText = { searchPlaceholder: tLists("search"), emptyText: tLists("noMatches") }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.email) errors.email = t("errors.emailRequired")
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = t("errors.emailInvalid")

    if (!formData.first_name) errors.first_name = t("errors.firstNameRequired")
    if (!formData.last_name) errors.last_name = t("errors.lastNameRequired")

    if (!formData.password) errors.password = t("errors.passwordRequired")
    else if (formData.password.length < 8) errors.password = t("errors.passwordMin")

    if (formData.password !== formData.confirm_password) {
      errors.confirm_password = t("errors.passwordsMismatch")
    }

    if (!formData.company_name) errors.company_name = t("errors.companyNameRequired")
    if (!formData.company_registration_number) errors.company_registration_number = t("errors.registrationNumberRequired")
    if (!formData.company_size) errors.company_size = t("errors.companySizeRequired")
    if (!formData.country) errors.country = t("errors.countryRequired")
    else if (formData.country === OTHER_COUNTRY && !formData.country_other.trim()) errors.country_other = tLists("otherRequired")
    if (!formData.city.trim()) errors.city = t("errors.cityRequired")
    if (!formData.phone_number) errors.phone_number = t("errors.phoneRequired")
    else if (!phoneIsValid(formData.phone_number)) errors.phone_number = tLists("phoneInvalid")
    if (!termsAccepted) errors.terms_accepted = tConsent("required")

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
      // Stored as the English country name, as before; "Other" sends the typed name.
      country: formData.country === OTHER_COUNTRY ? formData.country_other.trim() : englishCountryName(formData.country),
      city: formData.city.trim(),
      preferred_language: formData.preferred_language,
      target_market: formData.target_market && formData.target_market !== OTHER_COUNTRY ? formData.target_market : undefined,
      timezone: formData.timezone || undefined,
      phone_number: formData.phone_number,
      website: formData.website || undefined,
      industry: formData.industry || undefined,
      address: formData.address || undefined,
      terms_accepted: termsAccepted,
      terms_language: locale === "ar" ? "ar" : "en",
    }

    const success = await registerB2B(registrationData)
    if (success) {
      localStorage.setItem("registrationEmail", formData.email)
      router.push(`/${locale}/auth/register/email-verify`)
    }
  }

  const FieldError = ({ field }: { field: string }) =>
    formErrors[field] ? <p className="mt-1 text-xs text-destructive">{formErrors[field]}</p> : null

  const selectClass = (invalid?: boolean) =>
    `flex h-11 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${
      invalid ? "border-destructive" : "border-input"
    }`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProgressStepper currentStep={1} />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-5 sm:p-8">
          <h1 className="text-2xl font-bold mb-1">{t("title")}</h1>
          <p className="text-muted-foreground mb-8">{t("subtitle")}</p>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Account Information */}
            <div className="space-y-4 border-b pb-6">
              <h2 className="text-lg font-semibold">{t("sections.account")}</h2>

              <div className="space-y-2">
                <Label htmlFor="email">{t("fields.email")} *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  dir="ltr"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.email")}
                  className={`h-11 ${formErrors.email ? "border-destructive" : ""}`}
                />
                <FieldError field="email" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t("fields.password")} *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={t("placeholders.password")}
                      className={`h-11 pe-10 ${formErrors.password ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={t("showPassword")}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <FieldError field="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">{t("fields.confirmPassword")} *</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      placeholder={t("placeholders.confirmPassword")}
                      className={`h-11 pe-10 ${formErrors.confirm_password ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={t("showPassword")}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <FieldError field="confirm_password" />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4 border-b pb-6">
              <h2 className="text-lg font-semibold">{t("sections.company")}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">{t("fields.companyName")} *</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.companyName")}
                    className={`h-11 ${formErrors.company_name ? "border-destructive" : ""}`}
                  />
                  <FieldError field="company_name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_registration_number">{t("fields.registrationNumber")} *</Label>
                  <Input
                    id="company_registration_number"
                    name="company_registration_number"
                    value={formData.company_registration_number}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.registrationNumber")}
                    className={`h-11 ${formErrors.company_registration_number ? "border-destructive" : ""}`}
                  />
                  <FieldError field="company_registration_number" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_size">{t("fields.companySize")} *</Label>
                  <select
                    id="company_size"
                    name="company_size"
                    value={formData.company_size}
                    onChange={handleInputChange}
                    className={selectClass(Boolean(formErrors.company_size))}
                  >
                    <option value="">{t("placeholders.companySize")}</option>
                    {COMPANY_SIZES.map((size) => (
                      <option key={size.key} value={size.key}>{t("companySizes", { range: size.key })}</option>
                    ))}
                  </select>
                  <FieldError field="company_size" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">{t("fields.industry")}</Label>
                  <Input
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder={t("placeholders.industry")}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">{t("fields.country")} *</Label>
                  <SearchableSelect
                    id="country"
                    value={formData.country}
                    options={countryChoices}
                    pinnedLast={otherChoice}
                    onChange={(value) => setField("country", value)}
                    placeholder={t("placeholders.country")}
                    invalid={Boolean(formErrors.country)}
                    {...pickerText}
                  />
                  {formData.country === OTHER_COUNTRY && (
                    <Input
                      id="country_other"
                      name="country_other"
                      value={formData.country_other}
                      onChange={handleInputChange}
                      placeholder={tLists("specifyCountry")}
                      aria-label={tLists("specifyCountry")}
                      className={`h-11 ${formErrors.country_other ? "border-destructive" : ""}`}
                    />
                  )}
                  <FieldError field="country" />
                  <FieldError field="country_other" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t("fields.city")} *</Label>
                  <CityInput
                    id="city"
                    countryCode={formData.country !== OTHER_COUNTRY ? formData.country : ""}
                    value={formData.city}
                    onChange={(value) => setField("city", value)}
                    locale={locale}
                    invalid={Boolean(formErrors.city)}
                    labels={{ select: tLists("selectCity"), search: tLists("searchCity"), type: tLists("typeCity"), empty: tLists("noMatches") }}
                  />
                  <FieldError field="city" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">{t("fields.phone")} *</Label>
                  <PhoneInput
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(value) => setField("phone_number", value)}
                    defaultCountry={formData.country !== OTHER_COUNTRY ? formData.country : undefined}
                    locale={locale}
                    invalid={Boolean(formErrors.phone_number)}
                    labels={{
                      country: tLists("countryCode"),
                      search: tLists("searchCountryCode"),
                      empty: tLists("noMatches"),
                      number: t("fields.phone"),
                    }}
                  />
                  <FieldError field="phone_number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">{t("fields.website")}</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    dir="ltr"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="h-11"
                  />
                </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferred_language">{t("fields.preferredLanguage")} *</Label>
                  <select
                    id="preferred_language"
                    name="preferred_language"
                    value={formData.preferred_language}
                    onChange={handleInputChange}
                    className={selectClass()}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.key} value={lang.key}>{tLanguages(lang.key)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_market">{t("fields.targetMarket")}</Label>
                  <SearchableSelect
                    id="target_market"
                    value={formData.target_market}
                    options={countryChoices}
                    onChange={(value) => setField("target_market", value)}
                    placeholder={t("placeholders.targetMarket")}
                    {...pickerText}
                  />
                  <p className="text-xs text-muted-foreground">{tLists("targetMarketHint")}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{t("documentsNote")}</p>

            <TermsConsent
              variant="b2b"
              checked={termsAccepted}
              onChange={(value) => {
                setTermsAccepted(value)
                if (value) setFormErrors((prev) => ({ ...prev, terms_accepted: "" }))
              }}
              error={formErrors.terms_accepted || undefined}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("buttons.submitting")}
                </>
              ) : (
                t("buttons.submit")
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
