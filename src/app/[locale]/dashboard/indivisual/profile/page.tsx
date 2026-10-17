"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useTheme } from "next-themes";
import {
  Camera,
  CheckCircle2,
  Clock,
  Download,
  FileSignature,
  FileText,
  Globe,
  History,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Moon,
  MoreVertical,
  Pencil,
  Phone,
  Settings,
  Sun,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import DashboardHeader from "../components/dashboard-header";
import EditProfileTab from "../components/settings/edit-profile-tab";
import SecurityTab from "../components/settings/security-tab";
import AgreementsTab from "../components/settings/agreements-tab";
import { useProfile } from "@/app/hooks/useProfile";
import { JOB_ROLES, LANGUAGES, NATIONALITIES } from "@/app/api/auth/endpoints";
import type { B2CProfileData } from "@/app/api/profile/endpoints";
import agreementService from "@/app/api/agreements/endpoints";
import type { Agreement } from "@/app/api/agreements/types";
import { AuditTrailModal } from "@/components/agreements/AuditTrailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { COUNTRIES, countryName } from "@/lib/countries";
import { CountrySelect, SearchSelect } from "@/components/app/searchable-fields";
import { getTimezoneOptions } from "@/lib/location-detection";
import { SectionCard, inputClass, outlineButtonClass, primaryButtonClass } from "../../business/components/profile/section-card";

// Profile page for individual employers: personal and account settings.
const SECTIONS: { id: string; key: string; icon: LucideIcon }[] = [
  { id: "personal", key: "sections.personal", icon: User },
  { id: "contact", key: "sections.contact", icon: Phone },
  { id: "security", key: "sections.security", icon: Lock },
  { id: "agreements", key: "sections.agreements", icon: FileText },
  { id: "settings", key: "sections.settings", icon: Settings },
];

const PICTURE_MAX_BYTES = 5 * 1024 * 1024;
const PICTURE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type DialogName = "personal" | "contact" | "security" | "agreements" | "settings" | null;

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ProfilePageContent />
    </Suspense>
  );
}

function Row({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 py-2 text-sm sm:grid-cols-[minmax(0,12rem)_1fr_auto]">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="min-w-0 break-words text-gray-900 dark:text-gray-100">{children}</span>
      <span className="shrink-0">{action}</span>
    </div>
  );
}

const linkButton = "text-sm font-medium text-purple-700 hover:underline dark:text-purple-300";

function ProfilePageContent() {
  const t = useTranslations("dashboard.indivisual.profile");
  const tForm = useTranslations("dashboard.indivisual.settings.edit-profile-tab");
  const tTypes = useTranslations("shared.agreementTypes");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? { locale: ar } : undefined;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { profile, loading, fetchProfile, updateProfile, uploadProfilePicture, removeProfilePicture } = useProfile();

  const [dialog, setDialog] = useState<DialogName>(null);
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pictureBusy, setPictureBusy] = useState(false);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const [agreements, setAgreements] = useState<Agreement[] | null>(null);
  const [auditTarget, setAuditTarget] = useState<{ id: string; label: string } | null>(null);

  const loadAgreements = () =>
    agreementService
      .getStatus()
      .then(setAgreements)
      .catch((error) => {
        console.error("Failed to fetch agreements:", error);
        setAgreements([]);
      });
  useEffect(() => {
    loadAgreements();
  }, []);

  // ?tab= deep links scroll to that card once the page has rendered.
  const profileLoaded = Boolean(profile);
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "billing") {
      router.replace("/dashboard/indivisual/payment?tab=billing");
      return;
    }
    if (!profileLoaded || !tab || !SECTIONS.some((s) => s.id === tab)) return;
    const timer = window.setTimeout(() => document.getElementById(tab)?.scrollIntoView({ block: "start" }), 50);
    return () => window.clearTimeout(timer);
  }, [profileLoaded, router, searchParams]);

  useEffect(() => {
    if (!profileLoaded) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [profileLoaded]);

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
  const optional = <span className="text-xs text-gray-400">{t("personal.optional")}</span>;
  const notSet = <span className="text-gray-400">{t("settingsCard.notSet")}</span>;
  const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  const jobRole = JOB_ROLES.find((r) => r.key === p.job_role);
  const nationality = NATIONALITIES.find((n) => n.key === p.nationality);
  const residence = COUNTRIES.find((c) => c.key === p.country_of_residence)
    ? { key: p.country_of_residence as string, label: countryName(p.country_of_residence, locale) }
    : undefined;
  const targetMarket = p.target_market ? { label: countryName(p.target_market, locale) } : undefined;
  const language = LANGUAGES.find((l) => l.key === p.preferred_language);
  const close = () => setDialog(null);
  const jumpTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  // Agreements summary: every current agreement on the account.
  const agreementRows = (agreements || []).filter((a) => a.status !== "SUPERSEDED");
  const hasB2c = agreementRows.some((a) => a.agreement_type === "B2C_AGREEMENT");

  const downloadAgreement = async (id: string) => {
    try {
      const { url } = await agreementService.getDownloadUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to get agreement download URL:", error);
    }
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

          {/* Identity header */}
          <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-gradient-to-r from-white via-white to-purple-100 p-5 shadow-sm sm:flex-row sm:items-center sm:p-6 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950/40">
            <div className="flex min-w-0 flex-1 items-center gap-5">
              <div className="relative shrink-0">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={changePicture} />
                {p.profile_picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.profile_picture} alt="" className="h-24 w-24 rounded-full object-cover sm:h-28 sm:w-28" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-purple-500 text-3xl font-bold text-white sm:h-28 sm:w-28">
                    {(p.first_name?.[0] || "") + (p.last_name?.[0] || "") || "?"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pictureBusy}
                  aria-label={t("header.changePhoto")}
                  title={t("header.changePhoto")}
                  className="absolute bottom-0 end-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-purple-600 text-white hover:bg-purple-700"
                >
                  {pictureBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-bold text-gray-900 dark:text-gray-100">{fullName || p.email}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {t("header.accountType")}
                  {residence && <span> &nbsp;|&nbsp; {residence.label}</span>}
                </p>
                {p.profile_picture && (
                  <button type="button" onClick={removePicture} disabled={pictureBusy} className="mt-1 text-xs font-medium text-red-600 hover:underline">
                    {t("info.removePhoto")}
                  </button>
                )}
                {pictureError && <p className="mt-1 text-xs text-red-600">{pictureError}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-white/60 p-4 sm:max-w-sm dark:bg-gray-900/60">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm dark:bg-gray-800">
                <Users className="h-6 w-6" />
              </span>
              <p className="text-sm text-gray-700 dark:text-gray-300">{t("header.note")}</p>
            </div>
          </div>

          {/* Section bar */}
          <nav
            aria-label={t("sections.navLabel")}
            className="sticky top-0 z-20 my-5 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <ul className="flex min-w-max">
              {SECTIONS.map(({ id, key, icon: Icon }) => {
                const active = activeSection === id;
                return (
                  <li key={id} className="flex-1">
                    <button
                      type="button"
                      onClick={() => jumpTo(id)}
                      aria-current={active ? "true" : undefined}
                      className={`flex w-full items-center justify-center gap-2 whitespace-nowrap border-b-2 px-4 py-3.5 text-sm font-medium transition ${
                        active ? "border-purple-600 text-purple-700 dark:text-purple-300" : "border-transparent text-gray-700 hover:text-purple-700 dark:text-gray-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      {t(key)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <SectionCard
              id="personal"
              icon={User}
              title={t("sections.personal")}
              subtitle={t("personal.subtitle")}
              action={
                <button type="button" className={outlineButtonClass} onClick={() => setDialog("personal")}>
                  <Pencil className="h-3.5 w-3.5" /> {t("info.edit")}
                </button>
              }
            >
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label={t("personal.fullName")}>{fullName || notSet}</Row>
                <Row label={tForm("passportId")}>{p.passport_id || notSet}</Row>
                <Row label={tForm("jobRole")}>{jobRole ? tForm(`jobRoles.${jobRole.key}`) : p.job_role || notSet}</Row>
                <Row label={tForm("countryOfResidence")}>{residence?.label || optional}</Row>
                <Row label={tForm("dob")}>{p.date_of_birth ? format(new Date(p.date_of_birth), "d MMM yyyy", dateLocale) : optional}</Row>
                <Row label={tForm("nationality")}>{nationality ? tForm(`nationalities.${nationality.key}`) : p.nationality || notSet}</Row>
              </div>
            </SectionCard>

            <SectionCard
              id="contact"
              icon={Phone}
              title={t("sections.contact")}
              subtitle={t("contact.subtitle")}
              action={
                <button type="button" className={outlineButtonClass} onClick={() => setDialog("contact")}>
                  <Pencil className="h-3.5 w-3.5" /> {t("info.edit")}
                </button>
              }
            >
              <div className="space-y-3 text-sm">
                {/* Signing in requires a verified email, so it always is here. */}
                <div className="flex flex-wrap items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                  <span className="min-w-0 break-all text-gray-900 dark:text-gray-100">{p.email}</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t("contact.verified")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                  <span className="text-gray-900 dark:text-gray-100" dir="ltr">{p.phone_number || "—"}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                  <span className="text-gray-900 dark:text-gray-100">
                    {[p.address, residence?.label].filter(Boolean).join(", ") || <span className="text-gray-400">{t("address.empty")}</span>}
                  </span>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              id="security"
              icon={Lock}
              title={t("sections.security")}
              subtitle={t("security.subtitle")}
              action={
                <button type="button" className={outlineButtonClass} onClick={() => setDialog("security")}>
                  {t("security.changePassword")}
                </button>
              }
            >
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row
                  label={t("security.password")}
                  action={<button type="button" className={linkButton} onClick={() => setDialog("security")}>{t("security.change")}</button>}
                >
                  <span className="tracking-widest">••••••••</span>
                </Row>
                <Row
                  label={t("security.deleteAccount")}
                  action={
                    <button type="button" className="text-sm font-medium text-red-600 hover:underline" onClick={() => setDialog("security")}>
                      {t("security.manage")}
                    </button>
                  }
                >
                  <span className="text-gray-500">{t("security.deleteHint")}</span>
                </Row>
              </div>
            </SectionCard>

            <SectionCard
              id="agreements"
              icon={FileText}
              title={t("sections.agreements")}
              subtitle={t("agreementsCard.subtitle")}
              action={
                <button type="button" className={outlineButtonClass} onClick={() => setDialog("agreements")}>
                  {t("agreementsCard.viewDocuments")}
                </button>
              }
            >
              {agreements === null ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {!hasB2c && (
                    <li className="flex items-center gap-3 py-2 text-sm">
                      <FileSignature className="h-4 w-4 shrink-0 text-gray-500" />
                      <span className="min-w-0 flex-1">{t("sections.agreements")}</span>
                      <button type="button" className={linkButton} onClick={() => setDialog("agreements")}>{t("agreementsCard.sign")}</button>
                    </li>
                  )}
                  {agreementRows.map((a) => {
                    const signed = a.status === "SIGNED";
                    return (
                      <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
                        <FileSignature className="h-4 w-4 shrink-0 text-gray-500" />
                        <span className="min-w-0 flex-1 text-gray-900 dark:text-gray-100">{tTypes.has(a.agreement_type) ? tTypes(a.agreement_type) : a.agreement_type_display}</span>
                        <span className="hidden text-xs text-gray-500 sm:inline">
                          {signed && a.accepted_at ? t("agreementsCard.signedOn", { date: format(new Date(a.accepted_at), "d MMM yyyy", dateLocale) }) : ""}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${
                            signed ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {signed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                          {signed ? t("agreementsCard.signed") : t("agreementsCard.pending")}
                        </span>
                        {signed && a.signed_pdf_url ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" aria-label={t("agreementsCard.actions")} className="rounded p-1 text-gray-500 hover:bg-gray-100">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => downloadAgreement(a.id)}>
                                <Download className="mr-2 h-4 w-4" /> {t("agreementsCard.download")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAuditTarget({ id: a.id, label: tTypes.has(a.agreement_type) ? tTypes(a.agreement_type) : a.agreement_type_display })}>
                                <History className="mr-2 h-4 w-4" /> {t("agreementsCard.auditTrail")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="w-6" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              id="settings"
              icon={Settings}
              title={t("sections.settings")}
              subtitle={t("settingsCard.subtitle")}
              action={
                <button type="button" className={outlineButtonClass} onClick={() => setDialog("settings")}>
                  <Pencil className="h-3.5 w-3.5" /> {t("settingsCard.edit")}
                </button>
              }
            >
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Row label={t("settingsCard.language")}>{language ? tForm(`languages.${language.key}`) : notSet}</Row>
                <Row label={t("settingsCard.targetMarket")}>{targetMarket?.label || notSet}</Row>
                <Row label={t("settingsCard.timezone")}>{p.timezone || notSet}</Row>
                <Row label={t("settingsCard.appearance")}>
                  <span className="inline-flex items-center gap-2">
                    {theme === "dark" ? <Moon className="h-4 w-4 text-indigo-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
                    {theme === "dark" ? t("settings.dark") : t("settings.light")}
                  </span>
                </Row>
              </div>
            </SectionCard>
          </div>
        </div>
      </main>

      {/* Edit dialogs: the existing forms, unchanged in what they save. */}
      <Dialog open={dialog === "personal"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("dialogs.editPersonal")}</DialogTitle>
          </DialogHeader>
          <EditProfileTab
            mode="personal"
            onDone={() => {
              close();
              fetchProfile();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "contact"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("dialogs.editContact")}</DialogTitle>
          </DialogHeader>
          {profile && (
            <ContactForm
              profile={p}
              onCancel={close}
              onSave={async (data) => {
                const ok = await updateProfile(data as unknown as B2CProfileData);
                if (ok) {
                  await fetchProfile();
                  close();
                }
                return ok;
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "security"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("sections.security")}</DialogTitle>
          </DialogHeader>
          <SecurityTab />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "agreements"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("sections.agreements")}</DialogTitle>
          </DialogHeader>
          <AgreementsTab />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "settings"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("dialogs.editSettings")}</DialogTitle>
          </DialogHeader>
          {profile && (
            <IndividualSettings
              profile={p}
              onSave={async (prefs) => {
                const ok = await updateProfile(prefs as unknown as B2CProfileData);
                if (ok) {
                  await fetchProfile();
                  close();
                }
                return ok;
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AuditTrailModal agreementId={auditTarget?.id ?? null} agreementLabel={auditTarget?.label ?? ""} onClose={() => setAuditTarget(null)} />
    </div>
  );
}

function ContactForm({
  profile,
  onSave,
  onCancel,
}: {
  profile: Record<string, string | undefined>;
  onSave: (data: { phone_number: string; address?: string }) => Promise<boolean>;
  onCancel: () => void;
}) {
  const t = useTranslations("dashboard.indivisual.profile");
  const tForm = useTranslations("dashboard.indivisual.settings.edit-profile-tab");
  const [phone, setPhone] = useState(profile.phone_number || "");
  const [address, setAddress] = useState(profile.address || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const ok = await onSave({ phone_number: phone.trim(), address: address.trim() });
    setSaving(false);
    if (!ok) setError(t("dialogs.saveFailed"));
  };

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <label className="block text-xs font-medium text-gray-700">
        {t("contact.email")}
        <input type="email" value={profile.email || ""} disabled className={`${inputClass} mt-1 bg-gray-50 text-gray-500`} />
      </label>
      <label className="block text-xs font-medium text-gray-700">
        {tForm("phoneNumber")} *
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} className={`${inputClass} mt-1`} />
      </label>
      <label className="block text-xs font-medium text-gray-700">
        {tForm("address")}
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          maxLength={255}
          placeholder={tForm("addressPlaceholder")}
          className={`${inputClass} mt-1`}
        />
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className={outlineButtonClass} onClick={onCancel} disabled={saving}>
          {t("dialogs.cancel")}
        </button>
        <button type="button" className={primaryButtonClass} onClick={save} disabled={saving || !phone.trim()}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("dialogs.save")}
        </button>
      </div>
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
  const [error, setError] = useState<string | null>(null);
  const label = "block text-xs font-medium text-gray-700 dark:text-gray-300";
  const fieldButton = "min-h-10 rounded-lg border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950";
  const tSearch = useTranslations("shared.searchableSelect");

  const save = async () => {
    setSaving(true);
    setError(null);
    const ok = await onSave({
      preferred_language: prefs.preferred_language,
      target_market: prefs.target_market || undefined,
      timezone: prefs.timezone || undefined,
    });
    setSaving(false);
    if (!ok) setError(t("dialogs.saveFailed"));
  };

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <label className={label}>
        {t("settingsCard.appearance")}
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
      <div className={label}>
        <span id="b2c-settings-language" className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {t("settingsCard.language")}</span>
        <SearchSelect
          id="b2c-settings-language-select"
          aria-labelledby="b2c-settings-language"
          className="mt-1"
          buttonClassName={fieldButton}
          value={prefs.preferred_language}
          onChange={(value) => setPrefs((v) => ({ ...v, preferred_language: value }))}
          options={LANGUAGES.map((lang) => ({ value: lang.key, label: tForm(`languages.${lang.key}`), keywords: lang.key }))}
          searchPlaceholder={tSearch("searchLanguages")}
        />
      </div>
      <div className={label}>
        <span id="b2c-settings-market">{t("settingsCard.targetMarket")}</span>
        <CountrySelect
          id="b2c-settings-market-select"
          aria-labelledby="b2c-settings-market"
          className="mt-1"
          buttonClassName={fieldButton}
          value={prefs.target_market}
          onChange={(value) => setPrefs((v) => ({ ...v, target_market: value }))}
          emptyOptionLabel={tForm("selectTargetMarketPlaceholder")}
        />
      </div>
      <div className={label}>
        <span id="b2c-settings-timezone">{t("settingsCard.timezone")}</span>
        <SearchSelect
          id="b2c-settings-timezone-select"
          aria-labelledby="b2c-settings-timezone"
          className="mt-1"
          buttonClassName={fieldButton}
          value={prefs.timezone}
          onChange={(value) => setPrefs((v) => ({ ...v, timezone: value }))}
          options={[
            { value: "", label: tForm("selectTimezonePlaceholder") },
            ...(prefs.timezone && !timezoneOptions.includes(prefs.timezone) ? [{ value: prefs.timezone, label: prefs.timezone }] : []),
            ...timezoneOptions.map((tz) => ({ value: tz, label: tz })),
          ]}
          searchPlaceholder={tSearch("searchTimezones")}
        />
      </div>
      <div className="flex justify-end pt-1">
        <button type="button" onClick={save} disabled={saving} className={primaryButtonClass}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("settings.save")}
        </button>
      </div>
    </div>
  );
}
