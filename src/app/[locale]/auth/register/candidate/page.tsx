"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ProgressStepper from "../components/auth/progress-stepper"
import TermsConsent from "../components/auth/terms-consent"
import { useAuth } from "../../../../hooks/useAuth"
import { LANGUAGES } from "../../../../api/auth/endpoints"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { PhoneInput, phoneIsValid } from "@/components/ui/phone-input"
import { CityInput } from "@/components/ui/city-input"
import { OTHER_COUNTRY, countryName, countryOptions } from "@/lib/geo"
import { detectCountry, detectTimezone, suggestLanguageFromCountry } from "@/lib/location-detection"
import type { B2CRegistrationData } from "@/app/api/auth/auth"

export default function CandidateRegistrationPage() {
  const t = useTranslations("auth_page.register_candidate")
  const tZod = useTranslations("zodErrors")
  const tConsent = useTranslations("auth_page.consent")
  const tLists = useTranslations("auth_page.lists")
  const tLanguages = useTranslations("dashboard.indivisual.settings.edit-profile-tab.languages")
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1]
  const { registerB2C, loading, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    passport_id: "",
    nationality: "",
    nationality_other: "",
    preferred_language: "EN",
    country_of_residence: "",
    country_of_residence_other: "",
    target_market: "",
    target_city: "",
    timezone: "",
    phone_number: "",
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
        if (!touchedFields.current.has("country_of_residence") && !prev.country_of_residence) {
          next.country_of_residence = detected.countryCode
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      // The hiring market follows the country of residence until the user
      // picks a different one.
      if (name === "country_of_residence" && !touchedFields.current.has("target_market") && value !== OTHER_COUNTRY) {
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
    if (!formData.nationality) errors.nationality = t("errors.nationalityRequired")
    if (formData.nationality === OTHER_COUNTRY && !formData.nationality_other.trim()) {
      errors.nationality_other = tLists("otherRequired")
    }
    if (formData.country_of_residence === OTHER_COUNTRY && !formData.country_of_residence_other.trim()) {
      errors.country_of_residence_other = tLists("otherRequired")
    }
    if (!formData.phone_number) errors.phone_number = t("errors.phoneRequired")
    else if (!phoneIsValid(formData.phone_number)) errors.phone_number = tLists("phoneInvalid")
    if (!termsAccepted) errors.terms_accepted = tConsent("required")
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
      nationality: formData.nationality,
      nationality_other: formData.nationality === OTHER_COUNTRY ? formData.nationality_other.trim() : undefined,
      preferred_language: formData.preferred_language,
      country_of_residence: formData.country_of_residence || undefined,
      country_of_residence_other:
        formData.country_of_residence === OTHER_COUNTRY ? formData.country_of_residence_other.trim() : undefined,
      target_market: formData.target_market && formData.target_market !== OTHER_COUNTRY ? formData.target_market : undefined,
      target_city: formData.target_city.trim() || undefined,
      timezone: formData.timezone || undefined,
      phone_number: formData.phone_number,
      address: formData.address || undefined,
      terms_accepted: termsAccepted,
      terms_language: locale === "ar" ? "ar" : "en",
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
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
                  <PhoneInput
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(value) => setField("phone_number", value)}
                    defaultCountry={formData.country_of_residence !== OTHER_COUNTRY ? formData.country_of_residence : undefined}
                    locale={locale}
                    invalid={Boolean(formErrors.phone_number)}
                    labels={{
                      country: tLists("countryCode"),
                      search: tLists("searchCountryCode"),
                      empty: tLists("noMatches"),
                      number: t("fields.phoneNumber"),
                    }}
                  />
                  <FieldError field="phone_number" />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality">{t("fields.nationality")} *</Label>
                  <SearchableSelect
                    id="nationality"
                    value={formData.nationality}
                    options={countryChoices}
                    pinnedLast={otherChoice}
                    onChange={(value) => setField("nationality", value)}
                    placeholder={t("placeholders.selectNationality")}
                    invalid={Boolean(formErrors.nationality)}
                    {...pickerText}
                  />
                  {formData.nationality === OTHER_COUNTRY && (
                    <Input
                      id="nationality_other"
                      name="nationality_other"
                      value={formData.nationality_other}
                      onChange={handleInputChange}
                      placeholder={tLists("specifyNationality")}
                      aria-label={tLists("specifyNationality")}
                      className={`h-11 ${formErrors.nationality_other ? "border-destructive" : ""}`}
                    />
                  )}
                  <FieldError field="nationality_other" />
                  <FieldError field="nationality" />
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


              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country_of_residence">{t("fields.countryOfResidence")}</Label>
                  <SearchableSelect
                    id="country_of_residence"
                    value={formData.country_of_residence}
                    options={countryChoices}
                    pinnedLast={otherChoice}
                    onChange={(value) => setField("country_of_residence", value)}
                    placeholder={t("placeholders.selectCountry")}
                    {...pickerText}
                  />
                  {formData.country_of_residence === OTHER_COUNTRY && (
                    <Input
                      id="country_of_residence_other"
                      name="country_of_residence_other"
                      value={formData.country_of_residence_other}
                      onChange={handleInputChange}
                      placeholder={tLists("specifyCountry")}
                      aria-label={tLists("specifyCountry")}
                      className={`h-11 ${formErrors.country_of_residence_other ? "border-destructive" : ""}`}
                    />
                  )}
                  <FieldError field="country_of_residence_other" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_market">{t("fields.targetMarket")}</Label>
                  <SearchableSelect
                    id="target_market"
                    value={formData.target_market}
                    options={countryChoices}
                    onChange={(value) => setField("target_market", value)}
                    placeholder={t("placeholders.selectTargetMarket")}
                    {...pickerText}
                  />
                  <p className="text-xs text-muted-foreground">{tLists("targetMarketHint")}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_city">{tLists("targetCity")}</Label>
                <CityInput
                  id="target_city"
                  countryCode={formData.target_market}
                  value={formData.target_city}
                  onChange={(value) => setField("target_city", value)}
                  locale={locale}
                  labels={{ select: tLists("targetCityPlaceholder"), search: tLists("searchCity"), type: tLists("typeCity"), empty: tLists("noMatches") }}
                />
              </div>
            </div>

            <TermsConsent
              variant="b2c"
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
