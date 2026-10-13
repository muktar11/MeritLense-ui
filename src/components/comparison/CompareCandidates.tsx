"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSearch,
  FileText,
  GitCompare,
  Info,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { comparisonApi, type ComparisonScope } from "@/app/api/dashboard/comparison";
import type {
  ComparisonAssessment,
  ComparisonRole,
  EvaluationTier,
  FullComparisonResult,
} from "@/app/api/dashboard/b2b/types";
import { EvaluationResultsModal } from "@/components/evaluations/EvaluationResultsModal";
import { exportChartAsPng } from "@/lib/chart-export";
import { cn } from "@/lib/utils";

// Assigned by selection order, so a candidate keeps one colour across the
// selection chips, summary cards and both charts (and the PDF, which uses
// the same palette - CANDIDATE_COLORS in comparison_pdf_services.py).
const CANDIDATE_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444"];
const MAX_CANDIDATES = 4;

const READINESS_BADGE: Record<string, string> = {
  READY: "bg-green-100 text-green-700",
  PARTIALLY_READY: "bg-amber-100 text-amber-700",
  NOT_READY: "bg-red-100 text-red-700",
};

function classificationClass(classification: string) {
  if (classification === "CRITICAL") return "bg-red-100 text-red-700";
  if (classification === "NON_CRITICAL") return "bg-gray-100 text-gray-600";
  return "bg-indigo-100 text-indigo-700";
}

interface CandidateGroup {
  candidateId: string;
  candidateName: string;
  assessments: ComparisonAssessment[];
}

export function CompareCandidates({ scope }: { scope: ComparisonScope }) {
  const t = useTranslations("dashboard.compareCandidates");
  const tRoles = useTranslations("shared.startSessionModal.roles");
  const locale = useLocale();
  const api = useMemo(() => comparisonApi(scope), [scope]);
  const dateFormat = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }), [locale]);
  const formatDate = (iso: string) => {
    const date = new Date(`${iso}T00:00:00`);
    return Number.isNaN(date.getTime()) ? iso : dateFormat.format(date);
  };
  const roleLabel = (role: { role_code: string; role_name: string }) =>
    tRoles.has(role.role_code) ? tRoles(role.role_code) : role.role_name;

  // Step 1: role and assessment type. Screening and Full Assessment results
  // are never compared together, so the type is chosen up front.
  const [roles, setRoles] = useState<ComparisonRole[]>([]);
  const [rolesState, setRolesState] = useState<"loading" | "ready" | "error">("loading");
  const [roleCode, setRoleCode] = useState<string | null>(null);
  const [tier, setTier] = useState<EvaluationTier>("FULL");

  // Step 2: assessments, filters, selection (evaluation ids, in order).
  const [assessments, setAssessments] = useState<ComparisonAssessment[]>([]);
  const [assessmentsState, setAssessmentsState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  // Step 3: results.
  const [result, setResult] = useState<FullComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState<"incompatible" | "failed" | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingChart, setExportingChart] = useState<"radar" | "bar" | null>(null);
  const [reportFor, setReportFor] = useState<{ evaluationId: string; name: string } | null>(null);
  const compareRequest = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getRoles()
      .then((data) => {
        setRoles(data);
        setRolesState("ready");
      })
      .catch((error) => {
        console.error("Failed to load comparison roles:", error);
        setRolesState("error");
      });
  }, [api]);

  const clearResult = () => {
    compareRequest.current++;
    setResult(null);
    setCompareError(null);
    setComparing(false);
  };

  useEffect(() => {
    if (!roleCode) return;
    let active = true;
    queueMicrotask(() => active && setAssessmentsState("loading"));
    api.getAssessments(roleCode, { evaluationTier: tier, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then((data) => {
        if (!active) return;
        setAssessments(data);
        setAssessmentsState("ready");
      })
      .catch((error) => {
        console.error("Failed to load comparable assessments:", error);
        if (active) setAssessmentsState("error");
      });
    return () => {
      active = false;
    };
  }, [api, roleCode, tier, dateFrom, dateTo]);

  const chooseRole = (code: string) => {
    if (code === roleCode) return;
    setRoleCode(code);
    setSelected([]);
    setAssessments([]);
    clearResult();
  };

  const chooseTier = (value: EvaluationTier) => {
    if (value === tier) return;
    setTier(value);
    setSelected([]);
    clearResult();
  };

  const byEvaluationId = useMemo(() => new Map(assessments.map((a) => [a.evaluation_id, a])), [assessments]);

  // A selection whose assessment no longer matches the filters is kept
  // (the user picked it deliberately) - it's looked up here first.
  const [selectedRows, setSelectedRows] = useState<Record<string, ComparisonAssessment>>({});

  const toggleAssessment = (assessment: ComparisonAssessment) => {
    clearResult();
    if (selected.includes(assessment.evaluation_id)) {
      setSelected(selected.filter((id) => id !== assessment.evaluation_id));
      return;
    }
    // One assessment per candidate: picking another attempt replaces it.
    const sameCandidate = selected.find(
      (id) => (selectedRows[id] ?? byEvaluationId.get(id))?.candidate_id === assessment.candidate_id,
    );
    if (sameCandidate) {
      setSelected(selected.map((id) => (id === sameCandidate ? assessment.evaluation_id : id)));
    } else if (selected.length < MAX_CANDIDATES) {
      setSelected([...selected, assessment.evaluation_id]);
    } else {
      return;
    }
    setSelectedRows((rows) => ({ ...rows, [assessment.evaluation_id]: assessment }));
  };

  const colorOf = (evaluationId: string) => {
    const index = selected.indexOf(evaluationId);
    return index === -1 ? undefined : CANDIDATE_COLORS[index % CANDIDATE_COLORS.length];
  };

  const groups: CandidateGroup[] = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    const map = new Map<string, CandidateGroup>();
    assessments.forEach((assessment) => {
      if (query && !assessment.candidate_name.toLocaleLowerCase(locale).includes(query)) return;
      const group = map.get(assessment.candidate_id) ?? {
        candidateId: assessment.candidate_id,
        candidateName: assessment.candidate_name,
        assessments: [],
      };
      group.assessments.push(assessment);
      map.set(assessment.candidate_id, group);
    });
    return Array.from(map.values());
  }, [assessments, search, locale]);

  const selectedCandidateIds = new Set(selected.map((id) => (selectedRows[id] ?? byEvaluationId.get(id))?.candidate_id));

  const compare = async () => {
    if (!roleCode || selected.length < 2) return;
    const request = ++compareRequest.current;
    setResult(null);
    setCompareError(null);
    setComparing(true);
    try {
      const data = await api.compare(roleCode, selected, locale);
      if (request !== compareRequest.current) return;
      setResult(data);
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (error: unknown) {
      if (request !== compareRequest.current) return;
      const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
      setCompareError(code === "INCOMPATIBLE_SELECTION" ? "incompatible" : "failed");
    } finally {
      if (request === compareRequest.current) setComparing(false);
    }
  };

  // Charts and table use exactly the comparison's competency rows - the
  // union of labels in first-seen order, no recalculated values.
  const competencyRows = useMemo(() => {
    if (!result) return [];
    const rows: { label: string; classification: string; values: (number | null)[] }[] = [];
    const index = new Map<string, number>();
    result.candidates.forEach((entry, column) => {
      entry.competencies.forEach((c) => {
        if (!index.has(c.label)) {
          index.set(c.label, rows.length);
          rows.push({ label: c.label, classification: c.classification, values: result.candidates.map(() => null) });
        }
        rows[index.get(c.label)!].values[column] = c.percentage;
      });
    });
    return rows;
  }, [result]);

  const seriesKey = (column: number) => `c${column}`;
  const chartData = useMemo(
    () =>
      competencyRows.map((row) => {
        const point: Record<string, string | number | null> = { competency: row.label };
        row.values.forEach((value, column) => {
          point[seriesKey(column)] = value;
        });
        return point;
      }),
    [competencyRows],
  );
  const legend = (result?.candidates ?? []).map((entry, column) => ({
    name: entry.candidate_name,
    color: CANDIDATE_COLORS[column % CANDIDATE_COLORS.length],
  }));

  const exportChart = async (kind: "radar" | "bar") => {
    const container = document.getElementById(`comparison-${kind}-chart`);
    if (!container) return;
    setExportingChart(kind);
    try {
      await exportChartAsPng(container, `candidate-comparison-${kind}.png`, legend);
    } catch (error) {
      console.error("Failed to export chart:", error);
    } finally {
      setExportingChart(null);
    }
  };

  const exportPdf = async () => {
    if (!roleCode || !result) return;
    setExportingPdf(true);
    try {
      await api.downloadPdf(roleCode, result.candidates.map((c) => c.evaluation_id), locale);
    } catch (error) {
      console.error("Failed to export comparison PDF:", error);
    } finally {
      setExportingPdf(false);
    }
  };

  const readinessLabel = (status: string) => (t.has(`readiness.${status}`) ? t(`readiness.${status}`) : status);
  const tierLabel = (value: string) => (value === "SCREENING" ? t("tier.SCREENING") : t("tier.FULL"));
  const selectedRole = roles.find((r) => r.role_code === roleCode);

  return (
    <div className="min-h-screen bg-gray-50" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">{t("subtitle")}</p>
        </div>

        {/* Step 1 */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <StepHeading number={1} title={t("step1.title")} hint={t("step1.hint")} />
          {rolesState === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : rolesState === "error" ? (
            <p className="text-sm text-red-600">{t("loadFailed")}</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-gray-500">{t("step1.noRoles")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <button
                  key={role.role_code}
                  type="button"
                  onClick={() => chooseRole(role.role_code)}
                  aria-pressed={roleCode === role.role_code}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition",
                    roleCode === role.role_code
                      ? "border-purple-600 bg-purple-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-purple-400",
                  )}
                >
                  {roleLabel(role)}
                  <span className={cn("ms-2 text-xs", roleCode === role.role_code ? "text-purple-100" : "text-gray-400")}>
                    {role.candidate_count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {roleCode && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-gray-700">{t("step1.typeLabel")}</p>
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1" role="radiogroup" aria-label={t("step1.typeLabel")}>
                {(["FULL", "SCREENING"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={tier === value}
                    onClick={() => chooseTier(value)}
                    className={cn(
                      "rounded-md px-4 py-1.5 text-sm font-medium transition",
                      tier === value ? "bg-white text-purple-700 shadow-sm" : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    {tierLabel(value)}
                  </button>
                ))}
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t("step1.typeHint")}
              </p>
            </div>
          )}
        </section>

        {/* Step 2 */}
        {roleCode && (
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <StepHeading
              number={2}
              title={t("step2.title")}
              hint={t("step2.hint", { role: selectedRole ? roleLabel(selectedRole) : roleCode, type: tierLabel(tier) })}
            />

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
              <label className="relative block">
                <span className="sr-only">{t("step2.search")}</span>
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("step2.search")}
                  className="h-10 w-full rounded-lg border border-gray-300 ps-9 pe-3 text-sm outline-none focus:border-purple-400"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <span className="shrink-0">{t("step2.from")}</span>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-purple-400 sm:w-auto"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <span className="shrink-0">{t("step2.to")}</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-purple-400 sm:w-auto"
                />
              </label>
            </div>

            {/* Selection */}
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm" aria-live="polite">
              <span className="text-gray-600">{t("step2.selected", { count: selected.length, max: MAX_CANDIDATES })}</span>
              {selected.map((id) => {
                const row = selectedRows[id] ?? byEvaluationId.get(id);
                if (!row) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: colorOf(id) }}
                  >
                    {row.candidate_name} · {formatDate(row.assessment_date)}
                    <button
                      type="button"
                      onClick={() => toggleAssessment(row)}
                      aria-label={t("step2.remove", { name: row.candidate_name })}
                      className="rounded-full hover:bg-white/20"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>

            {assessmentsState === "loading" ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
            ) : assessmentsState === "error" ? (
              <p className="text-sm text-red-600">{t("loadFailed")}</p>
            ) : groups.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">{t("step2.empty")}</p>
            ) : (
              <ul className="max-h-[28rem] divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
                {groups.map((group) => {
                  const candidateTaken = selectedCandidateIds.has(group.candidateId);
                  const full = !candidateTaken && selected.length >= MAX_CANDIDATES;
                  return (
                    <li key={group.candidateId} className="p-3">
                      <p className="mb-2 text-sm font-semibold text-gray-900">
                        {group.candidateName}
                        {group.assessments.length > 1 && (
                          <span className="ms-2 text-xs font-normal text-gray-500">
                            {t("step2.attempts", { count: group.assessments.length })}
                          </span>
                        )}
                      </p>
                      <div className="space-y-1.5">
                        {group.assessments.map((assessment) => {
                          const isSelected = selected.includes(assessment.evaluation_id);
                          const color = colorOf(assessment.evaluation_id);
                          return (
                            <label
                              key={assessment.evaluation_id}
                              className={cn(
                                "flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-3 py-2 text-sm transition",
                                isSelected ? "border-transparent bg-purple-50" : "border-gray-100 hover:border-purple-200",
                                full && "cursor-not-allowed opacity-50",
                              )}
                              style={isSelected ? { boxShadow: `inset 3px 0 0 ${color}` } : undefined}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={full}
                                onChange={() => toggleAssessment(assessment)}
                                className="h-4 w-4 accent-purple-600"
                              />
                              <span className="min-w-[7rem] font-medium text-gray-800">{formatDate(assessment.assessment_date)}</span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                                {tierLabel(assessment.evaluation_tier)}
                              </span>
                              <span className={cn("rounded-full px-2 py-0.5 text-xs", READINESS_BADGE[assessment.readiness_status] ?? "bg-gray-100 text-gray-600")}>
                                {readinessLabel(assessment.readiness_status)}
                              </span>
                              {assessment.review_status === "HUMAN_REVIEW" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                  <AlertTriangle className="h-3 w-3" /> {t("status.HUMAN_REVIEW")}
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{t("status.COMPLETE")}</span>
                              )}
                              <span className="ms-auto text-sm font-semibold text-gray-900" dir="ltr">
                                {assessment.overall_score !== null ? `${Math.round(assessment.overall_score)}%` : "—"}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={compare}
                disabled={selected.length < 2 || comparing}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {comparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
                {comparing ? t("comparing") : t("compare", { count: selected.length })}
              </button>
              {selected.length === 1 && <p className="text-xs text-amber-600">{t("step2.needTwo")}</p>}
            </div>
            {compareError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {compareError === "incompatible" ? t("incompatible") : t("compareFailed")}
              </p>
            )}
          </section>
        )}

        {/* Step 3 */}
        {result && (
          <section ref={resultsRef} className="space-y-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <StepHeading
                number={3}
                title={t("step3.title")}
                hint={`${selectedRole ? roleLabel(selectedRole) : result.role_name} · ${tierLabel(result.evaluation_tier)}`}
              />
              <button
                type="button"
                onClick={exportPdf}
                disabled={exportingPdf}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {exportingPdf ? t("exportingPdf") : t("exportPdf")}
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {result.candidates.map((entry, column) => (
                <article
                  key={entry.evaluation_id}
                  className="rounded-lg border border-gray-200 p-4"
                  style={{ borderTop: `4px solid ${CANDIDATE_COLORS[column % CANDIDATE_COLORS.length]}` }}
                >
                  <h3 className="truncate font-semibold text-gray-900">{entry.candidate_name}</h3>
                  <p className="mb-3 text-xs text-gray-500">
                    {tierLabel(entry.evaluation_tier)} · {formatDate(entry.assessment_date)}
                  </p>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-gray-500">{t("overallScore")}</dt>
                      <dd className="text-2xl font-bold text-gray-900" dir="ltr">
                        {entry.overall_score !== null ? (
                          `${Math.round(entry.overall_score)}%`
                        ) : (
                          <span className="block py-1 text-xs font-medium leading-snug text-gray-500" dir="auto">
                            {entry.score_withheld ? t("scoreWithheld") : "—"}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">{t("readinessLevel")}</dt>
                      <dd>
                        <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-semibold", READINESS_BADGE[entry.readiness_status] ?? "bg-gray-100 text-gray-600")}>
                          {entry.readiness_display}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">{t("criticalIndicators")}</dt>
                      <dd>
                        {entry.critical_indicators.failed_count > 0 ? (
                          <span className="text-xs text-red-700">
                            {t("criticalNotMet", { count: entry.critical_indicators.failed_count })}
                            {entry.critical_indicators.failed_topics.length > 0 && `: ${entry.critical_indicators.failed_topics.join(locale === "ar" ? "، " : ", ")}`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {t("criticalAllMet")}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="text-xs text-gray-500">
                      {t("assessmentCoverage")}: <span className="font-medium text-gray-700" dir="ltr">{entry.assessment_coverage}%</span>
                    </div>
                    {entry.requires_human_review && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        <AlertTriangle className="h-3 w-3" /> {t("humanReviewRequired")}
                      </span>
                    )}
                  </dl>
                  <button
                    type="button"
                    onClick={() => setReportFor({ evaluationId: entry.evaluation_id, name: entry.candidate_name })}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800"
                  >
                    <FileSearch className="h-3.5 w-3.5" /> {t("viewFullReport")}
                  </button>
                </article>
              ))}
            </div>

            {/* Competency table */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">{t("competencyComparison")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[32rem] text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-start text-xs uppercase text-gray-400">
                      <th className="py-2 pe-3 text-start">{t("competency")}</th>
                      <th className="py-2 pe-3 text-start">{t("classification")}</th>
                      {result.candidates.map((entry, column) => (
                        <th key={entry.evaluation_id} className="px-3 py-2 text-center">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CANDIDATE_COLORS[column % CANDIDATE_COLORS.length] }} />
                            {entry.candidate_name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {competencyRows.map((row) => (
                      <tr key={row.label} className="border-b border-gray-100">
                        <td className="py-2 pe-3 text-gray-800">{row.label}</td>
                        <td className="py-2 pe-3">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", classificationClass(row.classification))}>
                            {t(`classificationLabel.${row.classification === "CRITICAL" || row.classification === "NON_CRITICAL" ? row.classification : "REQUIRED"}`)}
                          </span>
                        </td>
                        {row.values.map((value, column) => (
                          <td key={column} className="px-3 py-2 text-center text-gray-700" dir="ltr">
                            {value !== null ? `${Math.round(value)}%` : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {result.key_differences.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">{t("keyDifferences")}</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                  {result.key_differences.map((diff, index) => <li key={index}>{diff.text}</li>)}
                </ul>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title={t("radarChart")}
                onExport={() => exportChart("radar")}
                exporting={exportingChart === "radar"}
                exportLabel={t("exportPng")}
                disabled={chartData.length < 3}
              >
                <div id="comparison-radar-chart" className="h-80 w-full bg-white" dir="ltr">
                  {chartData.length < 3 ? (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-400">{t("notEnoughForRadar")}</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={chartData} margin={{ top: 16, right: 32, left: 32, bottom: 16 }}>
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="competency" tick={{ fontSize: 11, fill: "#4B5563" }} />
                        <PolarRadiusAxis domain={[0, 100]} stroke="#D1D5DB" tick={{ fontSize: 10 }} />
                        {result.candidates.map((entry, column) => (
                          <Radar
                            key={entry.evaluation_id}
                            name={entry.candidate_name}
                            dataKey={seriesKey(column)}
                            stroke={CANDIDATE_COLORS[column % CANDIDATE_COLORS.length]}
                            fill={CANDIDATE_COLORS[column % CANDIDATE_COLORS.length]}
                            fillOpacity={0.2}
                          />
                        ))}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>
              <ChartCard
                title={t("barChart")}
                onExport={() => exportChart("bar")}
                exporting={exportingChart === "bar"}
                exportLabel={t("exportPng")}
                disabled={chartData.length === 0}
              >
                <div id="comparison-bar-chart" className="h-80 w-full bg-white" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="competency" tick={{ fontSize: 11, fill: "#4B5563" }} interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" width={44} />
                      <Tooltip formatter={(value) => (value === null || value === undefined ? "—" : `${Math.round(Number(value))}%`)} />
                      {result.candidates.map((entry, column) => (
                        <Bar
                          key={entry.evaluation_id}
                          name={entry.candidate_name}
                          dataKey={seriesKey(column)}
                          fill={CANDIDATE_COLORS[column % CANDIDATE_COLORS.length]}
                          radius={[3, 3, 0, 0]}
                        />
                      ))}
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* Limitations */}
            {result.limitations.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Info className="h-4 w-4" /> {t("limitations")}
                </h3>
                <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
                  {result.limitations.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>

      <EvaluationResultsModal
        evaluationId={reportFor?.evaluationId ?? null}
        candidateName={reportFor?.name ?? ""}
        onClose={() => setReportFor(null)}
      />
    </div>
  );
}

function StepHeading({ number, title, hint }: { number: number; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
        {number}
      </span>
      <div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {hint && <p className="text-sm text-gray-500">{hint}</p>}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  onExport,
  exporting,
  exportLabel,
  disabled,
}: {
  title: string;
  children: React.ReactNode;
  onExport: () => void;
  exporting: boolean;
  exportLabel: string;
  disabled: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <button
          type="button"
          onClick={onExport}
          disabled={disabled || exporting}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {exportLabel}
        </button>
      </div>
      {children}
    </div>
  );
}
