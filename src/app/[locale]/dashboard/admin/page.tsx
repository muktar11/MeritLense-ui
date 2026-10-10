// app/dashboard/admin/overview/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, FileText, DollarSign, UserCheck, Loader2, BarChart3, type LucideIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import adminDashboardService from "@/app/api/dashboard/admin/endpoints"
import type { AdminDashboardStats } from "@/app/api/dashboard/admin/types"
import {
  SystemLoadWidget,
  UserGrowthWidget,
  EvaluationTypesWidget,
  PackageContributionWidget,
  RevenueTrendWidget,
} from "./components/admin-charts"

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  trend: "up" | "down" | "neutral"
  iconColor: string
}

const StatCard = ({ title, value, change, icon: Icon, trend, iconColor }: StatCardProps) => (
  <Card className="bg-white shadow-sm border-0">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <p className={`text-xs font-medium ${
            trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-500"
          }`}>{change}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function AdminDashboardPage() {
  const t = useTranslations("dashboard.admin.overview_page")
  const locale = useLocale()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)

  // The KPI cards load here; each chart below loads its own data.
  useEffect(() => {
    adminDashboardService.getStats()
      .then(setStats)
      .catch((error) => console.error('Failed to fetch admin dashboard stats:', error))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="flex-1 overflow-auto bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm" className="gap-1.5 bg-white">
            <Link href={`/${locale}/dashboard/admin/analytics`}>
              <BarChart3 className="h-4 w-4" />
              {t("viewAnalytics")}
            </Link>
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              title={t("stats.activeCandidates")}
              value={adminDashboardService.formatNumber(stats.active_candidates)}
              change={t("stats.currentlyActive")}
              trend="neutral"
              icon={UserCheck}
              iconColor="text-blue-500"
            />
            <StatCard
              title={t("stats.totalUsers")}
              value={adminDashboardService.formatNumber(stats.total_users)}
              change={t("stats.userBreakdown", { b2c: stats.b2c_users, b2b: stats.b2b_users })}
              trend="neutral"
              icon={Users}
              iconColor="text-purple-500"
            />
            <StatCard
              title={t("stats.activeAgencies")}
              value={adminDashboardService.formatNumber(stats.active_agencies)}
              change={t("stats.verifiedAgencies")}
              trend="neutral"
              icon={Building2}
              iconColor="text-gray-500"
            />
            <StatCard
              title={t("stats.totalEvaluations")}
              value={adminDashboardService.formatNumber(stats.total_evaluations)}
              change={t("stats.completedPercent", {
                value: stats.total_evaluations > 0
                  ? Math.round((stats.completed_evaluations / stats.total_evaluations) * 100)
                  : 0
              })}
              trend="up"
              icon={FileText}
              iconColor="text-gray-500"
            />
            <StatCard
              title={t("stats.revenue")}
              value={adminDashboardService.formatCurrency(stats.monthly_recurring_revenue)}
              change={t("stats.activeSubscriptions", { value: stats.active_subscriptions_count })}
              trend="neutral"
              icon={DollarSign}
              iconColor="text-blue-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SystemLoadWidget />
          <UserGrowthWidget />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EvaluationTypesWidget />
          <PackageContributionWidget />
        </div>

        <RevenueTrendWidget />
      </div>
    </main>
  )
}
