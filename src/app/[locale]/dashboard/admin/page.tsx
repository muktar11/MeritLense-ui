// app/dashboard/admin/overview/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Users, Building2, FileText, DollarSign, UserCheck, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import adminDashboardService from "@/app/api/dashboard/admin/endpoints"
import type {
  AdminDashboardStats,
  SystemLoadData,
  UserGrowthData,
  EvaluationTypeDistribution,
  PackageContribution,
  RevenueTrendData
} from "@/app/api/dashboard/admin/types"
import { format } from "date-fns"

const COLORS = {
  evaluationType: ["#6366F1", "#22D3EE", "#A855F7", "#EC4899", "#F97316", "#22C55E"],
  packageCont: ["#3B82F6", "#22D3EE", "#22C55E", "#F97316", "#A855F7", "#EC4899"],
  userType: ["#3B82F6", "#EC4899", "#22C55E", "#F97316", "#A855F7"]
}

const StatCard = ({ title, value, change, icon: Icon, trend, iconColor }: any) => (
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
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [systemLoad, setSystemLoad] = useState<SystemLoadData[]>([])
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([])
  const [evaluationTypes, setEvaluationTypes] = useState<EvaluationTypeDistribution[]>([])
  const [packageContribution, setPackageContribution] = useState<PackageContribution[]>([])
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendData[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [
        statsData,
        systemLoadData,
        userGrowthData,
        evaluationTypesData,
        packageData,
        revenueData
      ] = await Promise.all([
        adminDashboardService.getStats(),
        adminDashboardService.getSystemLoad(30),
        adminDashboardService.getUserGrowth(12),
        adminDashboardService.getEvaluationTypes(),
        adminDashboardService.getPackageContribution(),
        adminDashboardService.getRevenueTrend(12)
      ])

      setStats(statsData)
      setSystemLoad(systemLoadData.slice(0, 30)) // Last 10 days
      setUserGrowth(userGrowthData)
      setEvaluationTypes(evaluationTypesData)
      setPackageContribution(packageData)
      setRevenueTrend(revenueData)
    } catch (error) {
      console.error('Failed to fetch admin dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Transform system load data for chart
  // Show last 30 days but filter out days with all zeros
const systemLoadChartData = systemLoad
  .filter(item => 
    item.users_registered > 0 || 
    item.companies_registered > 0 || 
    item.evaluations_created > 0
  )
  .slice(-14) // Last 14 days with activity
  .map(item => ({
    date: format(new Date(item.date), 'MMM d'),
    B2C: item.users_registered,
    B2B: item.companies_registered,
    evaluations: item.evaluations_created
  }));

  // Transform user growth data for chart
  const userGrowthChartData = userGrowth.map(item => ({
    role: format(new Date(item.month + '-01'), 'MMM'),
    value: item.total_users
  }))

  // Transform evaluation types for pie chart
  const evaluationTypesChartData = evaluationTypes.slice(0, 4).map(item => ({
    name: item.type_display,
    value: item.count
  }))

  // Transform package contribution for pie chart
  const packageChartData = packageContribution.slice(0, 4).map(item => ({
    name: item.package_name,
    value: item.subscriber_count
  }))

  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-gray-100 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-auto bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Load Trend */}
          {/* System Load Trend */}
<Card className="bg-white shadow-sm border-0">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-semibold text-gray-900">{t("charts.systemLoadTrend")}</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={systemLoadChartData}>
        <defs>
          <linearGradient id="colorB2C" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="colorB2B" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#EC4899" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="colorEval" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number | undefined, name: string | undefined) => {
            if (name === "B2C") return [value, t("users")];
            if (name === "B2B") return [value, t("companies")];
            if (name === "evaluations") return [value, t("evaluations")];
            return [value, name];
          }}
        />
        <Legend
          align="right"
          verticalAlign="top"
          iconType="rect"
          iconSize={10}
          wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
        />
        <Area type="monotone" dataKey="B2C" stroke="#3B82F6" strokeWidth={2} fill="url(#colorB2C)" name={t("users")} />
        <Area type="monotone" dataKey="B2B" stroke="#A855F7" strokeWidth={2} fill="url(#colorB2B)" name={t("companies")} />
        <Area type="monotone" dataKey="evaluations" stroke="#22C55E" strokeWidth={2} fill="url(#colorEval)" name={t("evaluations")} />
      </AreaChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

          {/* User Growth Trend */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900">{t("charts.userGrowthTrend")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={userGrowthChartData} barSize={45}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="role" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number | undefined) => [adminDashboardService.formatNumber(value ?? 0), t("users")]}
                  />
                  <Bar dataKey="value" fill="#A855F7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evaluation Types */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900">{t("charts.evaluationTypesDistribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={evaluationTypesChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={90}
                      paddingAngle={1}
                      dataKey="value"
                      stroke="white"
                      strokeWidth={2}
                      nameKey="name"
                    >
                      {evaluationTypesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.evaluationType[index % COLORS.evaluationType.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number | undefined) => [adminDashboardService.formatNumber(value ?? 0), t("evaluations")]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {evaluationTypesChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.evaluationType[idx % COLORS.evaluationType.length] }} />
                      <span className="text-xs text-gray-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Contribution */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900">{t("charts.packageContribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={packageChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={85}
                      paddingAngle={1}
                      dataKey="value"
                      stroke="white"
                      strokeWidth={2}
                    >
                      {packageChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.packageCont[index % COLORS.packageCont.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number | undefined) => [adminDashboardService.formatNumber(value ?? 0), t("subscribers")]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {packageChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.packageCont[idx % COLORS.packageCont.length] }} />
                      <span className="text-xs text-gray-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trend (optional additional chart) */}
{revenueTrend.length > 0 && (
  <Card className="bg-white shadow-sm border-0">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-semibold text-gray-900">{t("charts.revenueTrend")}</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={revenueTrend}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="colorPayment" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="colorSubscription" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#A855F7" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            tickFormatter={(value) => `€${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number | undefined, name: string | undefined) => {
              if (name === "total_revenue") return [`€${value?.toFixed(2)}`, t("totalRevenue")];
              if (name === "payment_revenue") return [`€${value?.toFixed(2)}`, t("paymentRevenue")];
              if (name === "subscription_revenue") return [`€${value?.toFixed(2)}`, t("subscriptionRevenue")];
              if (name === "cumulative_revenue") return [`€${value?.toFixed(2)}`, t("cumulativeRevenue")];
              return [value, name];
            }}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Legend
            align="right"
            verticalAlign="top"
            iconType="rect"
            iconSize={10}
            wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
          />
          <Area 
            type="monotone" 
            dataKey="total_revenue" 
            stroke="#22C55E" 
            strokeWidth={2} 
            fill="url(#colorRevenue)" 
            name={t("totalRevenue")}
          />
          <Area 
            type="monotone" 
            dataKey="subscription_revenue" 
            stroke="#A855F7" 
            strokeWidth={2} 
            fill="url(#colorSubscription)" 
            name={t("subscriptionRevenue")}
          />
          <Area 
            type="monotone" 
            dataKey="payment_revenue" 
            stroke="#3B82F6" 
            strokeWidth={2} 
            fill="url(#colorPayment)" 
            name={t("paymentRevenue")}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Summary Stats for Revenue */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-lg font-bold text-gray-900">
            €{revenueTrend[revenueTrend.length - 1]?.cumulative_revenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Monthly Revenue</p>
          <p className="text-lg font-bold text-gray-900">
            €{revenueTrend[revenueTrend.length - 1]?.total_revenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">New Subscriptions</p>
          <p className="text-lg font-bold text-gray-900">
            {revenueTrend.reduce((sum, month) => sum + month.new_subscriptions, 0)}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Total Payments</p>
          <p className="text-lg font-bold text-gray-900">
            {revenueTrend.reduce((sum, month) => sum + month.payment_count, 0)}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
      </div>
    </main>
  )
}