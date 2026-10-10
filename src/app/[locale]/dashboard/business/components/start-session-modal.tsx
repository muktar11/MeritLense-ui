"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import Image from "next/image"
import {
  X, Loader2, AlertCircle, Search, ChevronDown, LayoutGrid, Users,
  User, FileText, Clock, Link2, Stethoscope, House, ConciergeBell, Shield, Settings, Truck,
  Wrench, Leaf, Briefcase, Brush, Baby, UserRound, Accessibility, HeartHandshake, Pill,
  HeartPulse, BedDouble, UtensilsCrossed, Ticket, SprayCan, Factory, Package, Car, HardHat,
  Wheat, PawPrint, ClipboardList, type LucideIcon,
} from "lucide-react"
import SessionCreatedPanel from "./session-created-panel"
import type { Candidate } from "@/app/api/candidates/types"
import interviewService from "@/app/api/interviews/endpoints"
import paymentService from "@/app/api/payments/endpoints"
import type { CoverageLevel, EvaluationTier, InterviewConfig, InterviewSession, RolePackage, RolePackageCoverageEntry } from "@/app/api/interviews/types"
import {
  getCoverageColor,
  buildRolePackages,
  recommendPackageForFullCoverage,
  PACKAGE_ORDER_B2B,
} from "@/app/api/interviews/types"

// Display-only grouping of the 21 role_codes into sidebar categories. Any
// role_code not listed here (e.g. one added to the backend later) lands in
// "other" rather than disappearing from the picker.
const ROLE_CATEGORIES: { key: string; icon: LucideIcon; roles: string[] }[] = [
  { key: "healthcare", icon: Stethoscope, roles: ["nursing_assistant", "elderly_medical_support", "basic_patient_support"] },
  { key: "home_care", icon: House, roles: ["domestic_worker", "child_caregiver", "elderly_caregiver", "special_needs_caregiver", "home_care_assistant"] },
  { key: "hospitality", icon: ConciergeBell, roles: ["hotel_housekeeper", "front_desk_agent", "restaurant_staff"] },
  { key: "security", icon: Shield, roles: ["security_guard", "event_security"] },
  { key: "facility", icon: Settings, roles: ["commercial_cleaner", "industrial_cleaner"] },
  { key: "logistics", icon: Truck, roles: ["warehouse_staff", "driver"] },
  { key: "trades", icon: Wrench, roles: ["general_labor", "skilled_trades"] },
  { key: "agriculture", icon: Leaf, roles: ["farm_worker", "livestock_support"] },
]
const OTHER_CATEGORY = { key: "other", icon: Briefcase }

const ROLE_LUCIDE_ICONS: Record<string, LucideIcon> = {
  domestic_worker: Brush,
  child_caregiver: Baby,
  elderly_caregiver: UserRound,
  special_needs_caregiver: Accessibility,
  nursing_assistant: Stethoscope,
  home_care_assistant: HeartHandshake,
  elderly_medical_support: Pill,
  basic_patient_support: HeartPulse,
  hotel_housekeeper: BedDouble,
  front_desk_agent: ConciergeBell,
  restaurant_staff: UtensilsCrossed,
  security_guard: Shield,
  event_security: Ticket,
  commercial_cleaner: SprayCan,
  industrial_cleaner: Factory,
  warehouse_staff: Package,
  driver: Car,
  general_labor: HardHat,
  skilled_trades: Wrench,
  farm_worker: Wheat,
  livestock_support: PawPrint,
}

const TIER_ORDER: EvaluationTier[] = ["FULL", "SCREENING", "BOTH"]

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
  const [searchQuery, setSearchQuery] = useState("")
  const [tierFilter, setTierFilter] = useState<EvaluationTier | "ALL">("ALL")
  const [activeCategory, setActiveCategory] = useState<string>("all")

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
      setSearchQuery("")
      setTierFilter("ALL")
      setActiveCategory("all")
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

  // role_name comes straight from the backend's role-coverage table in
  // English only (no i18n on that config data) - translate known role_codes
  // here, falling back to the raw name for anything not yet in the dict.
  const roleLabel = (role: RolePackage) => t.has(`roles.${role.role_code}`) ? t(`roles.${role.role_code}`) : role.role_name

  const selectedRole = rolePackages.find(r => r.role_code === selectedRoleCode)
  const selectedConfig = configs.find(c => c.id === selectedConfigId)
  const showUpgradePrompt = selectedRole && selectedRole.coverage !== null && selectedRole.coverage !== 'FULL'
  const recommendedPackage = selectedRole
    ? recommendPackageForFullCoverage(selectedRole.role_code, coverageRows, PACKAGE_ORDER_B2B)
    : null

  const tierLabel = (tier: EvaluationTier) =>
    tier === 'FULL' ? t("assessmentTypeFull")
    : tier === 'BOTH' ? t("assessmentTypeBoth")
    : t("assessmentTypeScreening")

  // With a tier filter active, only that tier's configs count for a role -
  // so the card's duration/type and the auto-selection below reflect what
  // the user actually filtered to.
  const visibleConfigs = (pkg: RolePackage) =>
    tierFilter === "ALL" ? pkg.configs : pkg.configs.filter(c => c.evaluation_tier === tierFilter)

  const availableTiers = TIER_ORDER.filter(tier => configs.some(c => c.evaluation_tier === tier))

  const categoryOf = (roleCode: string) =>
    ROLE_CATEGORIES.find(c => c.roles.includes(roleCode))?.key ?? OTHER_CATEGORY.key

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredPackages = rolePackages.filter(pkg =>
    visibleConfigs(pkg).length > 0 &&
    (!normalizedQuery ||
      roleLabel(pkg).toLowerCase().includes(normalizedQuery) ||
      pkg.role_name.toLowerCase().includes(normalizedQuery))
  )

  const categories = [...ROLE_CATEGORIES, { ...OTHER_CATEGORY, roles: [] as string[] }]
    .map(cat => ({ ...cat, packages: filteredPackages.filter(p => categoryOf(p.role_code) === cat.key) }))
    .filter(cat => cat.packages.length > 0)

  const shownCategories = activeCategory === "all"
    ? categories
    : categories.filter(c => c.key === activeCategory)

  const roleTypeLabel = (pkg: RolePackage) => {
    const tiers = TIER_ORDER.filter(tier => visibleConfigs(pkg).some(c => c.evaluation_tier === tier))
    if (tiers.length === 1) return tierLabel(tiers[0])
    // Several depths on offer - the short names keep this to one card line.
    return tiers.map(tier => tier === 'FULL' ? t("coverageFull") : tier === 'BOTH' ? t("depthTierBoth") : t("coverageScreening")).join(" · ")
  }

  const roleDurationLabel = (pkg: RolePackage) => {
    const durations = visibleConfigs(pkg).map(c => c.duration_minutes)
    const min = Math.min(...durations)
    const max = Math.max(...durations)
    return t("durationValue", { value: min === max ? `${min}` : `${min}–${max}` })
  }

  const handleRoleSelect = (roleCode: string) => {
    setSelectedRoleCode(roleCode)
    setError("")
    const pkg = rolePackages.find(r => r.role_code === roleCode)
    const roleConfigs = pkg ? visibleConfigs(pkg) : []
    // Only auto-select when there's exactly one real option. Silently
    // pre-picking a tier (previously always preferring FULL) when there
    // were multiple configs to choose from short-circuited the Interview
    // Depth step the user should make explicitly - and since that step's
    // button group only renders when there's more than one config, it
    // could vanish entirely, making role selection feel like it skipped
    // straight past a step the user never actually got to answer.
    setSelectedConfigId(roleConfigs.length === 1 ? roleConfigs[0].id : "")
  }

  // Distinguishes configs that would otherwise show the identical tier
  // label (e.g. two FULL-tier configs in different languages) so the
  // Interview Depth buttons never look like repeated/duplicate options.
  const depthTierLabel = (cfg: InterviewConfig, siblings: InterviewConfig[]) => {
    const tier =
      cfg.evaluation_tier === 'FULL' ? t("depthTierFull")
      : cfg.evaluation_tier === 'BOTH' ? t("depthTierBoth")
      : t("depthTierScreening")
    const sameTierCount = siblings.filter(c => c.evaluation_tier === cfg.evaluation_tier).length
    return sameTierCount > 1 ? t("depthTierWithLanguage", { tier, language: cfg.language }) : tier
  }

  const coverageLabel = (coverage: CoverageLevel | null) => {
    switch (coverage) {
      case 'FULL': return t("coverageFull")
      case 'PARTIAL': return t("coveragePartial")
      case 'SCREENING': return t("coverageScreening")
      default: return t("coverageUnknown")
    }
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
      }, locale)
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

  // Prefer the short link the backend returns (it redirects to the full
  // interview link); fall back to building the full link locally.
  const sessionLink = createdSession
    ? createdSession.short_link ||
      createdSession.interview_link ||
      `${window.location.origin}/${locale}/interview?sessionId=${createdSession.id}&token=${createdSession.access_token}`
    : ""

  if (!isOpen) return null

  const activeCandidateObj =
    preselectedCandidate ?? candidates.find(c => c.id === selectedCandidateId)

  const selectedRoleConfigs = selectedRole ? visibleConfigs(selectedRole) : []
  const SelectedRoleIcon = selectedRole ? ROLE_LUCIDE_ICONS[selectedRole.role_code] ?? ClipboardList : User

  const sidebarItems = [
    { key: "all", icon: LayoutGrid, label: t("allRoles"), count: filteredPackages.length },
    ...categories.map(cat => ({ key: cat.key, icon: cat.icon, label: t(`categories.${cat.key}`), count: cat.packages.length })),
  ]

  const summaryItems = [
    { icon: SelectedRoleIcon, label: t("selectedRoleLabel"), value: selectedRole ? roleLabel(selectedRole) : t("notSelected"), strong: true },
    { icon: FileText, label: t("assessmentTypeLabel"), value: selectedConfig ? tierLabel(selectedConfig.evaluation_tier) : t("notSelected"), strong: false },
    { icon: Clock, label: t("footerDurationLabel"), value: selectedConfig ? t("durationMinutes", { value: selectedConfig.duration_minutes }) : t("notSelected"), strong: false },
  ]

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={onClose} />
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full pointer-events-auto relative flex flex-col max-h-[95vh] ${
          createdSession ? "max-w-2xl" : "max-w-6xl h-[95vh] sm:h-[90vh]"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          {createdSession ? (
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="MeritLense" width={506} height={459} className="h-10 w-auto" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">MeritLense</h2>
                <p className="text-sm text-gray-500">{t("brandTagline")}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 min-w-0">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-purple-100 items-center justify-center shrink-0">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{t("headerTitle")}</h2>
                <p className="text-sm sm:text-base text-gray-500 mt-0.5">{t("headerSubtitle")}</p>
              </div>
            </div>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors p-1 shrink-0" aria-label={t("close")}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success state */}
        {createdSession ? (
          <div className="px-6 pb-6 pt-4 overflow-y-auto">
            <SessionCreatedPanel
              candidateName={activeCandidateObj?.full_name ?? createdSession.candidate_name}
              candidateEmail={activeCandidateObj?.email}
              roleName={selectedRole ? roleLabel(selectedRole) : createdSession.role_name}
              coverageLabel={coverageLabel(selectedRole?.coverage ?? null)}
              coverageClassName={getCoverageColor(selectedRole?.coverage ?? null)}
              link={sessionLink}
              onClose={onClose}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-1 min-h-0">
              {/* Category sidebar */}
              {!loadingConfigs && rolePackages.length > 0 && (
                <nav className="hidden md:block w-64 shrink-0 border-e border-gray-100 p-4 overflow-y-auto">
                  <ul className="space-y-1">
                    {sidebarItems.map(item => {
                      const Icon = item.icon
                      const isActive = activeCategory === item.key
                      return (
                        <li key={item.key}>
                          <button
                            type="button"
                            onClick={() => setActiveCategory(item.key)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition-colors ${
                              isActive ? "bg-purple-100" : "hover:bg-gray-50"
                            }`}
                          >
                            <Icon className={`w-6 h-6 shrink-0 ${isActive ? "text-purple-600" : "text-gray-700"}`} strokeWidth={1.75} />
                            <span className="min-w-0">
                              <span className={`block text-sm font-medium truncate ${isActive ? "text-purple-700" : "text-gray-900"}`}>
                                {item.label}
                              </span>
                              <span className="block text-xs text-gray-500">{t("roleCount", { count: item.count })}</span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </nav>
              )}

              {/* Main column */}
              <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-5 py-4 space-y-5">
                {/* Candidate */}
                {!preselectedCandidate ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("candidateLabel")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedCandidateId}
                      onChange={e => setSelectedCandidateId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">{t("selectCandidatePlaceholder")}</option>
                      {candidates.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} – {c.email}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5">
                    <User className="w-5 h-5 text-purple-600 shrink-0" />
                    <p className="text-sm min-w-0 truncate">
                      <span className="text-purple-600 font-medium">{t("candidateLabel")}:</span>{" "}
                      <span className="font-semibold text-gray-900">{preselectedCandidate.full_name}</span>{" "}
                      <span className="text-gray-500">· {preselectedCandidate.email}</span>
                    </p>
                  </div>
                )}

                {loadingConfigs ? (
                  <div className="flex items-center gap-2 text-gray-500 py-6">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{t("loadingPackages")}</span>
                  </div>
                ) : rolePackages.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">{t("noPackagesTitle")}</p>
                    <p className="text-xs text-gray-400 mt-1">{t("noPackagesSubtitle")}</p>
                  </div>
                ) : (
                  <>
                    {/* Search + assessment type filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder={t("searchPlaceholder")}
                          className="w-full ps-12 pe-4 py-3 border border-purple-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="relative sm:w-64">
                        <select
                          value={tierFilter}
                          onChange={e => setTierFilter(e.target.value as EvaluationTier | "ALL")}
                          className="w-full appearance-none ps-4 pe-10 py-3 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="ALL">{t("assessmentTypeAll")}</option>
                          {availableTiers.map(tier => (
                            <option key={tier} value={tier}>{tierLabel(tier)}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute end-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                    </div>

                    {/* Category chips - small screens, where the sidebar is hidden */}
                    <div className="flex md:hidden gap-2 overflow-x-auto pb-1">
                      {sidebarItems.map(item => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setActiveCategory(item.key)}
                          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${
                            activeCategory === item.key
                              ? "bg-purple-100 border-purple-200 text-purple-700"
                              : "bg-white border-gray-200 text-gray-600"
                          }`}
                        >
                          {item.label} ({item.count})
                        </button>
                      ))}
                    </div>

                    {shownCategories.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500">{t("noRolesMatch")}</p>
                      </div>
                    ) : (
                      shownCategories.map(cat => {
                        const CatIcon = cat.icon
                        return (
                          <section key={cat.key}>
                            <div className="flex items-center justify-between bg-purple-50/70 rounded-xl px-4 py-2.5 mb-3">
                              <div className="flex items-center gap-3">
                                <CatIcon className="w-5 h-5 text-purple-600" strokeWidth={1.75} />
                                <h3 className="text-sm sm:text-base font-semibold text-gray-900">{t(`categories.${cat.key}`)}</h3>
                              </div>
                              <span className="text-sm text-gray-600">{t("roleCount", { count: cat.packages.length })}</span>
                            </div>
                            <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                              {cat.packages.map(pkg => {
                                const isSelected = selectedRoleCode === pkg.role_code
                                const RoleIcon = ROLE_LUCIDE_ICONS[pkg.role_code] ?? ClipboardList
                                return (
                                  <button
                                    key={pkg.role_code}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    onClick={() => handleRoleSelect(pkg.role_code)}
                                    className={`relative flex items-start gap-3 p-3 rounded-xl border text-start transition-all ${
                                      isSelected
                                        ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500"
                                        : "border-gray-200 bg-white hover:border-purple-200"
                                    }`}
                                  >
                                    <span className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                      <RoleIcon className="w-7 h-7 text-purple-600" strokeWidth={1.75} />
                                    </span>
                                    <span className="flex-1 min-w-0 pe-6">
                                      <span className="block text-sm font-semibold text-gray-900 leading-snug">{roleLabel(pkg)}</span>
                                      <span className="flex items-center justify-between gap-2 mt-1">
                                        <span className="text-xs text-gray-500 truncate">{roleTypeLabel(pkg)}</span>
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${getCoverageColor(pkg.coverage)}`}>
                                          {coverageLabel(pkg.coverage)}
                                        </span>
                                      </span>
                                      <span className="block text-xs text-gray-500 mt-1">{roleDurationLabel(pkg)}</span>
                                    </span>
                                    <span
                                      className={`absolute top-3 end-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        isSelected ? "border-purple-600" : "border-gray-400"
                                      }`}
                                    >
                                      {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </section>
                        )
                      })
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Depth chooser, upgrade prompt and errors sit pinned above the
                footer, so they're visible as soon as a role is picked rather
                than somewhere below the fold of the role grid. */}
            {(selectedRoleConfigs.length > 1 || showUpgradePrompt || error) && (
              <div className="shrink-0 border-t border-gray-100 px-4 sm:px-6 py-3 space-y-3 max-h-[30vh] overflow-y-auto">
                {selectedRoleConfigs.length > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 shrink-0">{t("interviewDepthLabel")}</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoleConfigs.map(cfg => (
                        <button
                          key={cfg.id}
                          type="button"
                          onClick={() => setSelectedConfigId(cfg.id)}
                          className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                            selectedConfigId === cfg.id
                              ? "border-purple-500 bg-purple-50 text-purple-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {depthTierLabel(cfg, selectedRoleConfigs)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showUpgradePrompt && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
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

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Footer: selection summary + actions */}
            <div className="shrink-0 border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Hidden on phones, where the selected card itself shows the same info. */}
              <div className="hidden sm:flex flex-1 flex-wrap items-center gap-x-6 gap-y-3 min-w-0">
                {summaryItems.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className={`flex items-center gap-3 min-w-0 ${i > 0 ? "sm:border-s sm:border-gray-100 sm:ps-6" : ""}`}>
                      <span className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-purple-600" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs text-gray-500">{item.label}</span>
                        <span className={`block truncate text-gray-900 ${item.strong ? "text-base font-bold" : "text-sm font-medium"}`}>
                          {item.value}
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 lg:flex-none px-6 py-2.5 sm:py-3 whitespace-nowrap text-gray-800 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedCandidateId || !selectedConfigId}
                  className="flex-1 lg:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("creating")}
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      {t("createAssessmentLink")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
