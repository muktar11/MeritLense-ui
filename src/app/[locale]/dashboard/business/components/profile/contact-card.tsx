"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ExternalLink, Globe, Loader2, Mail, Pencil, Phone } from "lucide-react"
import companyService from "@/app/api/company/endpoints"
import type { CompanyProfile } from "@/app/api/company/types"
import { inputClass, outlineButtonClass, primaryButtonClass } from "./section-card"
import { websiteHref } from "./company-info-card"

export function ContactCard({
  email,
  company,
  fallbackPhone,
  fallbackWebsite,
  isOwner,
  onCompanyChange,
}: {
  email: string
  company: CompanyProfile | null
  fallbackPhone: string
  fallbackWebsite: string
  isOwner: boolean
  onCompanyChange: (company: CompanyProfile) => void
}) {
  const t = useTranslations("dashboard.business.company-profile")
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")

  const canEdit = isOwner && company !== null
  const currentPhone = company?.phone_number ?? fallbackPhone
  const currentWebsite = company?.website ?? fallbackWebsite

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      onCompanyChange(
        await companyService.updateProfile({
          phone_number: phone.trim(),
          website: website.trim() ? websiteHref(website.trim()) : "",
        }),
      )
      setEditing(false)
    } catch (saveError) {
      console.error("Failed to save contact information:", saveError)
      setError(t("contact.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const row = (Icon: typeof Mail, label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-[1.25rem_5rem_1fr] items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-gray-500" aria-hidden="true" />
      <span className="text-gray-500">{label}</span>
      <span className="min-w-0 break-words font-medium text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  )

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t("contact.title")}</h2>
        {canEdit && !editing && (
          <button
            type="button"
            className={outlineButtonClass}
            onClick={() => {
              setPhone(currentPhone || "")
              setWebsite(currentWebsite || "")
              setError(null)
              setEditing(true)
            }}
          >
            <Pencil className="h-3.5 w-3.5" /> {t("edit")}
          </button>
        )}
      </div>
      {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {editing ? (
        <div className="space-y-2">
          {row(Mail, t("contact.email"), <span title={t("contact.emailLocked")}>{email}</span>)}
          <label className="block text-xs text-gray-500">
            {t("contact.phone")}
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} className={inputClass} disabled={saving} />
          </label>
          <label className="block text-xs text-gray-500">
            {t("contact.website")}
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className={inputClass} disabled={saving} />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className={outlineButtonClass} onClick={() => setEditing(false)} disabled={saving}>
              {t("cancel")}
            </button>
            <button type="button" className={primaryButtonClass} onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("save")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {row(Mail, t("contact.email"), email || "—")}
          {row(Phone, t("contact.phone"), currentPhone ? <span dir="ltr">{currentPhone}</span> : "—")}
          {row(
            Globe,
            t("contact.website"),
            currentWebsite ? (
              <a
                href={websiteHref(currentWebsite)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-purple-700 hover:underline"
              >
                <span className="truncate">{currentWebsite.replace(/^https?:\/\//i, "")}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-purple-600" />
              </a>
            ) : "—",
          )}
        </div>
      )}
    </div>
  )
}
