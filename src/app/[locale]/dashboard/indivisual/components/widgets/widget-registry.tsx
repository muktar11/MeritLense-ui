"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Briefcase,
  CalendarRange,
  Clock,
  GaugeCircle,
  Languages,
  LineChart,
  ListChecks,
  PieChart,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import b2cDashboardService from "@/app/api/dashboard/b2c/endpoints";
import type { RecentEvaluation } from "@/app/api/dashboard/b2c/types";
import {
  DashboardWidgetGrid,
  makeDataWidget,
  type WidgetCatalog,
  type WidgetDefinition,
} from "../../../business/components/widgets/widget-grid";
import { WidgetFrame } from "../../../business/components/widgets/widget-frame";
import { useWidgetData } from "../../../business/components/widgets/use-widget-data";
import { RequiresAttentionPanel } from "../../../business/components/requires-attention";
import { ReadinessIndexChart } from "../../../business/components/readiness-index-chart";
import { CandidateList } from "../candidate-list";
import { EvaluationManagement } from "../evaluation-management";
import { StatusDistributionChart } from "../status-distribution-chart";
import { EvaluationTrendChart } from "../evaluation-trend-chart";
import { ScoreTrendChart } from "../score-trend-chart";
import { PointConsumptionChart } from "../point-consumption-chart";
import { LanguageDistributionChart } from "../language-distribution-chart";
import { TimeRangeChart } from "../time-range-chart";
import { RecentActivityTable } from "../recent-activity-table";
import { CandidateComparison } from "../candidate-comparison";

// Mirrors B2C_DEFAULT_WIDGETS / B2C_OPTIONAL_WIDGETS in
// api/dashboard/dashboard_layout.py. The backend's layout response is
// authoritative; this is the fallback when it can't be loaded.
export const B2C_DEFAULT_WIDGETS = [
  "requires_attention",
  "readiness_index",
  "recent_candidates",
  "recent_evaluations",
  "evaluation_status",
] as const;

export const B2C_OPTIONAL_WIDGETS = [
  "evaluation_trend",
  "performance_trend",
  "job_role_distribution",
  "language_distribution",
  "time_of_day",
  "monthly_activity",
  "candidate_comparison",
] as const;

export type B2CWidgetId = (typeof B2C_DEFAULT_WIDGETS)[number] | (typeof B2C_OPTIONAL_WIDGETS)[number];

export const B2C_ALL_WIDGETS: readonly B2CWidgetId[] = [...B2C_DEFAULT_WIDGETS, ...B2C_OPTIONAL_WIDGETS];

export function isB2CWidgetId(value: string): value is B2CWidgetId {
  return (B2C_ALL_WIDGETS as readonly string[]).includes(value);
}

const TITLES = "dashboard.indivisual.dashboard.widgets";

// The header search box filters the candidate list widget.
export const CandidateSearchContext = createContext("");

function RecentCandidatesWidget() {
  const t = useTranslations(TITLES);
  const searchTerm = useContext(CandidateSearchContext);
  const { data, loading, error, retry } = useWidgetData(() => b2cDashboardService.getRecentCandidates(10));
  return (
    <WidgetFrame title={t("recent_candidates.title")} loading={loading} error={error} onRetry={retry}>
      {() => <CandidateList candidates={data ?? []} searchTerm={searchTerm} />}
    </WidgetFrame>
  );
}

type EvaluationTab = "scheduled" | "inProgress" | "completed";

// Keeps its own tab and reloads that tab's evaluations when it changes.
function RecentEvaluationsWidget() {
  const t = useTranslations(TITLES);
  const [tab, setTab] = useState<EvaluationTab>("inProgress");
  const [evaluations, setEvaluations] = useState<RecentEvaluation[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const status = tab === "scheduled" ? "scheduled" : tab === "completed" ? "completed" : undefined;
    b2cDashboardService.getRecentEvaluations(10, status)
      .then((result) => {
        if (!cancelled) {
          setEvaluations(result);
          setError(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load dashboard widget:", err);
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, attempt]);

  const retry = useCallback(() => {
    setError(false);
    setAttempt((value) => value + 1);
  }, []);

  return (
    <WidgetFrame
      title={t("recent_evaluations.title")}
      loading={evaluations === null && !error}
      error={evaluations === null && error}
      onRetry={retry}
    >
      {() => <EvaluationManagement evaluations={evaluations ?? []} activeTab={tab} onTabChange={setTab} />}
    </WidgetFrame>
  );
}

export const B2C_WIDGETS: Record<B2CWidgetId, WidgetDefinition> = {
  requires_attention: {
    span: "half",
    icon: AlertTriangle,
    Component: makeDataWidget(
      TITLES,
      "requires_attention",
      () => b2cDashboardService.getRequiresAttention(5),
      (data) => <RequiresAttentionPanel data={data} dashboard="indivisual" />,
    ),
  },
  readiness_index: {
    span: "half",
    icon: GaugeCircle,
    Component: makeDataWidget(
      TITLES,
      "readiness_index",
      () => b2cDashboardService.getReadinessDistribution(),
      (data) => <ReadinessIndexChart data={data} />,
    ),
  },
  recent_candidates: {
    span: "full",
    icon: UserRound,
    Component: RecentCandidatesWidget,
  },
  recent_evaluations: {
    span: "half",
    icon: ListChecks,
    Component: RecentEvaluationsWidget,
  },
  evaluation_status: {
    span: "half",
    icon: PieChart,
    Component: makeDataWidget(
      TITLES,
      "evaluation_status",
      () => b2cDashboardService.getStatusDistribution(),
      (data) => <StatusDistributionChart data={data} />,
    ),
  },
  evaluation_trend: {
    span: "full",
    icon: TrendingUp,
    Component: makeDataWidget(
      TITLES,
      "evaluation_trend",
      () => b2cDashboardService.getEvaluationTrend(30),
      (data) => <EvaluationTrendChart data={data} />,
    ),
  },
  performance_trend: {
    span: "full",
    icon: LineChart,
    Component: makeDataWidget(
      TITLES,
      "performance_trend",
      () => b2cDashboardService.getScoreTrend(30),
      (data) => <ScoreTrendChart data={data} />,
    ),
  },
  job_role_distribution: {
    span: "half",
    icon: Briefcase,
    Component: makeDataWidget(
      TITLES,
      "job_role_distribution",
      () => b2cDashboardService.getJobRoleDistribution(),
      (data) => <PointConsumptionChart data={data} />,
    ),
  },
  language_distribution: {
    span: "half",
    icon: Languages,
    Component: makeDataWidget(
      TITLES,
      "language_distribution",
      () => b2cDashboardService.getLanguageDistribution(),
      (data) => (
        <LanguageDistributionChart
          data={data.map((item) => ({
            key: item.language.toLowerCase(),
            language: item.language_display,
            value: item.percentage,
          }))}
        />
      ),
    ),
  },
  time_of_day: {
    span: "half",
    icon: Clock,
    Component: makeDataWidget(
      TITLES,
      "time_of_day",
      () => b2cDashboardService.getEvaluationTimeRange(),
      (data) => <TimeRangeChart data={data} />,
    ),
  },
  monthly_activity: {
    span: "full",
    icon: CalendarRange,
    Component: makeDataWidget(
      TITLES,
      "monthly_activity",
      () => b2cDashboardService.getMonthlyActivity(6),
      (data) => <RecentActivityTable activities={data} />,
    ),
  },
  candidate_comparison: {
    span: "full",
    icon: Users,
    // Loads its own data.
    Component: CandidateComparison,
  },
};

export const B2C_WIDGET_CATALOG: WidgetCatalog<B2CWidgetId> = {
  all: B2C_ALL_WIDGETS,
  defaults: B2C_DEFAULT_WIDGETS,
  widgets: B2C_WIDGETS,
  titlesNamespace: TITLES,
};

export function B2CWidgetGrid({ widgets }: { widgets: readonly B2CWidgetId[] }) {
  return <DashboardWidgetGrid widgets={widgets} registry={B2C_WIDGETS} />;
}
