"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { X, Loader2, ArrowRight, AlertCircle, CheckCircle2, Copy, Check } from "lucide-react"
import type { Candidate } from "@/app/api/candidates/types"
import interviewService from "@/app/api/interviews/endpoints"
import paymentService from "@/app/api/payments/endpoints"
import type { InterviewConfig, InterviewSession, RolePackage, RolePackageCoverageEntry } from "@/app/api/interviews/types"
import {
  getCoverageFromTier,
  getCoverageColor,
  getCoverageLabel,
  buildRolePackages,
  recommendPackageForFullCoverage,
  PACKAGE_ORDER_B2B,
} from "@/app/api/interviews/types"

interface StartSessionModalProps {
  isOpen: boolean
  onClose: () => void
  candidate?: Candidate | null
  candidates?: Candidate[]
  onSuccess?: (session: InterviewSession) => void
}

export default function StartSessionModal({
  isOpen,
  onClose,
  candidate: preselectedCandidate,
  candidates = [],
  onSuccess,
}: StartSessionModalProps) {
  const t = useTranslations("shared.startSessionModal")
  const locale = useLocale()
  const [configs, setConfigs] = useState<InterviewConfig[]>([])
  const [coverageRows, setCoverageRows] = useState<RolePackageCoverageEntry[]>([])
  // null = the employer's package_code couldn't be resolved (e.g. no active
  // subscription, or the subscription's price isn't tagged with a
  // package_code yet) - coverage is shown as "Unknown" rather than guessed.
  const [packageCode, setPackageCode] = useState<string | null>(null)
  const [loadingConfigs, setLoadingConfigs] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState("")
  const [selectedRoleCode, setSelectedRoleCode] = useState("")
  const [selectedConfigId, setSelectedConfigId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [createdSession, setCreatedSession] = useState<InterviewSession | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchConfigs()
      fetchPackageContext()
      if (preselectedCandidate) {
        setSelectedCandidateId(preselectedCandidate.id)
      }
    } else {
      setSelectedRoleCode("")
      setSelectedConfigId("")
      setError("")
      setCreatedSession(null)
      if (!preselectedCandidate) {
        setSelectedCandidateId("")
      }
    }
  }, [isOpen, preselectedCandidate])

  const fetchConfigs = async () => {
    setLoadingConfigs(true)
    try {
      const data = await interviewService.getConfigs()
      setConfigs(data)
    } catch {
      // configs unavailable — UI shows empty state
    } finally {
      setLoadingConfigs(false)
    }
  }

  const fetchPackageContext = async () => {
    try {
      const coverage = await interviewService.getRoleCoverage()
      setCoverageRows(coverage.filter(row => row.audience === "B2B"))
    } catch {
      // Coverage table unavailable — role packages will just render without
      // coverage badges rather than blocking role selection entirely.
      setCoverageRows([])
    }

    try {
      const subscriptions = await paymentService.getAllSubscriptions()
      if (!subscriptions || subscriptions.length === 0) {
        setPackageCode(null)
        return
      }
      const latest = [...subscriptions].sort(
        (a, b) => new Date(b.current_period_end).getTime() - new Date(a.current_period_end).getTime()
      )[0]
      const full = await paymentService.getSubscription(latest.id)
      setPackageCode(full.price_details?.metadata?.package_code ?? null)
    } catch {
      setPackageCode(null)
    }
  }

  const rolePackages: RolePackage[] = buildRolePackages(configs, coverageRows, packageCode).filter(p => p.available)

  const selectedRole = rolePackages.find(r => r.role_code === selectedRoleCode)
  const selectedConfig = configs.find(c => c.id === selectedConfigId)
  const showUpgradePrompt = selectedRole && selectedRole.coverage !== null && selectedRole.coverage !== 'FULL'
  const recommendedPackage = selectedRole
    ? recommendPackageForFullCoverage(selectedRole.role_code, coverageRows, PACKAGE_ORDER_B2B)
    : null

  const handleRoleSelect = (roleCode: string) => {
    setSelectedRoleCode(roleCode)
    setError("")
    const roleConfigs = configs.filter(c => c.role_code === roleCode)
    const fullConfig = roleConfigs.find(c => c.evaluation_tier === 'FULL')
    setSelectedConfigId((fullConfig ?? roleConfigs[0])?.id ?? "")
  }

  const handleSubmit = async () => {
    if (!selectedCandidateId || !selectedConfigId) {
      setError(t("selectCandidateAndPackageError"))
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const session = await interviewService.createSession({
        candidate_id: selectedCandidateId,
        config_id: selectedConfigId,
      })
      // The candidate starts the assessment only after completing consent,
      // device, verbal-confirmation, privacy, and identity prechecks.
      setCreatedSession(session)
      onSuccess?.(session)
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        err?.detail ??
        t("createSessionFailedError")
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const sessionLink = createdSession
    ? `${window.location.origin}/${locale}/interview?sessionId=${createdSession.id}&token=${createdSession.access_token}`
    : ""

  const handleCopyLink = async () => {
    if (!sessionLink) return
    await navigator.clipboard.writeText(sessionLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  if (!isOpen) return null

  const activeCandidateObj =
    preselectedCandidate ?? candidates.find(c => c.id === selectedCandidateId)

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl pointer-events-auto relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-2 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t("headerTitle")}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t("headerSubtitle")}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success state */}
        {createdSession ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("successTitle")}</h3>
            <p className="text-sm text-gray-600 mb-1">
              {t("successMessagePrefix")}{" "}
              <span className="font-medium">{activeCandidateObj?.full_name}</span> {t("successMessageSuffix")}
            </p>
            <p className="text-xs text-gray-500 mb-6">
              {t("roleCoverageLabel", { role: selectedRole?.role_name ?? "" })}{" "}
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  getCoverageColor(selectedRole?.coverage ?? null)
                }`}
              >
                {getCoverageLabel(selectedRole?.coverage ?? null)}
              </span>
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 mb-6 text-left">
              <p className="font-medium text-gray-700 mb-1">{t("interviewLinkLabel")}</p>
              <div className="flex items-center gap-2">
                <p className="font-mono break-all flex-1">{sessionLink}</p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="shrink-0 p-1.5 rounded-md bg-white border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-300"
                  title={t("copyLinkTooltip")}
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Candidate */}
            {!preselectedCandidate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("candidateLabel")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCandidateId}
                  onChange={e => setSelectedCandidateId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{t("selectCandidatePlaceholder")}</option>
                  {candidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} – {c.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {preselectedCandidate && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3">
                <p className="text-xs text-purple-500 font-medium uppercase tracking-wide mb-1">
                  {t("candidateLabel")}
                </p>
                <p className="text-sm font-semibold text-gray-900">{preselectedCandidate.full_name}</p>
                <p className="text-xs text-gray-500">
                  {preselectedCandidate.email} · {preselectedCandidate.job_role}
                </p>
              </div>
            )}

            {/* Role / Package selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t("rolePackageLabel")} <span className="text-red-500">*</span>
              </label>

              {loadingConfigs ? (
                <div className="flex items-center gap-2 text-gray-500 py-6">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{t("loadingPackages")}</span>
                </div>
              ) : rolePackages.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500">
                    {t("noPackagesTitle")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t("noPackagesSubtitle")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rolePackages.map(pkg => {
                    const isSelected = selectedRoleCode === pkg.role_code
                    return (
                      <button
                        key={pkg.role_code}
                        onClick={() => handleRoleSelect(pkg.role_code)}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl" aria-hidden="true">
                            {pkg.icon}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{pkg.role_name}</p>
                            <p className="text-xs text-gray-400">
                              {t("configCount", { count: pkg.configs.length })}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${getCoverageColor(pkg.coverage)}`}
                        >
                          {getCoverageLabel(pkg.coverage)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Selected role detail + tier chooser */}
            {selectedRole && selectedRole.configs.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {t("packageDetailsHeading", { role: selectedRole.role_name })}
                  </h4>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${getCoverageColor(selectedRole.coverage)}`}
                  >
                    {getCoverageLabel(selectedRole.coverage)}
                  </span>
                </div>

                {selectedConfig && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">{t("questionsLabel")}</p>
                      <p className="text-sm font-medium text-gray-900">{selectedConfig.total_questions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t("durationLabel")}</p>
                      <p className="text-sm font-medium text-gray-900">{t("durationValue", { value: selectedConfig.duration_minutes })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t("languageLabel")}</p>
                      <p className="text-sm font-medium text-gray-900">{selectedConfig.language}</p>
                    </div>
                  </div>
                )}

                {/* Tier selector when multiple configs per role */}
                {selectedRole.configs.length > 1 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      {t("interviewDepthLabel")}
                    </label>
                    <div className="flex gap-2">
                      {selectedRole.configs.map(cfg => {
                        const tierLabel = getCoverageFromTier(cfg.evaluation_tier)
                        return (
                          <button
                            key={cfg.id}
                            onClick={() => setSelectedConfigId(cfg.id)}
                            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                              selectedConfigId === cfg.id
                                ? "border-purple-500 bg-purple-50 text-purple-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {tierLabel}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upgrade prompt */}
            {showUpgradePrompt && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      {selectedRole.coverage === 'SCREENING'
                        ? t("screeningOnlyTitle")
                        : t("partialCoverageTitle")}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      {selectedRole.coverage === 'SCREENING'
                        ? t("screeningOnlyBody")
                        : t("partialCoverageBody")}
                      {recommendedPackage && (
                        <> {t("upgradeToPrefix")} <span className="font-semibold">{recommendedPackage.package_name}</span> {t("upgradeToSuffix")}</>
                      )}
                    </p>
                    <Link
                      href={`/${locale}/dashboard/business/payment`}
                      className="mt-2 inline-block text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900"
                    >
                      {t("upgradePlanLink")}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedCandidateId || !selectedConfigId}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("creating")}
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    {t("createAssessmentLink")}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
