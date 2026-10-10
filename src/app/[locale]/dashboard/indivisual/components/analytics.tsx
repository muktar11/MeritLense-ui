"use client";

import type { ComponentType, ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import b2cDashboardService from "@/app/api/dashboard/b2c/endpoints";
import { useWidgetData } from "../../business/components/widgets/use-widget-data";
import { WidgetFrame } from "../../business/components/widgets/widget-frame";
import { ReadinessIndexChart } from "../../business/components/readiness-index-chart";
import { StatusDistributionChart } from "./status-distribution-chart";
import { EvaluationTrendChart } from "./evaluation-trend-chart";
import { ScoreTrendChart } from "./score-trend-chart";
import { PointConsumptionChart } from "./point-consumption-chart";
import { TimeRangeChart } from "./time-range-chart";
import { LanguageDistributionChart } from "./language-distribution-chart";
import { RecentActivityTable } from "./recent-activity-table";
import { CandidateComparison } from "./candidate-comparison";

// B2C counterpart of the B2B Analytics & Insights page: every statistical
// view of the user's own candidates in one place. Each chart loads its own
// data (same widget helpers as B2B), so one failing endpoint doesn't blank
// the page.

// Loading/error placeholder titles - the same chart names the B2B widgets use.
type TitleKey =
  | "readiness_index" | "evaluation_status" | "evaluation_trend" | "performance_trend"
  | "job_role_distribution" | "time_of_day" | "language_distribution" | "monthly_activity";

function makeWidget<T>(titleKey: TitleKey, fetcher: () => Promise<T>, render: (data: T) => ReactNode) {
  function Widget() {
    const t = useTranslations("dashboard.business.overview.widgets");
    const { data, loading, error, retry } = useWidgetData(fetcher);
    return (
      <WidgetFrame title={t(`${titleKey}.title`)} loading={loading} error={error} onRetry={retry}>
        {() => render(data as T)}
      </WidgetFrame>
    );
  }
  Widget.displayName = `B2CAnalytics(${titleKey})`;
  return Widget;
}

const WIDGETS: { id: string; full?: boolean; Component: ComponentType }[] = [
  {
    id: "readiness_index",
    Component: makeWidget("readiness_index", () => b2cDashboardService.getReadinessDistribution(),
      (data) => <ReadinessIndexChart data={data} />),
  },
  {
    id: "evaluation_status",
    Component: makeWidget("evaluation_status", () => b2cDashboardService.getStatusDistribution(),
      (data) => <StatusDistributionChart data={data} />),
  },
  {
    id: "evaluation_trend",
    Component: makeWidget("evaluation_trend", () => b2cDashboardService.getEvaluationTrend(30),
      (data) => <EvaluationTrendChart data={data} />),
  },
  {
    id: "score_trend",
    Component: makeWidget("performance_trend", () => b2cDashboardService.getScoreTrend(30),
      (data) => <ScoreTrendChart data={data} />),
  },
  {
    id: "job_role_distribution",
    Component: makeWidget("job_role_distribution", () => b2cDashboardService.getJobRoleDistribution(),
      (data) => <PointConsumptionChart data={data} />),
  },
  {
    id: "time_of_day",
    Component: makeWidget("time_of_day", () => b2cDashboardService.getEvaluationTimeRange(),
      (data) => <TimeRangeChart data={data} />),
  },
  {
    id: "language_distribution",
    full: true,
    Component: makeWidget("language_distribution", () => b2cDashboardService.getLanguageDistribution(),
      (data) => (
        <LanguageDistributionChart
          data={data.map((item) => ({ key: item.language.toLowerCase(), language: item.language_display, value: item.percentage }))}
        />
      )),
  },
  {
    id: "monthly_activity",
    full: true,
    Component: makeWidget("monthly_activity", () => b2cDashboardService.getMonthlyActivity(6),
      (data) => <RecentActivityTable activities={data} />),
  },
  // Self-contained; loads its own data.
  { id: "candidate_comparison", full: true, Component: CandidateComparison },
];

export function Analytics() {
  const t = useTranslations("dashboard.indivisual.analytics");
  const locale = useLocale();

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[#f8f9fc]">
      <main className="p-4 sm:p-6 md:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {WIDGETS.map(({ id, full, Component }) => (
            <section key={id} data-widget={id} className={`min-w-0 [&>*]:h-full ${full ? "lg:col-span-2" : ""}`}>
              <Component />
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
