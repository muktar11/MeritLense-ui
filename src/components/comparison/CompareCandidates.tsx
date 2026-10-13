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
  ArrowRight,
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Download,
  FileSearch,
  FileText,
  GitCompare,
  Info,
  Lightbulb,
  Loader2,
  PlayCircle,
  Radar as RadarIcon,
  Search,
  Table2,
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
// list, the charts, the score bars and the PDF (CANDIDATE_COLORS in
// comparison_pdf_services.py uses the same palette).
const CANDIDATE_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444"];
const MAX_CANDIDATES = 4;
const DATE_RANGES = ["any", "30d", "3m", "6m", "12m", "custom"] as const;
type DateRange = (typeof DATE_RANGES)[number];
type TypeFilter = "ALL" | EvaluationTier;
type Tab = "overview" | "detailed" | "insights" | "reports";

const READINESS_BADGE: Record<string, string> = {
  READY: "bg-green-100 text-green-700",
  PARTIALLY_READY: "bg-amber-100 text-amber-700",
  NOT_READY: "bg-red-100 text-red-700",
};

function rangeStart(range: DateRange): string | undefined {
  const months = { "30d": 1, "3m": 3, "6m": 6, "12m": 12 } as Record<string, number>;
  if (!(range in months)) return undefined;
  const date = new Date();
  if (range === "30d") date.setDate(date.getDate() - 30);
  else date.setMonth(date.getMonth() - months[range]);
  return date.toISOString().slice(0, 10);
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

interface CandidateGroup {
  candidateId: string;
  candidateName: string;
  assessments: ComparisonAssessment[]; // newest first
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
  const tierLabel = (value: string) => (value === "SCREENING" ? t("tier.SCREENING") : t("tier.FULL"));
  const readinessLabel = (status: string) => (t.has(`readiness.${status}`) ? t(`readiness.${status}`) : status);

  // Filters
  const [roles, setRoles] = useState<ComparisonRole[]>([]);
  const [rolesState, setRolesState] = useState<"loading" | "ready" | "error">("loading");
  const [roleCode, setRoleCode] = useState("");
  const [range, setRange] = useState<DateRange>("any");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  // Candidates
  const [assessments, setAssessments] = useState<ComparisonAssessment[]>([]);
  const [listState, setListState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [search, setSearch] = useState("");
  // candidate id -> chosen evaluation id, in selection order
  const [selection, setSelection] = useState<{ candidateId: string; evaluationId: string }[]>([]);
  const [rowsById, setRowsById] = useState<Record<string, ComparisonAssessment>>({});

  // Results
  const [result, setResult] = useState<FullComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState<"incompatible" | "failed" | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [chartView, setChartView] = useState<"radar" | "bar">("radar");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingChart, setExportingChart] = useState(false);
  const [reportFor, setReportFor] = useState<{ evaluationId: string; name: string } | null>(null);
  const [howOpen, setHowOpen] = useState(false);
  const compareRequest = useRef(0);

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

  const dateFrom = range === "custom" ? customFrom || undefined : rangeStart(range);
  const dateTo = range === "custom" ? customTo || undefined : undefined;

  useEffect(() => {
    if (!roleCode) return;
    let active = true;
    queueMicrotask(() => active && setListState("loading"));
    api.getAssessments(roleCode, {
      evaluationTier: typeFilter === "ALL" ? undefined : typeFilter,
      dateFrom,
      dateTo,
    })
      .then((data) => {
        if (!active) return;
        setAssessments(data);
        setRowsById((rows) => ({ ...rows, ...Object.fromEntries(data.map((a) => [a.evaluation_id, a])) }));
        setListState("ready");
      })
      .catch((error) => {
        console.error("Failed to load comparable assessments:", error);
        if (active) setListState("error");
      });
    return () => {
      active = false;
    };
  }, [api, roleCode, typeFilter, dateFrom, dateTo]);

  const clearResult = () => {
    compareRequest.current++;
    setResult(null);
    setCompareError(null);
    setComparing(false);
  };

  const chooseRole = (code: string) => {
    setRoleCode(code);
    setSelection([]);
    setAssessments([]);
    clearResult();
  };

  const groups: CandidateGroup[] = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    const map = new Map<string, CandidateGroup>();
    assessments.forEach((a) => {
      if (query && !a.candidate_name.toLocaleLowerCase(locale).includes(query)) return;
      const group = map.get(a.candidate_id) ?? { candidateId: a.candidate_id, candidateName: a.candidate_name, assessments: [] };
      group.assessments.push(a);
      map.set(a.candidate_id, group);
    });
    return Array.from(map.values());
  }, [assessments, search, locale]);

  // Screening and Full Assessment are never compared together: once one is
  // picked, the other type is locked.
  const lockedTier = selection.length ? rowsById[selection[0].evaluationId]?.evaluation_tier : undefined;

  const chosenFor = (group: CandidateGroup) => {
    const picked = selection.find((s) => s.candidateId === group.candidateId);
    const compatible = group.assessments.filter((a) => !lockedTier || a.evaluation_tier === lockedTier);
    return {
      picked,
      shown: (picked && rowsById[picked.evaluationId]) || compatible[0] || group.assessments[0],
      compatible,
    };
  };

  const toggleCandidate = (group: CandidateGroup) => {
    clearResult();
    const { picked, compatible } = chosenFor(group);
    if (picked) {
      setSelection(selection.filter((s) => s.candidateId !== group.candidateId));
    } else if (selection.length < MAX_CANDIDATES && compatible.length) {
      setSelection([...selection, { candidateId: group.candidateId, evaluationId: compatible[0].evaluation_id }]);
    }
  };

  const chooseAttempt = (group: CandidateGroup, evaluationId: string) => {
    clearResult();
    if (selection.some((s) => s.candidateId === group.candidateId)) {
      setSelection(selection.map((s) => (s.candidateId === group.candidateId ? { ...s, evaluationId } : s)));
    } else if (selection.length < MAX_CANDIDATES) {
      setSelection([...selection, { candidateId: group.candidateId, evaluationId }]);
    }
  };

  const colorOf = (candidateId: string) => {
    const index = selection.findIndex((s) => s.candidateId === candidateId);
    return index === -1 ? undefined : CANDIDATE_COLORS[index % CANDIDATE_COLORS.length];
  };

  const compare = async () => {
    if (!roleCode || selection.length < 2) return;
    const request = ++compareRequest.current;
    setResult(null);
    setCompareError(null);
    setComparing(true);
    try {
      const data = await api.compare(roleCode, selection.map((s) => s.evaluationId), locale);
      if (request !== compareRequest.current) return;
      setResult(data);
      setTab("overview");
    } catch (error: unknown) {
      if (request !== compareRequest.current) return;
      const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
      setCompareError(code === "INCOMPATIBLE_SELECTION" ? "incompatible" : "failed");
    } finally {
      if (request === compareRequest.current) setComparing(false);
    }
  };

  // Charts and table use exactly the comparison's competency rows.
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
        row.values.forEach((value, column) => (point[seriesKey(column)] = value));
        return point;
      }),
    [competencyRows],
  );
  const color = (column: number) => CANDIDATE_COLORS[column % CANDIDATE_COLORS.length];
  const legend = (result?.candidates ?? []).map((entry, column) => ({ name: entry.candidate_name, color: color(column) }));

  const exportChart = async () => {
    const container = document.getElementById("comparison-chart");
    if (!container) return;
    setExportingChart(true);
    try {
      await exportChartAsPng(container, `candidate-comparison-${chartView}.png`, legend);
    } catch (error) {
      console.error("Failed to export chart:", error);
    } finally {
      setExportingChart(false);
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

  const selectedRole = roles.find((r) => r.role_code === roleCode);
  const activeStep = !roleCode ? 1 : !result ? 2 : tab === "reports" ? 4 : 3;
  const steps = [
    { title: t("steps.role"), hint: t("steps.roleHint") },
    { title: t("steps.candidates"), hint: t("steps.candidatesHint") },
    { title: t("steps.view"), hint: t("steps.viewHint") },
    { title: t("steps.export"), hint: t("steps.exportHint") },
  ];
  const selectClass =
    "h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white ps-11 pe-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500";

  return (
    <div className="min-h-screen bg-[#f6f7fc]" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[1400px] space-y-4 p-4 sm:p-6">
        {/* Header + steps */}
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t("title")}</h1>
              <p className="mt-1 text-sm text-gray-600 sm:text-base">{t("subtitleShort")}</p>
            </div>
            <button
              type="button"
              onClick={() => setHowOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
            >
              <PlayCircle className="h-4 w-4" /> {t("howItWorks")}
            </button>
          </div>
          <ol className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 lg:grid-cols-4">
            {steps.map((step, index) => {
              const number = index + 1;
              const done = number < activeStep;
              const active = number === activeStep;
              return (
                <li key={step.title} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                      active ? "border-purple-600 bg-purple-600 text-white" : done ? "border-purple-600 bg-purple-50 text-purple-700" : "border-gray-300 text-gray-500",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5" /> : number}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{step.title}</span>
                    <span className="block truncate text-xs text-gray-500">{step.hint}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Filters */}
        <section className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1.3fr]">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-800">{t("filters.role")} *</span>
            <span className="relative block">
              <Briefcase className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-600" />
              <select
                value={roleCode}
                onChange={(e) => chooseRole(e.target.value)}
                disabled={rolesState !== "ready" || roles.length === 0}
                className={cn(selectClass, roleCode && "border-purple-400 ring-1 ring-purple-200")}
              >
                <option value="">{rolesState === "loading" ? t("loading") : roles.length ? t("filters.chooseRole") : t("step1.noRoles")}</option>
                {roles.map((role) => (
                  <option key={role.role_code} value={role.role_code}>
                    {roleLabel(role)} ({role.candidate_count})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </span>
          </label>

          <div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-800">
                {t("filters.dateRange")} <span className="font-normal text-gray-500">({t("filters.optional")})</span>
              </span>
              <span className="relative block">
                <CalendarDays className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <select value={range} onChange={(e) => setRange(e.target.value as DateRange)} className={selectClass}>
                  {DATE_RANGES.map((value) => (
                    <option key={value} value={value}>{t(`filters.ranges.${value}`)}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </span>
            </label>
            {range === "custom" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  aria-label={t("step2.from")}
                  value={customFrom}
                  max={customTo || undefined}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-10 rounded-lg border border-gray-200 px-2 text-sm"
                />
                <input
                  type="date"
                  aria-label={t("step2.to")}
                  value={customTo}
                  min={customFrom || undefined}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-10 rounded-lg border border-gray-200 px-2 text-sm"
                />
              </div>
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-800">
              {t("filters.type")} <span className="font-normal text-gray-500">({t("filters.optional")})</span>
            </span>
            <span className="relative block">
              <FileText className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as TypeFilter);
                  setSelection([]);
                  clearResult();
                }}
                className={selectClass}
              >
                <option value="ALL">{t("filters.allTypes")}</option>
                <option value="FULL">{t("tier.FULL")}</option>
                <option value="SCREENING">{t("tier.SCREENING")}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </span>
          </label>

          <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/70 p-3 text-sm text-purple-800 md:col-span-2 xl:col-span-1">
            <Info className="mt-0.5 h-5 w-5 shrink-0" />
            <span>
              {selectedRole ? t("filters.roleNote", { role: roleLabel(selectedRole) }) : t("step1.hint")}
              <span className="mt-1 block text-xs text-purple-700/80">{t("step1.typeHint")}</span>
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
          {/* Candidate list */}
          <section className="flex flex-col rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">{t("list.title")}</h2>
            <label className="relative mb-3 block">
              <span className="sr-only">{t("step2.search")}</span>
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("step2.search")}
                disabled={!roleCode}
                className="h-11 w-full rounded-xl border border-gray-200 ps-9 pe-3 text-sm outline-none focus:border-purple-400 disabled:bg-gray-50"
              />
            </label>

            <div className="min-h-[12rem] flex-1">
              {!roleCode ? (
                <EmptyState icon={Briefcase} text={t("list.chooseRoleFirst")} />
              ) : listState === "loading" ? (
                <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
              ) : listState === "error" ? (
                <p className="py-6 text-sm text-red-600">{t("loadFailed")}</p>
              ) : groups.length === 0 ? (
                <EmptyState icon={Search} text={t("step2.empty")} />
              ) : (
                <ul className="max-h-[32rem] space-y-2 overflow-y-auto pe-1">
                  {groups.map((group) => {
                    const { picked, shown, compatible } = chosenFor(group);
                    const blocked = !picked && (selection.length >= MAX_CANDIDATES || compatible.length === 0);
                    const swatch = colorOf(group.candidateId);
                    return (
                      <li
                        key={group.candidateId}
                        className={cn(
                          "rounded-xl border p-3 transition",
                          picked ? "border-purple-300 bg-purple-50/50" : "border-gray-200",
                          blocked && "opacity-50",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={Boolean(picked)}
                            disabled={blocked}
                            onChange={() => toggleCandidate(group)}
                            aria-label={group.candidateName}
                            className="h-5 w-5 shrink-0 accent-purple-600"
                          />
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                            style={swatch ? { backgroundColor: swatch, color: "white" } : { backgroundColor: "#EEF0FB", color: "#4B4F8C" }}
                          >
                            {initials(group.candidateName)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">{group.candidateName}</p>
                            {group.assessments.length > 1 ? (
                              <select
                                value={shown.evaluation_id}
                                onChange={(e) => chooseAttempt(group, e.target.value)}
                                aria-label={t("list.attempt", { name: group.candidateName })}
                                className="mt-0.5 max-w-full rounded border-none bg-transparent p-0 text-xs text-gray-500 focus:ring-1 focus:ring-purple-300"
                              >
                                {group.assessments.map((a) => (
                                  <option
                                    key={a.evaluation_id}
                                    value={a.evaluation_id}
                                    disabled={Boolean(lockedTier && a.evaluation_tier !== lockedTier && !picked)}
                                  >
                                    {formatDate(a.assessment_date)} · {tierLabel(a.evaluation_tier)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs text-gray-500">
                                {formatDate(shown.assessment_date)}
                                {typeFilter === "ALL" && ` · ${tierLabel(shown.evaluation_tier)}`}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {shown.review_status === "HUMAN_REVIEW" ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">{t("status.HUMAN_REVIEW")}</span>
                            ) : (
                              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", READINESS_BADGE[shown.readiness_status] ?? "bg-gray-100 text-gray-600")}>
                                {readinessLabel(shown.readiness_status)}
                              </span>
                            )}
                            <span className="text-sm font-bold text-gray-900" dir="ltr">
                              {shown.overall_score !== null ? `${Math.round(shown.overall_score)}%` : "—"}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-3 flex items-start gap-3 rounded-xl bg-purple-50/70 p-3 text-sm text-purple-800">
              <Info className="mt-0.5 h-5 w-5 shrink-0" />
              {t("step2.needTwo")}
            </div>
            <p className="mt-3 text-sm font-medium text-gray-700" aria-live="polite">
              {t("step2.selected", { count: selection.length, max: MAX_CANDIDATES })}
            </p>
            <button
              type="button"
              onClick={compare}
              disabled={selection.length < 2 || comparing}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {comparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
              {comparing ? t("comparing") : t("title")}
              {!comparing && <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
            </button>
            {compareError && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {compareError === "incompatible" ? t("incompatible") : t("compareFailed")}
              </p>
            )}
          </section>

          {/* Results */}
          <section className="min-w-0 rounded-2xl bg-white shadow-sm">
            <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-3" role="tablist">
              {(
                [
                  ["overview", BarChart3, t("tabs.overview")],
                  ["detailed", Table2, t("tabs.detailed")],
                  ["insights", Lightbulb, t("tabs.insights")],
                  ["reports", FileText, t("tabs.reports")],
                ] as const
              ).map(([key, Icon, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  disabled={!result}
                  onClick={() => setTab(key)}
                  className={cn(
                    "-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3.5 text-sm font-medium disabled:opacity-40",
                    tab === key ? "border-purple-600 text-purple-700" : "border-transparent text-gray-600 hover:text-gray-900",
                  )}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-5">
              {!result ? (
                <EmptyState icon={GitCompare} text={comparing ? t("comparing") : t("results.empty")} tall />
              ) : tab === "overview" ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{t("results.overall")}</h3>
                          <p className="text-sm text-gray-500">
                            {t("results.overallHint", { role: selectedRole ? roleLabel(selectedRole) : result.role_name })} · {tierLabel(result.evaluation_tier)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">{t("results.viewAs")}</span>
                          {(["radar", "bar"] as const).map((view) => (
                            <button
                              key={view}
                              type="button"
                              onClick={() => setChartView(view)}
                              aria-pressed={chartView === view}
                              disabled={view === "radar" && chartData.length < 3}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-medium disabled:opacity-40",
                                chartView === view ? "border-purple-400 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-700",
                              )}
                            >
                              {view === "radar" ? <RadarIcon className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                              {view === "radar" ? t("radarChart") : t("barChart")}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div id="comparison-chart" className="h-80 w-full bg-white sm:h-96" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartView === "radar" && chartData.length >= 3 ? (
                            <RadarChart data={chartData} outerRadius="68%" margin={{ top: 16, right: 64, left: 64, bottom: 8 }}>
                              <PolarGrid stroke="#E5E7EB" />
                              <PolarAngleAxis dataKey="competency" tick={{ fontSize: 11, fill: "#4B5563" }} />
                              <PolarRadiusAxis domain={[0, 100]} stroke="#D1D5DB" tick={{ fontSize: 10 }} />
                              {result.candidates.map((entry, column) => (
                                <Radar key={entry.evaluation_id} name={entry.candidate_name} dataKey={seriesKey(column)}
                                  stroke={color(column)} fill={color(column)} fillOpacity={0.18} />
                              ))}
                              <Legend />
                            </RadarChart>
                          ) : (
                            <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 8 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                              <XAxis dataKey="competency" tick={{ fontSize: 11, fill: "#4B5563" }} interval={0} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" width={44} />
                              <Tooltip formatter={(value) => (value === null || value === undefined ? "—" : `${Math.round(Number(value))}%`)} />
                              {result.candidates.map((entry, column) => (
                                <Bar key={entry.evaluation_id} name={entry.candidate_name} dataKey={seriesKey(column)}
                                  fill={color(column)} radius={[3, 3, 0, 0]} />
                              ))}
                              <Legend />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-gray-200 p-4">
                        <h4 className="mb-3 font-semibold text-gray-900">{t("overallScore")}</h4>
                        <ul className="space-y-3">
                          {result.candidates.map((entry, column) => (
                            <li key={entry.evaluation_id} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-sm">
                              <span className="truncate text-gray-800">{entry.candidate_name}</span>
                              <span className="h-2.5 overflow-hidden rounded-full bg-gray-100" dir="ltr">
                                <span className="block h-full rounded-full" style={{ width: `${entry.overall_score ?? 0}%`, backgroundColor: color(column) }} />
                              </span>
                              <span className="w-10 text-end font-semibold text-gray-900" dir="ltr">
                                {entry.overall_score !== null ? `${Math.round(entry.overall_score)}%` : "—"}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {result.candidates.some((e) => e.score_withheld) && (
                          <p className="mt-3 text-xs text-gray-500">{t("scoreWithheld")}</p>
                        )}
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4">
                        <h4 className="mb-3 font-semibold text-gray-900">{t("readinessLevel")}</h4>
                        <ul className="space-y-2.5">
                          {result.candidates.map((entry) => (
                            <li key={entry.evaluation_id} className="flex items-center justify-between gap-2 text-sm">
                              <span className="truncate text-gray-800">{entry.candidate_name}</span>
                              {entry.requires_human_review ? (
                                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">{t("humanReviewRequired")}</span>
                              ) : (
                                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", READINESS_BADGE[entry.readiness_status] ?? "bg-gray-100 text-gray-600")}>
                                  {entry.readiness_display}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">{t("competencyComparison")}</h3>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full min-w-[40rem] text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-3 py-2.5 text-start font-medium">{t("competency")}</th>
                            {result.candidates.map((entry, column) => (
                              <th key={entry.evaluation_id} className="px-3 py-2.5 text-start font-medium">
                                <span className="inline-flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: color(column) }}>
                                    {initials(entry.candidate_name)}
                                  </span>
                                  <span className="truncate">{entry.candidate_name}</span>
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {competencyRows.map((row) => (
                            <tr key={row.label} className="border-t border-gray-100">
                              <td className="px-3 py-2 text-gray-800">
                                {row.label}
                                {row.classification === "CRITICAL" && (
                                  <span className="ms-2 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">{t("classificationLabel.CRITICAL")}</span>
                                )}
                              </td>
                              {row.values.map((value, column) => (
                                <td key={column} className="px-3 py-2">
                                  <span className="flex items-center gap-2" dir="ltr">
                                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                                      <span className="block h-full rounded-full" style={{ width: `${value ?? 0}%`, backgroundColor: color(column) }} />
                                    </span>
                                    <span className="w-9 text-end text-xs font-medium text-gray-700">{value !== null ? `${Math.round(value)}%` : "—"}</span>
                                  </span>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : tab === "detailed" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                  {result.candidates.map((entry, column) => (
                    <article key={entry.evaluation_id} className="rounded-xl border border-gray-200 p-4" style={{ borderTop: `4px solid ${color(column)}` }}>
                      <h3 className="truncate font-semibold text-gray-900">{entry.candidate_name}</h3>
                      <p className="mb-3 text-xs text-gray-500">{tierLabel(entry.evaluation_tier)} · {formatDate(entry.assessment_date)}</p>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-xs text-gray-500">{t("overallScore")}</dt>
                          <dd className="text-2xl font-bold text-gray-900" dir="ltr">
                            {entry.overall_score !== null ? `${Math.round(entry.overall_score)}%` : (
                              <span className="block py-1 text-xs font-medium leading-snug text-gray-500" dir="auto">{entry.score_withheld ? t("scoreWithheld") : "—"}</span>
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
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> {t("criticalAllMet")}</span>
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
              ) : tab === "insights" ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">{t("keyDifferences")}</h3>
                    {result.key_differences.length ? (
                      <ul className="space-y-2">
                        {result.key_differences.map((diff, index) => (
                          <li key={index} className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> {diff.text}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">{t("results.noDifferences")}</p>
                    )}
                  </div>
                  <Limitations title={t("limitations")} items={result.limitations} />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={exportPdf}
                      disabled={exportingPdf}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-start hover:border-purple-300 disabled:opacity-60"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                        {exportingPdf ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                      </span>
                      <span>
                        <span className="block font-semibold text-gray-900">{exportingPdf ? t("exportingPdf") : t("exportPdf")}</span>
                        <span className="block text-xs text-gray-500">{t("reports.pdfHint")}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTab("overview");
                        window.setTimeout(exportChart, 300);
                      }}
                      disabled={exportingChart}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-start hover:border-purple-300 disabled:opacity-60"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                        {exportingChart ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                      </span>
                      <span>
                        <span className="block font-semibold text-gray-900">{t("reports.pngTitle")}</span>
                        <span className="block text-xs text-gray-500">{t("reports.pngHint")}</span>
                      </span>
                    </button>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">{t("reports.fullReports")}</h3>
                    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                      {result.candidates.map((entry, column) => (
                        <li key={entry.evaluation_id} className="flex items-center justify-between gap-3 p-3 text-sm">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color(column) }} />
                            <span className="truncate text-gray-800">{entry.candidate_name}</span>
                            <span className="shrink-0 text-xs text-gray-500">{formatDate(entry.assessment_date)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setReportFor({ evaluationId: entry.evaluation_id, name: entry.candidate_name })}
                            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800"
                          >
                            <FileSearch className="h-3.5 w-3.5" /> {t("viewFullReport")}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Limitations title={t("limitations")} items={result.limitations} />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {howOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={() => setHowOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-it-works-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 id="how-it-works-title" className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <CircleHelp className="h-5 w-5 text-purple-600" /> {t("howItWorks")}
              </h2>
              <button type="button" onClick={() => setHowOpen(false)} aria-label={t("close")} className="p-1 text-gray-500 hover:text-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="list-decimal space-y-2 ps-5 text-sm text-gray-700">
              {[0, 1, 2, 3, 4].map((i) => <li key={i}>{t(`how.${i}`)}</li>)}
            </ol>
          </div>
        </div>
      )}

      <EvaluationResultsModal
        evaluationId={reportFor?.evaluationId ?? null}
        candidateName={reportFor?.name ?? ""}
        onClose={() => setReportFor(null)}
      />
    </div>
  );
}

function EmptyState({ icon: Icon, text, tall }: { icon: React.ComponentType<{ className?: string }>; text: string; tall?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-4 text-center", tall ? "min-h-[24rem]" : "min-h-[12rem]")}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Icon className="h-6 w-6" />
      </span>
      <p className="max-w-sm text-sm text-gray-500">{text}</p>
    </div>
  );
}

function Limitations({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <Info className="h-4 w-4" /> {title}
      </h3>
      <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
}
