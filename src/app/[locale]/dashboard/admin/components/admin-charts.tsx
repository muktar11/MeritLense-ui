"use client"

import type { ReactNode } from "react"
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
import { useLocale, useTranslations } from "next-intl"
import { ar } from "date-fns/locale"
import { format } from "date-fns"
import adminDashboardService from "@/app/api/dashboard/admin/endpoints"
import { useWidgetData } from "../../business/components/widgets/use-widget-data"
import { WidgetFrame } from "../../business/components/widgets/widget-frame"
import { ReadinessIndexChart } from "../../business/components/readiness-index-chart"

// Platform-wide admin charts, shared by the Admin overview and the Admin
// Analytics & Insights page. Each loads its own data (same widget helpers
// as the B2B dashboard), so one failing endpoint can't blank the page.

const COLORS = {
  evaluationType: ["#6366F1", "#22D3EE", "#A855F7", "#EC4899", "#F97316", "#22C55E"],
  packageCont: ["#3B82F6", "#22D3EE", "#22C55E", "#F97316", "#A855F7", "#EC4899"],
  userType: ["#3B82F6", "#EC4899", "#22C55E", "#F97316", "#A855F7"],
  status: ["#22C55E", "#3B82F6", "#F59E0B", "#A855F7", "#EF4444", "#94A3B8"],
}

const TYPE_KEYS: Record<string, string> = {
  INTERVIEW: 'interview',
  TECHNICAL_TEST: 'technicalTest',
  ASSESSMENT: 'assessment',
  LANGUAGE_PROFICIENCY: 'languageProficiency',
}

const STATUS_KEYS: Record<string, string> = {
  SCHEDULED: 'scheduled',
  RESCHEDULED: 'rescheduled',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'noShow',
}

const tooltipStyle = {
  backgroundColor: "white",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  fontSize: "12px",
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  const locale = useLocale()
  return (
    <Card className="bg-white shadow-sm border-0 h-full" dir={locale === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function EmptyState() {
  const t = useTranslations("dashboard.admin.overview_page")
  return <div className="flex h-48 items-center justify-center text-sm text-gray-400">{t("noData")}</div>
}

// Loads one chart's data and shows the shared loading/error placeholder
// until it's ready.
function AdminWidget<T>({ title, fetcher, children }: { title: string; fetcher: () => Promise<T>; children: (data: T) => ReactNode }) {
  const { data, loading, error, retry } = useWidgetData(fetcher)
  return (
    <WidgetFrame title={title} loading={loading} error={error} onRetry={retry}>
      {() => children(data as T)}
    </WidgetFrame>
  )
}

function PieWithLegend({ data, colors, valueLabel }: { data: { name: string; value: number }[]; colors: string[]; valueLabel: string }) {
  if (data.length === 0) return <EmptyState />
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={90} paddingAngle={1} dataKey="value" nameKey="name" stroke="white" strokeWidth={2}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number | undefined) => [adminDashboardService.formatNumber(value ?? 0), valueLabel]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors[idx % colors.length] }} />
            <span className="text-xs text-gray-600">{item.name} ({adminDashboardService.formatNumber(item.value)})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SystemLoadWidget() {
  const t = useTranslations("dashboard.admin.overview_page")
  const locale = useLocale()
  return (
    <AdminWidget title={t("charts.systemLoadTrend")} fetcher={() => adminDashboardService.getSystemLoad(30)}>
      {(systemLoad) => {
        // Last 14 days that had any activity.
        const chartData = systemLoad
          .filter((item) => item.users_registered > 0 || item.companies_registered > 0 || item.evaluations_created > 0)
          .slice(-14)
          .map((item) => ({
            date: format(new Date(item.date), 'MMM d', locale === 'ar' ? { locale: ar } : undefined),
            B2C: item.users_registered,
            B2B: item.companies_registered,
            evaluations: item.evaluations_created,
          }))
        return (
          <ChartCard title={t("charts.systemLoadTrend")}>
            {chartData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
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
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number | undefined, name: string | undefined) => {
                      if (name === "B2C") return [value, t("users")]
                      if (name === "B2B") return [value, t("companies")]
                      if (name === "evaluations") return [value, t("evaluations")]
                      return [value, name]
                    }}
                  />
                  <Legend align="right" verticalAlign="top" iconType="rect" iconSize={10} wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="B2C" stroke="#3B82F6" strokeWidth={2} fill="url(#colorB2C)" name={t("users")} />
                  <Area type="monotone" dataKey="B2B" stroke="#A855F7" strokeWidth={2} fill="url(#colorB2B)" name={t("companies")} />
                  <Area type="monotone" dataKey="evaluations" stroke="#22C55E" strokeWidth={2} fill="url(#colorEval)" name={t("evaluations")} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        )
      }}
    </AdminWidget>
  )
}

export function UserGrowthWidget() {
  const t = useTranslations("dashboard.admin.overview_page")
  const locale = useLocale()
  return (
    <AdminWidget title={t("charts.userGrowthTrend")} fetcher={() => adminDashboardService.getUserGrowth(12)}>
      {(userGrowth) => {
        const chartData = userGrowth.map((item) => ({
          role: format(new Date(item.month + '-01'), 'MMM', locale === 'ar' ? { locale: ar } : undefined),
          value: item.total_users,
        }))
        return (
          <ChartCard title={t("charts.userGrowthTrend")}>
            {chartData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barSize={45}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="role" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number | undefined) => [adminDashboardService.formatNumber(value ?? 0), t("users")]}
                  />
                  <Bar dataKey="value" fill="#A855F7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        )
      }}
    </AdminWidget>
  )
}

export function EvaluationTypesWidget() {
  const t = useTranslations("dashboard.admin.overview_page")
  const tTypes = useTranslations("dashboard.indivisual.evaluationManagement.types")
  return (
    <AdminWidget title={t("charts.evaluationTypesDistribution")} fetcher={() => adminDashboardService.getEvaluationTypes()}>
      {(evaluationTypes) => (
        <ChartCard title={t("charts.evaluationTypesDistribution")}>
          <PieWithLegend
            colors={COLORS.evaluationType}
            valueLabel={t("evaluations")}
            data={evaluationTypes.slice(0, 4).map((item) => ({
              name: TYPE_KEYS[item.type] ? tTypes(TYPE_KEYS[item.type]) : item.type_display,
              value: item.count,
            }))}
          />
        </ChartCard>
      )}
    </AdminWidget>
  )
}

export function PackageContributionWidget() {
  const t = useTranslations("dashboard.admin.overview_page")
  return (
    <AdminWidget title={t("charts.packageContribution")} fetcher={() => adminDashboardService.getPackageContribution()}>
      {(packages) => (
        <ChartCard title={t("charts.packageContribution")}>
          <PieWithLegend
            colors={COLORS.packageCont}
            valueLabel={t("subscribers")}
            data={packages.slice(0, 4).map((item) => ({ name: item.package_name, value: item.subscriber_count }))}
          />
        </ChartCard>
      )}
    </AdminWidget>
  )
}

export function RevenueTrendWidget() {
  const t = useTranslations("dashboard.admin.overview_page")
  return (
    <AdminWidget title={t("charts.revenueTrend")} fetcher={() => adminDashboardService.getRevenueTrend(12)}>
      {(revenueTrend) => (
        <ChartCard title={t("charts.revenueTrend")}>
          {revenueTrend.length === 0 ? <EmptyState /> : (
            <>
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
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(value) => `€${value}`} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number | undefined, name: string | undefined) => {
                      if (name === "total_revenue") return [`€${value?.toFixed(2)}`, t("totalRevenue")]
                      if (name === "payment_revenue") return [`€${value?.toFixed(2)}`, t("paymentRevenue")]
                      if (name === "subscription_revenue") return [`€${value?.toFixed(2)}`, t("subscriptionRevenue")]
                      if (name === "cumulative_revenue") return [`€${value?.toFixed(2)}`, t("cumulativeRevenue")]
                      return [value, name]
                    }}
                    labelFormatter={(label) => t("monthLabel", { month: label })}
                  />
                  <Legend align="right" verticalAlign="top" iconType="rect" iconSize={10} wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="total_revenue" stroke="#22C55E" strokeWidth={2} fill="url(#colorRevenue)" name={t("totalRevenue")} />
                  <Area type="monotone" dataKey="subscription_revenue" stroke="#A855F7" strokeWidth={2} fill="url(#colorSubscription)" name={t("subscriptionRevenue")} />
                  <Area type="monotone" dataKey="payment_revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorPayment)" name={t("paymentRevenue")} />
                </AreaChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">{t("totalRevenue")}</p>
                  <p className="text-lg font-bold text-gray-900">€{revenueTrend[revenueTrend.length - 1]?.cumulative_revenue.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">{t("monthlyRevenueLabel")}</p>
                  <p className="text-lg font-bold text-gray-900">€{revenueTrend[revenueTrend.length - 1]?.total_revenue.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">{t("newSubscriptionsLabel")}</p>
                  <p className="text-lg font-bold text-gray-900">{revenueTrend.reduce((sum, month) => sum + month.new_subscriptions, 0)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">{t("totalPaymentsLabel")}</p>
                  <p className="text-lg font-bold text-gray-900">{revenueTrend.reduce((sum, month) => sum + month.payment_count, 0)}</p>
                </div>
              </div>
            </>
          )}
        </ChartCard>
      )}
    </AdminWidget>
  )
}

// -- Analytics-page-only charts ----------------------------------------------

export function ReadinessIndexWidget() {
  const t = useTranslations("dashboard.business.readinessIndexChart")
  return (
    <AdminWidget title={t("title")} fetcher={() => adminDashboardService.getReadinessDistribution()}>
      {(data) => <ReadinessIndexChart data={data} />}
    </AdminWidget>
  )
}

export function EvaluationStatusWidget() {
  const t = useTranslations("dashboard.admin.overview_page")
  const tStatus = useTranslations("dashboard.indivisual.evaluationManagement.status")
  return (
    <AdminWidget title={t("charts.evaluationStatus")} fetcher={() => adminDashboardService.getStatusDistribution()}>
      {(statuses) => (
        <ChartCard title={t("charts.evaluationStatus")}>
          <PieWithLegend
            colors={COLORS.status}
            valueLabel={t("evaluations")}
            data={statuses.map((item) => ({
              name: STATUS_KEYS[item.status] ? tStatus(STATUS_KEYS[item.status]) : item.status_display,
              value: item.count,
            }))}
          />
        </ChartCard>
      )}
    </AdminWidget>
  )
}

export function UserTypeWidget() {
  const t = useTranslations("dashboard.admin.overview_page")
  return (
    <AdminWidget title={t("charts.userTypeDistribution")} fetcher={() => adminDashboardService.getUserTypeDistribution()}>
      {(userTypes) => (
        <ChartCard title={t("charts.userTypeDistribution")}>
          <PieWithLegend
            colors={COLORS.userType}
            valueLabel={t("users")}
            data={userTypes.map((item) => ({
              name: t.has(`userTypes.${item.role}`) ? t(`userTypes.${item.role}`) : item.role_display,
              value: item.count,
            }))}
          />
        </ChartCard>
      )}
    </AdminWidget>
  )
}

export function GeographicWidget() {
  const t = useTranslations("dashboard.admin.overview_page")
  return (
    <AdminWidget title={t("charts.geographicDistribution")} fetcher={() => adminDashboardService.getGeographicDistribution()}>
      {(countries) => (
        <ChartCard title={t("charts.geographicDistribution")}>
          {countries.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={Math.max(160, countries.slice(0, 10).length * 36)}>
              <BarChart data={countries.slice(0, 10)} layout="vertical" barSize={18} margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis type="category" dataKey="country" axisLine={false} tickLine={false} width={130} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number | undefined) => [value ?? 0, t("companies")]} />
                <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      )}
    </AdminWidget>
  )
}
