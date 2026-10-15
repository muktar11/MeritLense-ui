"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { Loader2, Moon, Settings, Sun } from "lucide-react"
import { usePathname, useRouter } from "@/i18n/navigation"
import { LANGUAGES } from "@/app/api/auth/endpoints"
import type { B2BProfileData } from "@/app/api/profile/endpoints"
import { CountrySelect, SearchSelect } from "@/components/app/searchable-fields"
import { getTimezoneOptions } from "@/lib/location-detection"
import { SectionCard, inputClass, primaryButtonClass } from "./section-card"

type Preferences = Required<Pick<B2BProfileData, "preferred_language" | "notification_preference" | "target_market" | "timezone">>

export function SettingsCard({
  id,
  profile,
  saving,
  onSave,
}: {
  id: string
  profile: Record<string, unknown>
  saving: boolean
  onSave: (data: Preferences) => Promise<boolean>
}) {
  const t = useTranslations("dashboard.business.company-profile")
  const tLanguages = useTranslations("dashboard.indivisual.settings.edit-profile-tab.languages")
  const tSearch = useTranslations("shared.searchableSelect")
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [timezoneOptions] = useState<string[]>(getTimezoneOptions)
  const [saved, setSaved] = useState(false)
  // The page renders this card only once the profile has loaded.
  const [prefs, setPrefs] = useState<Preferences>(() => {
    const str = (key: string, fallback = "") =>
      typeof profile[key] === "string" && profile[key] ? (profile[key] as string) : fallback
    return {
      preferred_language: str("preferred_language", "EN"),
      notification_preference: str("notification_preference", "email"),
      target_market: str("target_market"),
      timezone: str("timezone"),
    }
  })

  const set = (key: keyof Preferences) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setPrefs((prev) => ({ ...prev, [key]: e.target.value }))
  const setValue = (key: keyof Preferences, value: string) => setPrefs((prev) => ({ ...prev, [key]: value }))
  const fieldButton = "min-h-10 rounded-lg border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"

  const save = async () => {
    if (!(await onSave(prefs))) return
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    // The site follows the preferred language when it is one we have.
    const preferred = prefs.preferred_language.toUpperCase()
    const nextLocale = preferred === "AR" ? "ar" : preferred === "EN" ? "en" : locale
    if (nextLocale !== locale) router.replace(pathname, { locale: nextLocale })
  }

  const label = "block text-xs font-medium text-gray-700 dark:text-gray-300"

  return (
    <SectionCard id={id} icon={Settings} title={t("settings")} subtitle={t("settingsCard.subtitle")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <label className={label}>
          {t("theme")}
          <span className="relative mt-1 block">
            <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2">
              {theme === "dark" ? <Moon className="h-4 w-4 text-indigo-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
            </span>
            <select value={theme === "dark" ? "dark" : "light"} onChange={(e) => setTheme(e.target.value)} className={`${inputClass} ps-9`}>
              <option value="light">{t("light")}</option>
              <option value="dark">{t("dark")}</option>
            </select>
          </span>
        </label>
        <div className={label}>
          <span id="settings-language-label">{t("language")}</span>
          <SearchSelect
            id="settings-language"
            aria-labelledby="settings-language-label"
            className="mt-1"
            buttonClassName={fieldButton}
            value={prefs.preferred_language}
            onChange={(value) => setValue("preferred_language", value)}
            options={LANGUAGES.map((lang) => ({ value: lang.key, label: tLanguages(lang.key), keywords: lang.key }))}
            searchPlaceholder={tSearch("searchLanguages")}
          />
        </div>
        <label className={label}>
          {t("notification")}
          <select value={prefs.notification_preference} onChange={set("notification_preference")} className={`${inputClass} mt-1`}>
            <option value="email">{t("email")}</option>
            <option value="push">{t("push")}</option>
            <option value="both">{t("bothNotifications")}</option>
          </select>
        </label>
        <div className={label}>
          <span id="settings-market-label">{t("targetHiringMarket")}</span>
          <CountrySelect
            id="settings-market"
            aria-labelledby="settings-market-label"
            className="mt-1"
            buttonClassName={fieldButton}
            value={prefs.target_market}
            onChange={(value) => setValue("target_market", value)}
            emptyOptionLabel={t("selectMarket")}
          />
        </div>
        <div className={`${label} sm:col-span-2 xl:col-span-1`}>
          <span id="settings-timezone-label">{t("timeZone")}</span>
          <SearchSelect
            id="settings-timezone"
            aria-labelledby="settings-timezone-label"
            className="mt-1"
            buttonClassName={fieldButton}
            value={prefs.timezone}
            onChange={(value) => setValue("timezone", value)}
            options={[
              { value: "", label: t("selectTimezone") },
              ...(prefs.timezone && !timezoneOptions.includes(prefs.timezone) ? [{ value: prefs.timezone, label: prefs.timezone }] : []),
              ...timezoneOptions.map((tz) => ({ value: tz, label: tz })),
            ]}
            searchPlaceholder={tSearch("searchTimezones")}
          />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-green-700" role="status">{t("settingsCard.saved")}</span>}
        <button type="button" onClick={save} disabled={saving} className={primaryButtonClass}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("saveChanges")}
        </button>
      </div>
    </SectionCard>
  )
}
