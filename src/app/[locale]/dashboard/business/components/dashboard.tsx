// app/dashboard/business/overview/components/dashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { MetricCard } from "./metric-card";
import { CandidateEvaluationTable } from "./candidate-evaluation-table";
import { PerformanceChart } from "./performance-chart";
import { PointConsumptionChart } from "./point-consumption-chart";
import { ScoreDistributionChart } from "./score-distribution-chart";
import { AgeDistributionChart } from "./age-distribution-chart";
import { ReadinessIndexChart } from "./readiness-index-chart";
import { LanguageDistributionChart } from "./language-distribution-chart";
import { RecentActivityTable } from "./recent-activity-table";
import { EvaluationTrendChart } from "./evaluation-trend-chart";
import { StatusDistributionChart } from "./status-distribution-chart";
import b2bDashboardService from "@/app/api/dashboard/b2b/endpoints";
import type { 
  DashboardStats, 
  RecentEvaluation, 
  ScoreDistribution,
  EvaluationTrend,
  LanguageDistribution,
  PerformanceMetric,
  EvaluationStatusDistribution,
  MonthlyActivity
} from "@/app/api/dashboard/b2b/types";
import { Loader2 } from "lucide-react";

export function Dashboard() {
  const t = useTranslations("dashboard.business.overview");
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvaluations, setRecentEvaluations] = useState<RecentEvaluation[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);
  const [evaluationTrend, setEvaluationTrend] = useState<EvaluationTrend[]>([]);
  const [languageDistribution, setLanguageDistribution] = useState<LanguageDistribution[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<EvaluationStatusDistribution[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<MonthlyActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsData,
        recentEvalsData,
        scoreDistData,
        trendData,
        langDistData,
        metricsData,
        statusDistData,
        monthlyData
      ] = await Promise.all([
        b2bDashboardService.getStats(),
        b2bDashboardService.getRecentEvaluations(10),
        b2bDashboardService.getScoreDistribution(),
        b2bDashboardService.getEvaluationTrend(30),
        b2bDashboardService.getLanguageDistribution(),
        b2bDashboardService.getPerformanceMetrics(6),
        b2bDashboardService.getStatusDistribution(),
        b2bDashboardService.getMonthlyActivity(6)
      ]);

      setStats(statsData);
      setRecentEvaluations(recentEvalsData);
      setScoreDistribution(scoreDistData);
      setEvaluationTrend(trendData);
      setLanguageDistribution(langDistData);
      setPerformanceMetrics(metricsData);
      setStatusDistribution(statusDistData);
      setMonthlyActivity(monthlyData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Format performance metrics for the chart
  const performanceChartData = performanceMetrics.map(metric => ({
    month: format(new Date(metric.period + '-01'), 'MMM'),
    value: metric.average_score
  }));

  // Format score distribution for the chart
  const scoreChartData = scoreDistribution.map(item => ({
    role: item.job_role,
    roleLabel: item.job_role_display,
    score: item.average_score
  }));

  // Format language distribution for the chart
  const languageChartData = languageDistribution.map(item => ({
    key: item.language.toLowerCase(),
    language: item.language_display,
    value: item.percentage
  }));

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[#f8f9fc]">
      {/* Package Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-6 py-3">
        <div className="bg-amber-400 text-amber-900 px-4 py-1.5 rounded-full text-sm font-medium">
          {t("package.expires", { days: 7 })}
        </div>

        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-8"
        >
          {t("package.renew")}
        </Button>

        <div className="flex-1" />

        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder={t("search.placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 sm:p-6 md:p-6 space-y-6">
        {/* Metrics */}
        {stats && (
          <div className="flex flex-wrap gap-4">
            <MetricCard
              title={t("metrics.evaluationsCompleted")}
              value={stats.completed_evaluations.toString()}
              change={t("metrics.changes.growth", { value: Math.round(stats.success_rate) })}
              changeType="positive"
              icon="clipboard"
            />

            <MetricCard
              title={t("metrics.activeCandidates")}
              value={stats.total_candidates.toString()}
              change={t("metrics.changes.growth", { value: 6 })}
              changeType="positive"
              icon="users"
              highlight
            />

            <MetricCard
              title={t("metrics.certificatesIssued")}
              value={stats.certificates_issued.toString()}
              change={t("metrics.changes.negativeMonthly", { value: 5 })}
              changeType="negative"
              icon="certificate"
            />

            <MetricCard
              title={t("metrics.teamMembers")}
              value={stats.team_members_count.toString()}
              change={t("metrics.changes.used", { value: 0 })}
              changeType="neutral"
              icon="users"
            />

            <MetricCard
              title={t("metrics.successRate")}
              value={`${stats.success_rate}%`}
              change={t("metrics.changes.increase", { value: Math.round(stats.success_rate - 60) })}
              changeType="positive"
              icon="trending"
            />

            {/* Critical Alert - Show if any issues */}
            {stats.success_rate < 50 && (
              <div className="bg-white rounded-xl p-4 border border-red-200 min-w-35 flex-1 sm:flex-none">
                <div className="text-red-500 text-sm font-semibold mb-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {t("alerts.critical")}
                </div>
                <div className="text-gray-700 text-sm">{t("alerts.lowSuccessRate")}</div>
              </div>
            )}
          </div>
        )}

        {/* Candidate Evaluation & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 overflow-x-auto">
            <CandidateEvaluationTable 
              evaluations={recentEvaluations}
              searchTerm={searchTerm}
            />
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <PerformanceChart data={performanceChartData} />
            <StatusDistributionChart data={statusDistribution} />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-1 lg:col-span-4">
            <ScoreDistributionChart data={scoreChartData} />
          </div>
          <div className="col-span-12 md:col-span-1 lg:col-span-4">
            <EvaluationTrendChart data={evaluationTrend} />
          </div>
          <div className="col-span-12 md:col-span-2 lg:col-span-4 flex flex-col gap-6">
            <ReadinessIndexChart data={statusDistribution} />
            <LanguageDistributionChart data={languageChartData} />
          </div>
        </div>

        {/* Monthly Activity */}
        {monthlyActivity.length > 0 && (
          <div className="mt-6">
            <RecentActivityTable activities={monthlyActivity} />
          </div>
        )}
      </main>
    </div>
  );
}