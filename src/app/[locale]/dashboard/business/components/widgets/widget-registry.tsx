"use client";

import { format } from "date-fns";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  CalendarRange,
  Clock,
  GaugeCircle,
  Languages,
  LineChart,
  ListChecks,
  PieChart,
  TrendingUp,
  Users,
} from "lucide-react";
import b2bDashboardService from "@/app/api/dashboard/b2b/endpoints";
import { DashboardWidgetGrid, makeDataWidget as makeWidget, type WidgetCatalog, type WidgetDefinition } from "./widget-grid";
import { RequiresAttentionPanel } from "../requires-attention";
import { ReadinessIndexChart } from "../readiness-index-chart";
import { CandidateEvaluationTable } from "../candidate-evaluation-table";
import { StatusDistributionChart } from "../status-distribution-chart";
import { EvaluationTrendChart } from "../evaluation-trend-chart";
import { PerformanceChart } from "../performance-chart";
import { ScoreDistributionChart } from "../score-distribution-chart";
import { JobRoleDistributionChart } from "../job-role-distribution-chart";
import { LanguageDistributionChart } from "../language-distribution-chart";
import { TimeRangeChart } from "../time-range-chart";
import { RecentActivityTable } from "../recent-activity-table";
import { CandidateComparison } from "../candidate-comparison";

// Mirrors api/dashboard/dashboard_layout.py. The backend's layout response
// is authoritative; this is the fallback when the layout can't be loaded,
// so the dashboard stays fully usable without any customization.
export const DEFAULT_WIDGETS = [
  "requires_attention",
  "readiness_index",
  "recent_evaluations",
  "evaluation_status",
  "evaluation_trend",
] as const;

export const OPTIONAL_WIDGETS = [
  "performance_trend",
  "score_by_role",
  "job_role_distribution",
  "language_distribution",
  "time_of_day",
  "monthly_activity",
  "candidate_comparison",
] as const;

export type WidgetId = (typeof DEFAULT_WIDGETS)[number] | (typeof OPTIONAL_WIDGETS)[number];

export const ALL_WIDGETS: readonly WidgetId[] = [...DEFAULT_WIDGETS, ...OPTIONAL_WIDGETS];

export function isWidgetId(value: string): value is WidgetId {
  return (ALL_WIDGETS as readonly string[]).includes(value);
}

const TITLES = "dashboard.business.overview.widgets";

function makeDataWidget<T>(id: WidgetId, fetcher: () => Promise<T>, render: (data: T) => React.ReactNode) {
  return makeWidget(TITLES, id, fetcher, render);
}

export const WIDGETS: Record<WidgetId, WidgetDefinition> = {
  requires_attention: {
    span: "half",
    icon: AlertTriangle,
    Component: makeDataWidget(
      "requires_attention",
      () => b2bDashboardService.getRequiresAttention(5),
      (data) => <RequiresAttentionPanel data={data} />,
    ),
  },
  readiness_index: {
    span: "half",
    icon: GaugeCircle,
    Component: makeDataWidget(
      "readiness_index",
      () => b2bDashboardService.getReadinessDistribution(),
      (data) => <ReadinessIndexChart data={data} />,
    ),
  },
  recent_evaluations: {
    span: "full",
    icon: ListChecks,
    Component: makeDataWidget(
      "recent_evaluations",
      () => b2bDashboardService.getRecentEvaluations(10),
      (data) => <CandidateEvaluationTable evaluations={data} />,
    ),
  },
  evaluation_status: {
    span: "half",
    icon: PieChart,
    Component: makeDataWidget(
      "evaluation_status",
      () => b2bDashboardService.getStatusDistribution(),
      (data) => <StatusDistributionChart data={data} />,
    ),
  },
  evaluation_trend: {
    span: "half",
    icon: TrendingUp,
    Component: makeDataWidget(
      "evaluation_trend",
      () => b2bDashboardService.getEvaluationTrend(30),
      (data) => <EvaluationTrendChart data={data} />,
    ),
  },
  performance_trend: {
    span: "half",
    icon: LineChart,
    Component: makeDataWidget(
      "performance_trend",
      () => b2bDashboardService.getPerformanceMetrics(6),
      (data) => (
        <PerformanceChart
          data={data.map((metric) => ({
            month: format(new Date(metric.period + "-01"), "MMM"),
            value: metric.average_score,
          }))}
        />
      ),
    ),
  },
  score_by_role: {
    span: "half",
    icon: BarChart3,
    Component: makeDataWidget(
      "score_by_role",
      () => b2bDashboardService.getScoreDistribution(),
      (data) => (
        <ScoreDistributionChart
          data={data.map((item) => ({
            role: item.job_role,
            roleLabel: item.job_role_display,
            score: item.average_score,
          }))}
        />
      ),
    ),
  },
  job_role_distribution: {
    span: "half",
    icon: Briefcase,
    Component: makeDataWidget(
      "job_role_distribution",
      () => b2bDashboardService.getJobRoleDistribution(),
      (data) => <JobRoleDistributionChart data={data} />,
    ),
  },
  language_distribution: {
    span: "half",
    icon: Languages,
    Component: makeDataWidget(
      "language_distribution",
      () => b2bDashboardService.getLanguageDistribution(),
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
      "time_of_day",
      () => b2bDashboardService.getEvaluationTimeRange(),
      (data) => <TimeRangeChart data={data} />,
    ),
  },
  monthly_activity: {
    span: "full",
    icon: CalendarRange,
    Component: makeDataWidget(
      "monthly_activity",
      () => b2bDashboardService.getMonthlyActivity(6),
      (data) => <RecentActivityTable activities={data} />,
    ),
  },
  candidate_comparison: {
    span: "full",
    icon: Users,
    // Self-contained multi-step flow that loads its own data.
    Component: CandidateComparison,
  },
};

export const B2B_WIDGET_CATALOG: WidgetCatalog<WidgetId> = {
  all: ALL_WIDGETS,
  defaults: DEFAULT_WIDGETS,
  widgets: WIDGETS,
  titlesNamespace: TITLES,
};

export function WidgetGrid({ widgets }: { widgets: readonly WidgetId[] }) {
  return <DashboardWidgetGrid widgets={widgets} registry={WIDGETS} />;
}
