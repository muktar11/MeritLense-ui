"use client"

import { useTranslations } from "next-intl"
import { CheckCircle2, Clock, ExternalLink, FileText } from "lucide-react"
import { CompanyLicenseDocuments } from "../company-license-documents"
import { API_BASE_URL } from "@/lib/config/env"
import { SectionCard, outlineButtonClass } from "./section-card"

function fileNameOf(url: string) {
  const last = url.split("?")[0].split("/").pop() || ""
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

// Media paths can come back relative to the API host (local storage).
function absoluteMediaUrl(url: string) {
  if (!url.startsWith("/")) return url
  try {
    return new URL(url, API_BASE_URL).href
  } catch {
    return url
  }
}

// Shown once the license is approved (before that, the page shows only the
// upload flow), so the license here is always on file and verified.
export function LicenseCard({
  id,
  profile,
  isOwner,
  onLicenseUploaded,
}: {
  id: string
  profile: Record<string, unknown>
  isOwner: boolean
  onLicenseUploaded: () => Promise<void>
}) {
  const t = useTranslations("dashboard.business.company-profile")
  const licenseUrl = typeof profile.resachetified_license === "string" ? absoluteMediaUrl(profile.resachetified_license) : ""
  const fileName = licenseUrl ? fileNameOf(licenseUrl) : ""
  const verified = profile.business_license_verified === true

  return (
    <SectionCard id={id} icon={FileText} title={t("sections.license")} subtitle={t("licenseCard.subtitle")}>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {fileName || t("licenseCard.fileLabel")}
          </p>
          {fileName && <p className="text-xs text-gray-500">{t("licenseCard.fileLabel")}</p>}
        </div>
        {verified ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> {t("licenseCard.verified")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            <Clock className="h-3.5 w-3.5" /> {t("licenseCard.underReview")}
          </span>
        )}
        {licenseUrl && (
          <a href={licenseUrl} target="_blank" rel="noopener noreferrer" className={outlineButtonClass}>
            <ExternalLink className="h-3.5 w-3.5" /> {t("licenseCard.view")}
          </a>
        )}
      </div>
      <div className="mt-3">
        <CompanyLicenseDocuments
          profile={profile}
          isCompanyOwner={isOwner}
          canUploadRequestedDocuments={isOwner}
          onLicenseUploaded={onLicenseUploaded}
          embedded
        />
      </div>
    </SectionCard>
  )
}
