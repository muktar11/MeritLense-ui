"use client"

import { useCallback, useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { FileSignature, FileText, Loader2, Lock, Settings, Users, type LucideIcon } from "lucide-react"
import { useProfile } from "../../../../hooks/useProfile"
import { useAuth } from "../../../../hooks/useAuth"
import type { B2BProfileData } from "@/app/api/profile/endpoints"
import companyService from "@/app/api/company/endpoints"
import type { CompanyProfile as Company } from "@/app/api/company/types"
import { ChangePassword } from "./change-password"
import { CompanyLicenseDocuments } from "./company-license-documents"
import { CompanyInfoCard } from "./profile/company-info-card"
import { ContactCard } from "./profile/contact-card"
import { BusinessAddressesCard } from "./profile/business-addresses-card"
import { TeamAccessCard } from "./profile/team-access-card"
import { LicenseCard } from "./profile/license-card"
import { LegalAgreementsCard } from "./profile/legal-agreements-card"
import { SettingsCard } from "./profile/settings-card"

// Company Profile (B2B, approved design 14 Oct 2026). The section bar
// jumps to each card; every card stays on the page. Partnerships from the
// design is left out until there is a real partner feature behind it.
const SECTIONS: { id: string; key: string; icon: LucideIcon }[] = [
  { id: "team-access", key: "team", icon: Users },
  { id: "legal-agreements", key: "agreements", icon: FileSignature },
  { id: "business-license", key: "license", icon: FileText },
  { id: "account-security", key: "security", icon: Lock },
  { id: "settings", key: "settings", icon: Settings },
]

const str = (value: unknown) => (typeof value === "string" ? value : "")

export function CompanyProfile() {
  const t = useTranslations("dashboard.business.company-profile")
  const locale = useLocale()
  const { profile, loading, error, fetchProfile, updateProfile } = useProfile()
  const { userRole } = useAuth()
  const isCompanyOwner = userRole === "B2B"

  const [company, setCompany] = useState<Company | null>(null)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id)

  const loadCompany = useCallback(async () => {
    try {
      setCompany(await companyService.getProfile())
    } catch (fetchError) {
      // Team members can't read /companies/profile (owner-only); the cards
      // then show the employer profile's copy, read-only.
      console.error("Failed to fetch company profile:", fetchError)
    }
  }, [])

  const licenseVerified = profile?.business_license_verified === true

  useEffect(() => {
    if (licenseVerified && isCompanyOwner) loadCompany()
  }, [licenseVerified, isCompanyOwner, loadCompany])

  // Highlight the section in view.
  useEffect(() => {
    if (!licenseVerified) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      { rootMargin: "-20% 0px -60% 0px" },
    )
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [licenseVerified])

  const jumpTo = (id: string) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const saveSettings = async (prefs: Partial<B2BProfileData>) => {
    setSettingsSaving(true)
    try {
      return await updateProfile(prefs as B2BProfileData)
    } finally {
      setSettingsSaving(false)
    }
  }

  if (loading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!licenseVerified) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6" dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
          <CompanyLicenseDocuments
            profile={profile || {}}
            isCompanyOwner={isCompanyOwner}
            canUploadRequestedDocuments={isCompanyOwner || profile?.role === "B2B_TEAM_MEMBER"}
            onLicenseUploaded={fetchProfile}
          />
        </div>
      </div>
    )
  }

  const p = (profile || {}) as Record<string, unknown>

  return (
    <div className="min-h-screen bg-gray-50/60 p-4 sm:p-6 dark:bg-background" dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CompanyInfoCard
          company={company}
          fallback={{
            name: str(p.company_name),
            industry: str(p.industry),
            website: str(p.website),
            registrationNumber: str(p.company_registration_number),
          }}
          isOwner={isCompanyOwner}
          onCompanyChange={setCompany}
        />
        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-800 dark:bg-gray-900">
          <ContactCard
            email={str(p.email)}
            company={company}
            fallbackPhone={str(p.phone_number)}
            fallbackWebsite={str(p.website)}
            isOwner={isCompanyOwner}
            onCompanyChange={setCompany}
          />
          <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
            <BusinessAddressesCard
              addresses={
                company?.business_addresses ??
                (str(p.country) || str(p.city) || str(p.address)
                  ? [{
                      id: "profile",
                      label: "",
                      address_type: "MAIN",
                      country: str(p.country),
                      city: str(p.city),
                      street: str(p.address),
                      created_at: "",
                      updated_at: "",
                    }]
                  : [])
              }
              canEdit={isCompanyOwner && company !== null}
              onChanged={loadCompany}
            />
          </div>
        </div>
      </div>

      <nav
        aria-label={t("sections.navLabel")}
        className="sticky top-0 z-20 my-5 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <ul className="flex min-w-max">
          {SECTIONS.map(({ id, key, icon: Icon }) => {
            const active = activeSection === id
            return (
              <li key={id} className="flex-1">
                <button
                  type="button"
                  onClick={() => jumpTo(id)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center justify-center gap-2 whitespace-nowrap border-b-2 px-5 py-3.5 text-sm font-medium transition ${
                    active
                      ? "border-purple-600 text-purple-700 dark:text-purple-300"
                      : "border-transparent text-gray-700 hover:text-purple-700 dark:text-gray-300"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {t(`sections.${key}`)}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* The staff table and the password row need the full width; the
          license and agreements cards sit side by side. */}
      <div className="space-y-5">
        <TeamAccessCard id="team-access" isOwner={isCompanyOwner} />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <LicenseCard id="business-license" profile={p} isOwner={isCompanyOwner} onLicenseUploaded={fetchProfile} />
          <LegalAgreementsCard id="legal-agreements" />
        </div>
        <ChangePassword id="account-security" />
        <SettingsCard id="settings" profile={p} saving={settingsSaving} onSave={saveSettings} />
      </div>
    </div>
  )
}
