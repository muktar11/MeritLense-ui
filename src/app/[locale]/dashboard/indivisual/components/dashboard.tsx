// app/dashboard/indivisual/overview/components/dashboard.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { toast } from "sonner"
import { Search, Bell, Loader2, BarChart3, LayoutGrid, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MetricCard } from "./metric-card"
import { CustomizeDashboardDialog } from "../../business/components/widgets/customize-dashboard-dialog"
import {
  B2C_DEFAULT_WIDGETS,
  B2C_WIDGET_CATALOG,
  B2CWidgetGrid,
  CandidateSearchContext,
  isB2CWidgetId,
  type B2CWidgetId,
} from "./widgets/widget-registry"
import b2cDashboardService from "@/app/api/dashboard/b2c/endpoints"
import paymentService from "@/app/api/payments/endpoints"
import type { DashboardLayout, DashboardStats } from "@/app/api/dashboard/b2c/types"
import type { Subscription } from "@/app/api/payments/types"

function visibleWidgets(layout: DashboardLayout | null): B2CWidgetId[] {
  return layout ? layout.widgets.filter(isB2CWidgetId) : [...B2C_DEFAULT_WIDGETS]
}

export function Dashboard() {
  const t = useTranslations("dashboard.indivisual.dashboard")
  const tOverview = useTranslations("dashboard.business.overview")
  const router = useRouter()
  const locale = useLocale()

  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  // null = not loaded (or failed to load): render the default layout, so
  // the dashboard is fully usable without any customization. Each widget
  // loads its own data, so hidden widgets cost no requests.
  const [layout, setLayout] = useState<DashboardLayout | null>(null)
  const [layoutReady, setLayoutReady] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)

  useEffect(() => {
    b2cDashboardService.getStats()
      .then(setStats)
      .catch((error) => console.error("Failed to fetch dashboard stats:", error))
      .finally(() => setStatsLoading(false))

    b2cDashboardService.getDashboardLayout()
      .then(setLayout)
      .catch((error) => console.error("Failed to fetch dashboard layout:", error))
      .finally(() => setLayoutReady(true))

    paymentService.getActiveSubscriptions()
      .then(async (active) => {
        setSubscription(active.length > 0 ? await paymentService.getSubscription(active[0].id) : null)
      })
      .catch((error) => {
        console.error("Failed to fetch subscription:", error)
        setSubscription(null)
      })
  }, [])

  const saveLayout = async (widgets: B2CWidgetId[]) => {
    try {
      setLayout(await b2cDashboardService.saveDashboardLayout(widgets))
      toast.success(tOverview("customize.saved"))
    } catch (error) {
      console.error("Failed to save dashboard layout:", error)
      toast.error(tOverview("customize.saveError"))
      throw error
    }
  }

  const resetLayout = async () => {
    try {
      setLayout(await b2cDashboardService.resetDashboardLayout())
      toast.success(tOverview("customize.resetDone"))
    } catch (error) {
      console.error("Failed to reset dashboard layout:", error)
      toast.error(tOverview("customize.saveError"))
      throw error
    }
  }

  // Memoized: the customize dialog re-seeds its draft when this changes.
  const widgets = useMemo(() => visibleWidgets(layout), [layout])

  // Available Slots (the headline figure) plus how many are Reserved for
  // an upcoming interview that hasn't started yet - Available alone can't
  // tell you that, since a Reserved slot is already deducted from it
  // (Slot Reservation Lifecycle spec, Section 8).
  const slotsUnlimited = stats?.slots_unlimited ?? false
  const remainingSlots = stats?.remaining_slots ?? null
  const reservedSlots = stats?.reserved_slots ?? null

  const customizeButton = (
    <Button size="sm" className="gap-1.5" onClick={() => setCustomizeOpen(true)}>
      <SlidersHorizontal className="h-4 w-4" />
      {tOverview("customize.button")}
    </Button>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Package Banner */}
      {subscription && subscription.days_remaining > 0 && (
        <div className="bg-yellow-400 text-black px-4 sm:px-6 py-2 flex items-center">
          <span className="font-semibold text-xs sm:text-sm">
            📦 {t("packageExpires", { days: subscription.days_remaining })}
          </span>
        </div>
      )}

      {/* Header */}
      <header className="border-b bg-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full ps-10 pe-4 py-2 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            <Button asChild variant="outline" size="sm" className="gap-1.5 bg-white">
              <Link href={`/${locale}/dashboard/indivisual/analytics`}>
                <BarChart3 className="h-4 w-4" />
                {t("viewAnalytics")}
              </Link>
            </Button>
            {customizeButton}
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
        {statsLoading ? (
          <div className="flex h-24 items-center justify-center" role="status">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <MetricCard
              title={t("metrics.evaluationsCompleted")}
              value={stats.completed_evaluations.toString()}
              change={t("metrics.totalEvaluations", { value: stats.total_evaluations })}
              icon="📋"
            />
            <MetricCard
              title={t("metrics.certificatesIssued")}
              value={stats.certificates_issued.toString()}
              change={t("metrics.thisMonth")}
              icon="📄"
            />
            <MetricCard
              title={t("metrics.assessmentSlots")}
              value={slotsUnlimited ? "∞" : remainingSlots !== null ? remainingSlots.toString() : "-"}
              change={
                slotsUnlimited
                  ? t("metrics.unlimitedPlan")
                  : reservedSlots
                    ? t("metrics.reservedForUpcoming", { value: reservedSlots })
                    : remainingSlots !== null
                      ? t("metrics.noneReserved")
                      : t("metrics.noActivePlan")
              }
              icon="🎟️"
            />
            <MetricCard
              title={t("metrics.successRate")}
              value={`${stats.success_rate}%`}
              change={t("metrics.basedOnEvaluations", { value: stats.completed_evaluations })}
              icon="📈"
            />

            <div className="bg-card rounded-lg p-4 flex flex-col justify-center items-center text-center gap-3">
              <div className="text-sm font-medium">{t("quickAction")}</div>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs"
                onClick={() => router.push(`/${locale}/dashboard/indivisual/payment`)}
              >
                {t("buyMoreAssessments")}
              </Button>
              <Button
                variant="outline"
                className="w-full text-xs bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                onClick={() => router.push(`/${locale}/dashboard/indivisual/payment`)}
              >
                {t("resumeSubscription")}
              </Button>
            </div>
          </div>
        )}

        {/* Widgets */}
        {!layoutReady ? (
          <div className="flex h-48 items-center justify-center" role="status">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : widgets.length > 0 ? (
          <CandidateSearchContext.Provider value={searchTerm}>
            <B2CWidgetGrid widgets={widgets} />
          </CandidateSearchContext.Provider>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
            <LayoutGrid className="h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">{tOverview("emptyLayout.title")}</p>
            <p className="max-w-md text-sm text-gray-500">{tOverview("emptyLayout.description")}</p>
            {customizeButton}
          </div>
        )}
      </main>

      <CustomizeDashboardDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        catalog={B2C_WIDGET_CATALOG}
        widgets={widgets}
        onSave={saveLayout}
        onReset={resetLayout}
        description={t("customizeDescription")}
      />
    </div>
  )
}
