"use client";

import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
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
  type LucideIcon,
} from "lucide-react";
import b2bDashboardService from "@/app/api/dashboard/b2b/endpoints";
import { useWidgetData } from "./use-widget-data";
import { WidgetFrame } from "./widget-frame";
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

interface WidgetDefinition {
  // "half" widgets sit two to a row on large screens; "full" spans the row.
  span: "half" | "full";
  icon: LucideIcon;
  Component: ComponentType;
}

function useWidgetTitle(id: WidgetId) {
  const t = useTranslations("dashboard.business.overview.widgets");
  return t(`${id}.title`);
}

// Small helper: load data for a widget and render it once ready.
function makeDataWidget<T>(id: WidgetId, fetcher: () => Promise<T>, render: (data: T) => React.ReactNode) {
  function DataWidget() {
    const title = useWidgetTitle(id);
    const { data, loading, error, retry } = useWidgetData(fetcher);
    return (
      <WidgetFrame title={title} loading={loading} error={error} onRetry={retry}>
        {() => render(data as T)}
      </WidgetFrame>
    );
  }
  DataWidget.displayName = `Widget(${id})`;
  return DataWidget;
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

interface WidgetGridProps {
  widgets: readonly WidgetId[];
}

// A half-width widget with no half-width partner next to it (because the
// company's chosen order puts a full-width widget, or nothing, beside it)
// stretches across the row instead of leaving an empty hole.
function resolveSpans(widgets: readonly WidgetId[]) {
  const spans: ("half" | "full")[] = [];
  let column = 0;
  widgets.forEach((id, index) => {
    const next = widgets[index + 1];
    let span = WIDGETS[id].span;
    if (span === "half" && column === 0 && (!next || WIDGETS[next].span !== "half")) span = "full";
    spans.push(span);
    column = span === "full" ? 0 : (column + 1) % 2;
  });
  return spans;
}

export function WidgetGrid({ widgets }: WidgetGridProps) {
  const spans = resolveSpans(widgets);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {widgets.map((id, index) => {
        const { Component } = WIDGETS[id];
        return (
          <section
            key={id}
            data-widget={id}
            className={`min-w-0 [&>*]:h-full ${spans[index] === "full" ? "lg:col-span-2" : ""}`}
          >
            <Component />
          </section>
        );
      })}
    </div>
  );
}
