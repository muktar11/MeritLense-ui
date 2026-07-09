"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { Loader2, CheckCircle2, Clock, FileSignature, Download, History } from "lucide-react"
import agreementService from "@/app/api/agreements/endpoints"
import type { Agreement } from "@/app/api/agreements/types"
import { AuditTrailModal } from "@/components/agreements/AuditTrailModal"

export default function AgreementsTab() {
  const t = useTranslations("dashboard.indivisual.settings.agreements-tab")
  const router = useRouter()
  const locale = useLocale()

  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [auditTarget, setAuditTarget] = useState<{ id: string; label: string } | null>(null)

  useEffect(() => {
    let active = true
    agreementService
      .getStatus()
      .then((data) => {
        if (!active) return
        setAgreement(data.find((a) => a.agreement_type === "B2C_AGREEMENT") ?? null)
      })
      .catch((error) => console.error("Failed to fetch agreement status:", error))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleDownload = async () => {
    if (!agreement) return
    try {
      const { url } = await agreementService.getDownloadUrl(agreement.id)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (error) {
      console.error("Failed to get agreement download URL:", error)
    }
  }

  const isSigned = agreement?.status === "SIGNED"

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-4">
        <FileSignature className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">{t("title")}</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">{t("description")}</p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("loading")}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              {agreement?.agreement_type_display || "B2C Agreement"}
            </span>
            {isSigned ? (
              <span className="inline-flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" /> {t("signed")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                <Clock className="w-4 h-4" /> {t("pending")}
              </span>
            )}
          </div>

          {isSigned && agreement && (
            <div className="flex items-center gap-4 text-sm">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 text-purple-600 hover:underline"
              >
                <Download className="w-4 h-4" /> {t("download")}
              </button>
              <button
                type="button"
                onClick={() => setAuditTarget({ id: agreement.id, label: agreement.agreement_type_display })}
                className="inline-flex items-center gap-1.5 text-purple-600 hover:underline"
              >
                <History className="w-4 h-4" /> {t("viewAuditTrail")}
              </button>
            </div>
          )}

          {!isSigned && (
            <button
              onClick={() => router.push(`/${locale}/dashboard/indivisual/sign-agreements`)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg"
            >
              {t("signButton")}
            </button>
          )}
        </div>
      )}

      <AuditTrailModal
        agreementId={auditTarget?.id ?? null}
        agreementLabel={auditTarget?.label ?? ""}
        onClose={() => setAuditTarget(null)}
      />
    </div>
  )
}
