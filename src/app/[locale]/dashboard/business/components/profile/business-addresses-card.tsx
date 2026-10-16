"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Loader2, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react"
import { CountrySelect } from "@/components/app/searchable-fields"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import companyService from "@/app/api/company/endpoints"
import { ADDRESS_TYPES, type AddressType, type BusinessAddress, type BusinessAddressInput } from "@/app/api/company/types"
import { COUNTRIES, countryName } from "@/lib/countries"
import { inputClass, outlineButtonClass, primaryButtonClass } from "./section-card"

const TYPE_BADGE: Record<AddressType, string> = {
  MAIN: "bg-purple-100 text-purple-700",
  TRADING: "bg-green-100 text-green-700",
  BRANCH: "bg-violet-100 text-violet-700",
}

function countryCode(country: string): string | null {
  const value = country.trim().toLowerCase()
  if (!value) return null
  const match = COUNTRIES.find((c) => c.label.toLowerCase() === value || c.key.toLowerCase() === value)
  return match ? match.key : null
}

// Flag images come from flagcdn; when one can't load, the country code is
// shown instead (Windows browsers don't draw flag emoji).
export function CountryFlag({ country }: { country: string }) {
  const code = countryCode(country)
  const [failed, setFailed] = useState(false)
  if (!code || failed) {
    return (
      <span className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        {code || "—"}
      </span>
    )
  }
  return (
    <img
      src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
      alt={country}
      onError={() => setFailed(true)}
      className="h-8 w-12 shrink-0 rounded-md border border-gray-200 object-cover"
    />
  )
}

const EMPTY: BusinessAddressInput = { label: "", address_type: "BRANCH", country: "", city: "", street: "" }

export function BusinessAddressesCard({
  addresses,
  canEdit,
  onChanged,
}: {
  addresses: BusinessAddress[]
  canEdit: boolean
  onChanged: () => Promise<void>
}) {
  const t = useTranslations("dashboard.business.company-profile")
  const locale = useLocale()
  const [dialog, setDialog] = useState<{ id: string | null; form: BusinessAddressInput } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const hasMain = addresses.some((a) => a.address_type === "MAIN")

  const openAdd = () => {
    setError(null)
    setDialog({ id: null, form: { ...EMPTY, address_type: hasMain ? "BRANCH" : "MAIN" } })
  }

  const openEdit = (address: BusinessAddress) => {
    setError(null)
    const { label, address_type, country, city, street } = address
    setDialog({ id: address.id, form: { label, address_type, country, city, street } })
  }

  const save = async () => {
    if (!dialog) return
    if (!dialog.form.country.trim()) {
      setError(t("addresses.countryRequired"))
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (dialog.id) await companyService.updateAddress(dialog.id, dialog.form)
      else await companyService.addAddress(dialog.form)
      await onChanged()
      setDialog(null)
    } catch (saveError: unknown) {
      console.error("Failed to save address:", saveError)
      const data = (saveError as { response?: { data?: Record<string, unknown> } })?.response?.data
      setError(data && "address_type" in data ? t("addresses.oneMain") : t("addresses.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (address: BusinessAddress) => {
    if (address.address_type === "MAIN") {
      setListError(t("addresses.mainLocked"))
      return
    }
    if (!confirm(t("addresses.removeConfirm"))) return
    setBusyId(address.id)
    setListError(null)
    try {
      await companyService.removeAddress(address.id)
      await onChanged()
    } catch (removeError) {
      console.error("Failed to remove address:", removeError)
      setListError(t("addresses.saveFailed"))
    } finally {
      setBusyId(null)
    }
  }

  const setField = (key: keyof BusinessAddressInput, value: string) =>
    setDialog((prev) => (prev ? { ...prev, form: { ...prev.form, [key]: value } } : prev))

  // The Main Office type is offered only where it is free (or already this one's).
  const typeOptions = ADDRESS_TYPES.filter(
    (type) => type !== "MAIN" || !hasMain || addresses.find((a) => a.id === dialog?.id)?.address_type === "MAIN",
  )

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t("addresses.title")}</h2>
        {canEdit && (
          <button type="button" className={outlineButtonClass} onClick={openAdd}>
            <Plus className="h-4 w-4" /> {t("addresses.add")}
          </button>
        )}
      </div>
      {listError && <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{listError}</p>}
      {addresses.length === 0 ? (
        <p className="text-sm text-gray-500">{t("addresses.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li key={address.id} className="flex items-center gap-3">
              <CountryFlag country={address.country} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {address.label || t(`addresses.types.${address.address_type}`)}
                </p>
                {address.street && <p className="text-gray-600 dark:text-gray-400">{address.street}</p>}
                <p className="text-gray-600 dark:text-gray-400">{[address.city, countryName(address.country, locale)].filter(Boolean).join(locale === "ar" ? "، " : ", ")}</p>
              </div>
              <span className={`shrink-0 rounded-lg px-3 py-1 text-xs font-medium ${TYPE_BADGE[address.address_type]}`}>
                {t(`addresses.types.${address.address_type}`)}
              </span>
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("addresses.actions")}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      disabled={busyId === address.id}
                    >
                      {busyId === address.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(address)}>
                      <Pencil className="mr-2 h-4 w-4" /> {t("addresses.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => remove(address)}
                      disabled={address.address_type === "MAIN"}
                      title={address.address_type === "MAIN" ? t("addresses.mainLocked") : undefined}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> {t("addresses.remove")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && !saving && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.id ? t("addresses.editTitle") : t("addresses.addTitle")}</DialogTitle>
          </DialogHeader>
          {dialog && (
            <div className="space-y-3">
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <label className="block text-xs text-gray-500">
                {t("addresses.label")}
                <input
                  type="text"
                  maxLength={100}
                  value={dialog.form.label}
                  onChange={(e) => setField("label", e.target.value)}
                  placeholder={t("addresses.labelPlaceholder")}
                  className={inputClass}
                />
              </label>
              <label className="block text-xs text-gray-500">
                {t("addresses.type")}
                <select
                  value={dialog.form.address_type}
                  onChange={(e) => setField("address_type", e.target.value)}
                  className={inputClass}
                >
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>{t(`addresses.types.${type}`)}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="block text-xs text-gray-500">
                  <span id="address-country-label">{t("addresses.country")} *</span>
                  <CountrySelect
                    id="address-country"
                    aria-labelledby="address-country-label"
                    valueKind="label"
                    value={dialog.form.country}
                    onChange={(value) => setField("country", value)}
                    placeholder={t("selectCountry")}
                    buttonClassName="min-h-10 rounded-lg border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  />
                </div>
                <label className="block text-xs text-gray-500">
                  {t("addresses.city")}
                  <input type="text" maxLength={100} value={dialog.form.city} onChange={(e) => setField("city", e.target.value)} className={inputClass} />
                </label>
              </div>
              <label className="block text-xs text-gray-500">
                {t("addresses.street")}
                <input
                  type="text"
                  maxLength={255}
                  value={dialog.form.street}
                  onChange={(e) => setField("street", e.target.value)}
                  placeholder={t("addresses.streetPlaceholder")}
                  className={inputClass}
                />
              </label>
            </div>
          )}
          <DialogFooter>
            <button type="button" className={outlineButtonClass} onClick={() => setDialog(null)} disabled={saving}>
              {t("cancel")}
            </button>
            <button type="button" className={primaryButtonClass} onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("save")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
