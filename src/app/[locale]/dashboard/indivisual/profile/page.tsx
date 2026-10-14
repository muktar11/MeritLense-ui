"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Camera, CreditCard, FileSignature, Loader2, Lock, Mail, Moon, Pencil, Phone, Settings, Sun, User, type LucideIcon } from "lucide-react";
import DashboardHeader from "../components/dashboard-header";
import EditProfileTab from "../components/settings/edit-profile-tab";
import SecurityTab from "../components/settings/security-tab";
import { BillingTab } from "../components/settings/billing-tab";
import AgreementsTab from "../components/settings/agreements-tab";
import { SubscriptionProvider } from "@/app/context/SubscriptionContext";
import { useProfile } from "@/app/hooks/useProfile";
import { JOB_ROLES, LANGUAGES, NATIONALITIES } from "@/app/api/auth/endpoints";
import type { B2CProfileData } from "@/app/api/profile/endpoints";
import { COUNTRIES } from "@/lib/countries";
import { getTimezoneOptions } from "@/lib/location-detection";
import { CountryFlag } from "../../business/components/profile/business-addresses-card";
import { FieldTile, SectionCard, inputClass, primaryButtonClass } from "../../business/components/profile/section-card";

// Profile page for individual employers, in the same layout as the B2B
// Company Profile (approved design 14 Oct 2026) without the company-only
// parts (team, business license). ?tab=billing|security|agreements|settings
// opens a section; links from the payment pages use ?tab=billing.
const SECTIONS: { id: string; icon: LucideIcon }[] = [
  { id: "agreements", icon: FileSignature },
  { id: "security", icon: Lock },
  { id: "billing", icon: CreditCard },
  { id: "settings", icon: Settings },
];

const PICTURE_MAX_BYTES = 5 * 1024 * 1024;
const PICTURE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const t = useTranslations("dashboard.indivisual.profile");
  const tForm = useTranslations("dashboard.indivisual.settings.edit-profile-tab");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { profile, loading, fetchProfile, updateProfile, uploadProfilePicture, removeProfilePicture } = useProfile();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return SECTIONS.some((s) => s.id === tab) ? (tab as string) : SECTIONS[0].id;
  });
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pictureBusy, setPictureBusy] = useState(false);
  const [pictureError, setPictureError] = useState<string | null>(null);

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  const p = (profile || {}) as Record<string, string | undefined>;
  const notSet = <span className="font-normal text-gray-400">{t("info.notSet")}</span>;
  const jobRole = JOB_ROLES.find((r) => r.key === p.job_role);
  const nationality = NATIONALITIES.find((n) => n.key === p.nationality);
  const residence = COUNTRIES.find((c) => c.key === p.country_of_residence);

  const changePicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPictureError(null);
    if (!PICTURE_TYPES.includes(file.type)) return setPictureError(tForm("errors.invalidImageType"));
    if (file.size > PICTURE_MAX_BYTES) return setPictureError(tForm("errors.imageTooLarge"));
    setPictureBusy(true);
    const ok = await uploadProfilePicture(file);
    setPictureBusy(false);
    if (!ok) setPictureError(tForm("errors.uploadFailed"));
  };

  const removePicture = async () => {
    setPictureError(null);
    setPictureBusy(true);
    const ok = await removeProfilePicture();
    setPictureBusy(false);
    if (!ok) setPictureError(tForm("errors.removeFailed"));
  };

  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-background" dir={locale === "ar" ? "rtl" : "ltr"}>
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-5">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">{t("pageTitle")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
          </header>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <SectionCard
              icon={User}
              title={t("info.title")}
              className="bg-gradient-to-br from-purple-50/70 to-white dark:from-gray-900 dark:to-gray-900"
              action={
                !editing && (
                  <button type="button" className={primaryButtonClass} onClick={() => setEditing(true)}>
                    <Pencil className="h-4 w-4" /> {t("info.edit")}
                  </button>
                )
              }
            >
              <div className="flex flex-col gap-5 md:flex-row">
                <div className="flex shrink-0 flex-col items-center gap-2 md:w-44">
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={changePicture} />
                  <div className="relative h-44 w-44 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                    {p.profile_picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.profile_picture} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-400 to-purple-500 text-4xl font-bold text-white">
                        {(p.first_name?.[0] || "") + (p.last_name?.[0] || "") || "?"}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={pictureBusy}
                      className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gray-900/80 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
                    >
                      {pictureBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      {p.profile_picture ? t("info.changePhoto") : t("info.addPhoto")}
                    </button>
                  </div>
                  {p.profile_picture && (
                    <button type="button" onClick={removePicture} disabled={pictureBusy} className="text-xs font-medium text-red-600 hover:underline">
                      {t("info.removePhoto")}
                    </button>
                  )}
                  {pictureError && <p className="max-w-44 text-center text-xs text-red-600">{pictureError}</p>}
                </div>

                <div className="min-w-0 flex-1">
                  {editing ? (
                    <EditProfileTab
                      mode="personal"
                      onDone={() => {
                        setEditing(false);
                        fetchProfile();
                      }}
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <FieldTile label={tForm("firstName")}>{p.first_name || notSet}</FieldTile>
                      <FieldTile label={tForm("lastName")}>{p.last_name || notSet}</FieldTile>
                      <FieldTile label={tForm("passportId")}>{p.passport_id || notSet}</FieldTile>
                      <FieldTile label={tForm("dob")}>{p.date_of_birth || notSet}</FieldTile>
                      <FieldTile label={tForm("jobRole")}>{jobRole ? tForm(`jobRoles.${jobRole.key}`) : p.job_role || notSet}</FieldTile>
                      <FieldTile label={tForm("nationality")}>
                        {nationality ? tForm(`nationalities.${nationality.key}`) : p.nationality || notSet}
                      </FieldTile>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-800 dark:bg-gray-900">
              <div>
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">{t("contact.title")}</h2>
                <div className="space-y-3 text-sm">
                  {[
                    { Icon: Mail, label: t("contact.email"), value: p.email },
                    { Icon: Phone, label: t("contact.phone"), value: p.phone_number },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="grid grid-cols-[1.25rem_5rem_1fr] items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                      <span className="text-gray-500">{label}</span>
                      <span className="min-w-0 break-words font-medium text-gray-900 dark:text-gray-100" dir={Icon === Phone ? "ltr" : undefined}>
                        {value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">{t("address.title")}</h2>
                {p.address || residence ? (
                  <div className="flex items-center gap-3">
                    <CountryFlag country={residence?.key || ""} />
                    <div className="min-w-0 text-sm">
                      {p.address && <p className="font-medium text-gray-900 dark:text-gray-100">{p.address}</p>}
                      {residence && (
                        <p className="text-gray-600 dark:text-gray-400">
                          {t("address.residence")}: {residence.label}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{t("address.empty")}</p>
                )}
              </div>
            </div>
          </div>

          <nav
            aria-label={t("sections.navLabel")}
            className="my-5 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <ul className="flex min-w-max" role="tablist">
              {SECTIONS.map(({ id, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <li key={id} className="flex-1">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(id)}
                      className={`flex w-full items-center justify-center gap-2 whitespace-nowrap border-b-2 px-5 py-3.5 text-sm font-medium transition ${
                        active
                          ? "border-purple-600 text-purple-700 dark:text-purple-300"
                          : "border-transparent text-gray-700 hover:text-purple-700 dark:text-gray-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      {t(`sections.${id}`)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900" role="tabpanel">
            {activeTab === "agreements" && <AgreementsTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "billing" && (
              <SubscriptionProvider>
                <BillingTab />
              </SubscriptionProvider>
            )}
            {activeTab === "settings" && profile && (
              <IndividualSettings
                profile={p}
                onSave={async (prefs) => {
                  const ok = await updateProfile(prefs as unknown as B2CProfileData);
                  if (ok) await fetchProfile();
                  return ok;
                }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function IndividualSettings({
  profile,
  onSave,
}: {
  profile: Record<string, string | undefined>;
  onSave: (prefs: { preferred_language: string; target_market?: string; timezone?: string }) => Promise<boolean>;
}) {
  const t = useTranslations("dashboard.indivisual.profile");
  const tForm = useTranslations("dashboard.indivisual.settings.edit-profile-tab");
  const { theme, setTheme } = useTheme();
  const [timezoneOptions] = useState<string[]>(getTimezoneOptions);
  const [prefs, setPrefs] = useState({
    preferred_language: profile.preferred_language || "EN",
    target_market: profile.target_market || "",
    timezone: profile.timezone || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const label = "block text-xs font-medium text-gray-700 dark:text-gray-300";

  const save = async () => {
    setSaving(true);
    const ok = await onSave({
      preferred_language: prefs.preferred_language,
      target_market: prefs.target_market || undefined,
      timezone: prefs.timezone || undefined,
    });
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <SectionCard icon={Settings} title={t("sections.settings")} subtitle={t("settings.subtitle")} className="border-0 p-0 shadow-none sm:p-0">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={label}>
          {t("settings.theme")}
          <span className="relative mt-1 block">
            <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2">
              {theme === "dark" ? <Moon className="h-4 w-4 text-indigo-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
            </span>
            <select value={theme === "dark" ? "dark" : "light"} onChange={(e) => setTheme(e.target.value)} className={`${inputClass} ps-9`}>
              <option value="light">{t("settings.light")}</option>
              <option value="dark">{t("settings.dark")}</option>
            </select>
          </span>
        </label>
        <label className={label}>
          {tForm("preferredLanguage")}
          <select
            value={prefs.preferred_language}
            onChange={(e) => setPrefs((v) => ({ ...v, preferred_language: e.target.value }))}
            className={`${inputClass} mt-1`}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.key} value={lang.key}>{tForm(`languages.${lang.key}`)}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          {tForm("targetMarket")}
          <select
            value={prefs.target_market}
            onChange={(e) => setPrefs((v) => ({ ...v, target_market: e.target.value }))}
            className={`${inputClass} mt-1`}
          >
            <option value="">{tForm("selectTargetMarketPlaceholder")}</option>
            {COUNTRIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          {tForm("timezone")}
          <select
            value={prefs.timezone}
            onChange={(e) => setPrefs((v) => ({ ...v, timezone: e.target.value }))}
            className={`${inputClass} mt-1`}
          >
            <option value="">{tForm("selectTimezonePlaceholder")}</option>
            {prefs.timezone && !timezoneOptions.includes(prefs.timezone) && <option value={prefs.timezone}>{prefs.timezone}</option>}
            {timezoneOptions.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-green-700" role="status">{t("settings.saved")}</span>}
        <button type="button" onClick={save} disabled={saving} className={primaryButtonClass}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("settings.save")}
        </button>
      </div>
    </SectionCard>
  );
}
