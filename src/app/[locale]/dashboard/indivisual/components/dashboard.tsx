// app/dashboard/indivisual/overview/components/dashboard.tsx
"use client"

import { useState, useEffect } from "react"
import { Search, Bell, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MetricCard } from "./metric-card"
import { CandidateList } from "./candidate-list"
import { PointConsumptionChart } from "./point-consumption-chart"
import { TimeRangeChart } from "./time-range-chart"
import { EvaluationManagement } from "./evaluation-management"
import { CandidateComparison } from "./candidate-comparison"
import { StatusDistributionChart } from "./status-distribution-chart"
import { useTranslations } from "next-intl"
import b2cDashboardService from "@/app/api/dashboard/b2c/endpoints"
import type { 
  DashboardStats, 
  RecentCandidate, 
  RecentEvaluation,
  EvaluationTimeRange,
  EvaluationStatusDistribution,
  JobRoleDistribution,
  ScoreTrend
} from "@/app/api/dashboard/b2c/types"
import { ScoreTrendChart } from "./score-trend-chart"

export function Dashboard() {
  const t = useTranslations("dashboard.indivisual.dashboard")
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentCandidates, setRecentCandidates] = useState<RecentCandidate[]>([])
  const [recentEvaluations, setRecentEvaluations] = useState<RecentEvaluation[]>([])
  const [timeRange, setTimeRange] = useState<EvaluationTimeRange[]>([])
  const [statusDistribution, setStatusDistribution] = useState<EvaluationStatusDistribution[]>([])
  const [jobRoleDistribution, setJobRoleDistribution] = useState<JobRoleDistribution[]>([])
  const [scoreTrend, setScoreTrend] = useState<ScoreTrend[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"scheduled" | "inProgress" | "completed">("inProgress")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (activeTab) {
      fetchEvaluationsByStatus()
    }
  }, [activeTab])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [
        statsData,
        candidatesData,
        timeRangeData,
        statusData,
        jobRoleData,
        scoreTrendData
      ] = await Promise.all([
        b2cDashboardService.getStats(),
        b2cDashboardService.getRecentCandidates(10),
        b2cDashboardService.getEvaluationTimeRange(),
        b2cDashboardService.getStatusDistribution(),
        b2cDashboardService.getJobRoleDistribution(),
        b2cDashboardService.getScoreTrend(30)
      ])

      setStats(statsData)
      setRecentCandidates(candidatesData)
      setTimeRange(timeRangeData)
      setStatusDistribution(statusData)
      setJobRoleDistribution(jobRoleData)
      setScoreTrend(scoreTrendData)
      
      // Fetch initial evaluations
      await fetchEvaluationsByStatus()
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvaluationsByStatus = async () => {
    try {
      let statusParam: string | undefined
      if (activeTab === 'scheduled') statusParam = 'scheduled'
      else if (activeTab === 'completed') statusParam = 'completed'
      
      const evaluations = await b2cDashboardService.getRecentEvaluations(10, statusParam)
      setRecentEvaluations(evaluations)
    } catch (error) {
      console.error('Failed to fetch evaluations:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Package Banner */}
      <div className="bg-yellow-400 text-black px-4 sm:px-6 py-2 flex items-center">
        <span className="font-semibold text-xs sm:text-sm">
          📦 {t("packageExpires", { days: 7 })}
        </span>
      </div>

      {/* Header */}
      <header className="border-b bg-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <button className="relative">
              <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <span className="text-sm font-medium hidden sm:block">
              {t("notification")}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 space-y-6">
        {/* Metrics */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <MetricCard
              title={t("metrics.evaluationsCompleted")}
              value={stats.completed_evaluations.toString()}
              change={t("metrics.thisMonthIncrease", { value: 2 })}
              icon="📋"
            />
            <MetricCard
              title={t("metrics.certificatesIssued")}
              value={stats.certificates_issued.toString()}
              change={t("metrics.thisMonth")}
              icon="📄"
            />
            <MetricCard
              title={t("metrics.remainingPoints")}
              value="1200"
              change={t("metrics.usedThisMonth", { value: 8 })}
              icon="🎯"
            />
            <MetricCard
              title={t("metrics.successRate")}
              value={`${stats.success_rate}%`}
              change={t("metrics.increase", { value: Math.round(stats.success_rate - 60) })}
              icon="📈"
            />

            <div className="bg-card rounded-lg p-4 flex flex-col justify-center items-center text-center gap-3">
              <div className="text-sm font-medium">{t("quickAction")}</div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs">
                {t("buyPoints", { value: 100 })}
              </Button>
              <Button
                variant="outline"
                className="w-full text-xs bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
              >
                {t("resumeSubscription")}
              </Button>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            <CandidateList 
              candidates={recentCandidates}
              searchTerm={searchTerm}
            />
            <EvaluationManagement 
              evaluations={recentEvaluations}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            <StatusDistributionChart data={statusDistribution} />
          </div>

          {/* Right */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("notification")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">
                    • {t("notifications.pendingEvaluation")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("notifications.newReport")}
                  </p>
                </div>
                {statusDistribution.slice(0, 2).map((item) => (
                  <div key={item.status} className="text-sm">
                    <p className="font-medium">
                      • {item.count} {item.status_display}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <PointConsumptionChart data={jobRoleDistribution} />
            <TimeRangeChart data={timeRange} />
          </div>
        </div>

        {/* Comparison */}
        <CandidateComparison />
        <ScoreTrendChart data={scoreTrend} />
      </main>
    </div>
  )
}