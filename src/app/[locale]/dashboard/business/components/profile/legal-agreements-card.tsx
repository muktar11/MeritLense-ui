"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { Download, FileSignature, History, Loader2, MoreVertical } from "lucide-react"
import { useRouter } from "@/i18n/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AuditTrailModal } from "@/components/agreements/AuditTrailModal"
import agreementService from "@/app/api/agreements/endpoints"
import type { Agreement, AgreementType } from "@/app/api/agreements/types"
import { SectionCard, outlineButtonClass } from "./section-card"

const REQUIRED_AGREEMENT_TYPES: AgreementType[] = ["B2B_AGREEMENT", "DPA"]

interface Row {
  type: AgreementType
  label: string
  agreement: Agreement | undefined
}

export function LegalAgreementsCard({ id }: { id: string }) {
  const t = useTranslations("dashboard.business.company-profile")
  const tDocs = useTranslations("dashboard.business.signAgreements.docLabels")
  const locale = useLocale()
  const router = useRouter()
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [auditTarget, setAuditTarget] = useState<{ id: string; label: string } | null>(null)

  useEffect(() => {
    let active = true
    agreementService
      .getStatus()
      .then((data) => active && setAgreements(data))
      .catch((error) => console.error("Failed to fetch agreement status:", error))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const signPage = () => router.push("/dashboard/business/sign-agreements")

  const download = async (agreementId: string) => {
    try {
      const { url } = await agreementService.getDownloadUrl(agreementId)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (error) {
      console.error("Failed to get agreement download URL:", error)
    }
  }

  // The two agreements every company signs, then any other current
  // agreement on the account (e.g. terms accepted at registration).
  const rows: Row[] = [
    ...REQUIRED_AGREEMENT_TYPES.map((type) => ({
      type,
      label: type === "B2B_AGREEMENT" ? tDocs("b2bAgreement") : tDocs("dpa"),
      agreement: agreements.find((a) => a.agreement_type === type && a.status !== "SUPERSEDED"),
    })),
    ...agreements
      .filter((a) => !REQUIRED_AGREEMENT_TYPES.includes(a.agreement_type) && a.status !== "SUPERSEDED")
      .map((a) => ({ type: a.agreement_type, label: a.agreement_type_display, agreement: a })),
  ]
  const allSigned = REQUIRED_AGREEMENT_TYPES.every(
    (type) => agreements.find((a) => a.agreement_type === type)?.status === "SIGNED",
  )

  const signedOn = (agreement: Agreement | undefined) =>
    agreement?.status === "SIGNED" && agreement.accepted_at
      ? format(new Date(agreement.accepted_at), "MMM d, yyyy", locale === "ar" ? { locale: ar } : undefined)
      : "—"

  return (
    <SectionCard
      id={id}
      icon={FileSignature}
      title={t("agreements.title")}
      subtitle={t("agreementsTable.subtitle")}
      action={
        <button type="button" className={outlineButtonClass} onClick={signPage}>
          {allSigned ? t("agreements.viewButton") : t("agreements.signButton")}
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("agreements.loading")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-xs">
            <thead>
              <tr className="bg-gray-50 font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <th className="px-2 py-2 text-start">{t("agreementsTable.document")}</th>
                <th className="px-2 py-2 text-start">{t("agreementsTable.type")}</th>
                <th className="px-2 py-2 text-start">{t("agreementsTable.status")}</th>
                <th className="px-2 py-2 text-start">{t("agreementsTable.signedOn")}</th>
                <th className="px-2 py-2 text-end">{t("agreementsTable.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map(({ type, label, agreement }) => {
                const signed = agreement?.status === "SIGNED"
                return (
                  <tr key={`${type}-${agreement?.id ?? "missing"}`}>
                    <td className="px-2 py-2.5 text-gray-900 dark:text-gray-100">{label}</td>
                    <td className="px-2 py-2.5 text-gray-600">{t("agreementsTable.legal")}</td>
                    <td className="px-2 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 font-medium ${
                          signed ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${signed ? "bg-green-500" : "bg-amber-500"}`} />
                        {signed ? t("agreements.signed") : t("agreements.pending")}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-gray-600">{signedOn(agreement)}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {signed && agreement && (REQUIRED_AGREEMENT_TYPES.includes(type) || agreement.signed_pdf_url) ? (
                          <>
                            <button
                              type="button"
                              className="rounded-md border border-purple-200 px-3 py-1 font-medium text-purple-700 hover:bg-purple-50"
                              onClick={() => download(agreement.id)}
                            >
                              {t("agreementsTable.view")}
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" aria-label={t("actions.moreActions")} className="rounded p-1 text-gray-500 hover:bg-gray-100">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => download(agreement.id)}>
                                  <Download className="mr-2 h-4 w-4" /> {t("agreementsTable.download")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAuditTarget({ id: agreement.id, label })}>
                                  <History className="mr-2 h-4 w-4" /> {t("agreementsTable.auditTrail")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        ) : !signed && REQUIRED_AGREEMENT_TYPES.includes(type) ? (
                          <button
                            type="button"
                            className="rounded-md border border-purple-200 px-3 py-1 font-medium text-purple-700 hover:bg-purple-50"
                            onClick={signPage}
                          >
                            {t("agreementsTable.review")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <AuditTrailModal
        agreementId={auditTarget?.id ?? null}
        agreementLabel={auditTarget?.label ?? ""}
        onClose={() => setAuditTarget(null)}
      />
    </SectionCard>
  )
}
