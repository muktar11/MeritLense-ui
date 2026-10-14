"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Building2, Camera, ExternalLink, Loader2, Pencil } from "lucide-react"
import companyService from "@/app/api/company/endpoints"
import { COMPANY_TYPES, type CompanyProfile, type CompanyType } from "@/app/api/company/types"
import { FieldTile, SectionCard, inputClass, outlineButtonClass, primaryButtonClass } from "./section-card"

const LOGO_ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const LOGO_MAX_BYTES = 5 * 1024 * 1024
const ROLES_MAX_COUNT = 8
const ROLE_MAX_LENGTH = 30

// What the page knows about the company when /companies/profile is not
// readable (team members): the employer profile's own copy.
export interface CompanyFallback {
  name: string
  industry: string
  website: string
  registrationNumber: string
}

export function websiteHref(website: string) {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`
}

export function CompanyInfoCard({
  company,
  fallback,
  isOwner,
  onCompanyChange,
}: {
  company: CompanyProfile | null
  fallback: CompanyFallback
  isOwner: boolean
  onCompanyChange: (company: CompanyProfile) => void
}) {
  const t = useTranslations("dashboard.business.company-profile")
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    legal_name: "",
    company_type: "" as CompanyType | "",
    industry: "",
    website: "",
    description: "",
  })

  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)

  const [rolesSaving, setRolesSaving] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [newRoleValue, setNewRoleValue] = useState("")

  const canEdit = isOwner && company !== null
  const name = company?.name || fallback.name
  const industry = company?.industry ?? fallback.industry
  const website = company?.website ?? fallback.website
  const registrationNumber = company?.registration_number || fallback.registrationNumber
  const roles = company?.roles || []
  const notSet = <span className="font-normal text-gray-400">{t("info.notSet")}</span>

  const startEditing = () => {
    if (!company) return
    setForm({
      name: company.name || "",
      legal_name: company.legal_name || "",
      company_type: company.company_type || "",
      industry: company.industry || "",
      website: company.website || "",
      description: company.description || "",
    })
    setError(null)
    setEditing(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      setError(t("info.nameRequired"))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await companyService.updateProfile({
        ...form,
        name: form.name.trim(),
        website: form.website.trim() ? websiteHref(form.website.trim()) : "",
      })
      onCompanyChange(updated)
      setEditing(false)
    } catch (saveError) {
      console.error("Failed to save company information:", saveError)
      setError(t("info.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setLogoError(null)
    if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
      setLogoError(t("logoErrors.invalidType"))
      return
    }
    if (file.size > LOGO_MAX_BYTES) {
      setLogoError(t("logoErrors.tooLarge"))
      return
    }
    setLogoUploading(true)
    try {
      onCompanyChange(await companyService.uploadLogo(file))
    } catch (uploadError) {
      console.error("Failed to upload company logo:", uploadError)
      setLogoError(t("logoErrors.uploadFailed"))
    } finally {
      setLogoUploading(false)
    }
  }

  const saveRoles = async (next: string[]) => {
    setRolesError(null)
    setRolesSaving(true)
    try {
      onCompanyChange(await companyService.updateRoles(next))
      return true
    } catch (saveError) {
      console.error("Failed to update company roles:", saveError)
      setRolesError(t("roleErrors.saveFailed"))
      return false
    } finally {
      setRolesSaving(false)
    }
  }

  const confirmAddRole = async () => {
    const role = newRoleValue.trim()
    if (!role) {
      setIsAddingRole(false)
      return
    }
    if (roles.includes(role)) return setRolesError(t("roleErrors.alreadyAdded"))
    if (roles.length >= ROLES_MAX_COUNT) return setRolesError(t("roleErrors.maxCount", { count: ROLES_MAX_COUNT }))
    if (role.length > ROLE_MAX_LENGTH) return setRolesError(t("roleErrors.maxLength", { count: ROLE_MAX_LENGTH }))
    if (await saveRoles([...roles, role])) {
      setIsAddingRole(false)
      setNewRoleValue("")
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
    className: inputClass,
    disabled: saving,
  })

  return (
    <SectionCard
      icon={Building2}
      title={t("info.title")}
      className="bg-gradient-to-br from-purple-50/70 to-white dark:from-gray-900 dark:to-gray-900"
      action={
        canEdit &&
        (editing ? (
          <>
            <button type="button" className={outlineButtonClass} onClick={() => setEditing(false)} disabled={saving}>
              {t("cancel")}
            </button>
            <button type="button" className={primaryButtonClass} onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("save")}
            </button>
          </>
        ) : (
          <button type="button" className={primaryButtonClass} onClick={startEditing}>
            <Pencil className="h-4 w-4" /> {t("edit")}
          </button>
        ))
      }
    >
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="flex shrink-0 flex-col items-center gap-2 md:w-44">
          <input
            id="company-logo-input"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            disabled={!canEdit || logoUploading}
            onChange={handleLogoChange}
          />
          <div className="relative h-44 w-44 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
            {company?.logo ? (
              <img src={company.logo} alt={t("logoAlt")} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-purple-300">
                {(name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => document.getElementById("company-logo-input")?.click()}
                disabled={logoUploading}
                className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gray-900/80 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
              >
                {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {company?.logo ? t("info.changePhoto") : t("info.addPhoto")}
              </button>
            )}
          </div>
          {logoError && <p className="max-w-44 text-center text-xs text-red-600">{logoError}</p>}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {editing ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs text-gray-500">
                {t("info.brandName")} *
                <input type="text" maxLength={255} {...field("name")} />
              </label>
              <label className="block text-xs text-gray-500">
                {t("info.legalName")}
                <input type="text" maxLength={255} {...field("legal_name")} />
              </label>
              <div className="text-xs text-gray-500">
                {t("info.registrationNumber")}
                <p className="mt-1 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {registrationNumber || "—"}
                </p>
                <p className="mt-1 text-[11px]">{t("info.registrationLocked")}</p>
              </div>
              <label className="block text-xs text-gray-500">
                {t("info.companyType")}
                <select {...field("company_type")}>
                  <option value="">{t("info.selectType")}</option>
                  {COMPANY_TYPES.map((type) => (
                    <option key={type} value={type}>{t(`info.companyTypes.${type}`)}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-gray-500">
                {t("info.industry")}
                <input type="text" maxLength={100} {...field("industry")} />
              </label>
              <label className="block text-xs text-gray-500">
                {t("info.website")}
                <input type="url" inputMode="url" placeholder="https://" {...field("website")} />
              </label>
              <label className="block text-xs text-gray-500 sm:col-span-2">
                {t("info.description")}
                <textarea rows={3} maxLength={2000} placeholder={t("info.descriptionPlaceholder")} {...field("description")} />
              </label>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                <FieldTile label={t("info.brandName")}>{name || notSet}</FieldTile>
                <FieldTile label={t("info.legalName")}>{company?.legal_name || notSet}</FieldTile>
                <FieldTile label={t("info.registrationNumber")}>{registrationNumber || notSet}</FieldTile>
                <FieldTile label={t("info.companyType")}>
                  {company?.company_type ? t(`info.companyTypes.${company.company_type}`) : notSet}
                </FieldTile>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FieldTile label={t("info.industry")}>{industry || notSet}</FieldTile>
                <FieldTile label={t("info.website")}>
                  {website ? (
                    <a
                      href={websiteHref(website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-purple-700 hover:underline dark:text-purple-300"
                    >
                      <span className="truncate">{website.replace(/^https?:\/\//i, "")}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : notSet}
                </FieldTile>
              </div>
              <FieldTile label={t("info.description")}>
                {company?.description ? (
                  <p className="whitespace-pre-line font-normal leading-relaxed">{company.description}</p>
                ) : (
                  <span className="font-normal text-gray-400">{canEdit ? t("info.descriptionPlaceholder") : t("info.notSet")}</span>
                )}
              </FieldTile>
            </>
          )}

          {(roles.length > 0 || canEdit) && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-gray-500">{t("info.businessRoles")}:</span>
              {roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700"
                >
                  {role}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => saveRoles(roles.filter((r) => r !== role))}
                      disabled={rolesSaving}
                      className="hover:text-purple-900 disabled:opacity-50"
                      aria-label={t("removeRoleAriaLabel", { role })}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {canEdit &&
                (isAddingRole ? (
                  <span className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newRoleValue}
                      onChange={(e) => setNewRoleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); confirmAddRole() }
                        if (e.key === "Escape") setIsAddingRole(false)
                      }}
                      placeholder={t("rolePlaceholder")}
                      maxLength={ROLE_MAX_LENGTH}
                      autoFocus
                      disabled={rolesSaving}
                      className="w-40 rounded-lg border px-2 py-1 text-sm"
                    />
                    <button type="button" onClick={confirmAddRole} disabled={rolesSaving} className="text-sm font-medium text-purple-600 hover:underline">
                      {rolesSaving ? t("savingRole") : t("addButton")}
                    </button>
                    <button type="button" onClick={() => setIsAddingRole(false)} disabled={rolesSaving} className="text-sm text-gray-500 hover:underline">
                      {t("cancel")}
                    </button>
                  </span>
                ) : (
                  roles.length < ROLES_MAX_COUNT && (
                    <button
                      type="button"
                      onClick={() => { setRolesError(null); setNewRoleValue(""); setIsAddingRole(true) }}
                      className="text-sm font-medium text-purple-600 hover:underline"
                    >
                      {t("addRole")}
                    </button>
                  )
                ))}
              {rolesError && <p className="w-full text-xs text-red-600">{rolesError}</p>}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
