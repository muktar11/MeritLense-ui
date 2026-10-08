// app/dashboard/business/overview/components/dashboard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, BarChart3, LayoutGrid, Loader2, SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MetricCard } from "./metric-card";
import { CustomizeDashboardDialog } from "./widgets/customize-dashboard-dialog";
import { DEFAULT_WIDGETS, WidgetGrid, isWidgetId, type WidgetId } from "./widgets/widget-registry";
import b2bDashboardService from "@/app/api/dashboard/b2b/endpoints";
import paymentService from "@/app/api/payments/endpoints";
import type { DashboardLayout, DashboardStats } from "@/app/api/dashboard/b2b/types";
import type { Subscription } from "@/app/api/payments/types";

function visibleWidgets(layout: DashboardLayout | null): WidgetId[] {
  return layout ? layout.widgets.filter(isWidgetId) : [...DEFAULT_WIDGETS];
}

export function Dashboard() {
  const t = useTranslations("dashboard.business.overview");
  const locale = useLocale();

  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  // null = not loaded (or failed to load): render the default layout, so
  // the dashboard is fully usable without any customization.
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    b2bDashboardService.getStats()
      .then(setStats)
      .catch((error) => console.error("Failed to fetch dashboard stats:", error))
      .finally(() => setStatsLoading(false));

    b2bDashboardService.getDashboardLayout()
      .then(setLayout)
      .catch((error) => console.error("Failed to fetch dashboard layout:", error))
      .finally(() => setLayoutReady(true));

    paymentService.getActiveSubscriptions()
      .then(async (active) => {
        setSubscription(active.length > 0 ? await paymentService.getSubscription(active[0].id) : null);
      })
      .catch((error) => {
        console.error("Failed to fetch subscription:", error);
        setSubscription(null);
      });
  }, []);

  const saveLayout = async (widgets: WidgetId[]) => {
    try {
      setLayout(await b2bDashboardService.saveDashboardLayout(widgets));
      toast.success(t("customize.saved"));
    } catch (error) {
      console.error("Failed to save dashboard layout:", error);
      toast.error(t("customize.saveError"));
      throw error;
    }
  };

  const resetLayout = async () => {
    try {
      setLayout(await b2bDashboardService.resetDashboardLayout());
      toast.success(t("customize.resetDone"));
    } catch (error) {
      console.error("Failed to reset dashboard layout:", error);
      toast.error(t("customize.saveError"));
      throw error;
    }
  };

  // Memoized: the customize dialog re-seeds its draft when this changes.
  const widgets = useMemo(() => visibleWidgets(layout), [layout]);
  const canCustomize = layout?.can_edit === true;

  const evalsPerCandidate = stats && stats.total_candidates > 0
    ? (stats.total_evaluations / stats.total_candidates).toFixed(1)
    : "0";

  const certifiedRate = stats && stats.completed_evaluations > 0
    ? Math.round((stats.certificates_issued / stats.completed_evaluations) * 100)
    : 0;

  // Available Slots (the headline figure) plus how many are Reserved for
  // an upcoming interview that hasn't started yet - Available alone can't
  // tell you that, since a Reserved slot is already deducted from it
  // (Slot Reservation Lifecycle spec, Section 8).
  const slotsUnlimited = stats?.slots_unlimited ?? false;
  const remainingSlots = stats?.remaining_slots ?? null;
  const reservedSlots = stats?.reserved_slots ?? null;

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[#f8f9fc]">
      {/* Package Banner */}
      {subscription && subscription.days_remaining > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-6 pt-3">
          <div className="bg-amber-400 text-amber-900 px-4 py-1.5 rounded-full text-sm font-medium">
            {t("package.expires", { days: subscription.days_remaining })}
          </div>

          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-8"
          >
            {t("package.renew")}
          </Button>
        </div>
      )}

      <main className="p-4 sm:p-6 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t("header.title")}</h1>
            <p className="text-sm text-gray-500">{t("header.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5 bg-white">
              <Link href={`/${locale}/dashboard/business/analytics`}>
                <BarChart3 className="h-4 w-4" />
                {t("header.analytics")}
              </Link>
            </Button>
            {canCustomize && (
              <Button size="sm" className="gap-1.5" onClick={() => setCustomizeOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" />
                {t("customize.button")}
              </Button>
            )}
          </div>
        </div>

        {/* Metrics */}
        {statsLoading ? (
          <div className="flex h-24 items-center justify-center" role="status">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : stats && (
          <div className="flex flex-wrap gap-4">
            <MetricCard
              title={t("metrics.evaluationsCompleted")}
              value={stats.completed_evaluations.toString()}
              change={t("metrics.changes.totalEvaluations", { value: stats.total_evaluations })}
              changeType="neutral"
              icon="clipboard"
            />

            <MetricCard
              title={t("metrics.activeCandidates")}
              value={stats.total_candidates.toString()}
              change={t("metrics.changes.evalsPerCandidate", { value: evalsPerCandidate })}
              changeType="neutral"
              icon="users"
              highlight
            />

            <MetricCard
              title={t("metrics.certificatesIssued")}
              value={stats.certificates_issued.toString()}
              change={t("metrics.changes.certifiedRate", { value: certifiedRate })}
              changeType="neutral"
              icon="certificate"
            />

            <MetricCard
              title={t("metrics.teamMembers")}
              value={stats.team_members_count.toString()}
              change={t("metrics.changes.activeTeam")}
              changeType="neutral"
              icon="users"
            />

            <MetricCard
              title={t("metrics.assessmentSlots")}
              value={slotsUnlimited ? "∞" : remainingSlots !== null ? remainingSlots.toString() : "—"}
              change={
                slotsUnlimited
                  ? t("metrics.changes.unlimitedPlan")
                  : reservedSlots
                    ? t("metrics.changes.reservedForUpcoming", { value: reservedSlots })
                    : remainingSlots !== null
                      ? t("metrics.changes.noneReserved")
                      : t("metrics.changes.noActivePlan")
              }
              changeType="neutral"
              icon="coins"
            />

            <MetricCard
              title={t("metrics.successRate")}
              value={stats.completed_evaluations > 0 ? `${stats.success_rate}%` : "—"}
              change={t("metrics.changes.basedOnEvaluations", { value: stats.completed_evaluations })}
              changeType="neutral"
              icon="trending"
            />

            {/* Critical Alert - Show only when there's real evaluation data behind the rate */}
            {stats.completed_evaluations > 0 && stats.success_rate < 50 && (
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

        {/* Widgets */}
        {!layoutReady ? (
          <div className="flex h-48 items-center justify-center" role="status">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : widgets.length > 0 ? (
          <WidgetGrid widgets={widgets} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
            <LayoutGrid className="h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">{t("emptyLayout.title")}</p>
            <p className="max-w-md text-sm text-gray-500">{t("emptyLayout.description")}</p>
            {canCustomize && (
              <Button size="sm" className="mt-1 gap-1.5" onClick={() => setCustomizeOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" />
                {t("customize.button")}
              </Button>
            )}
          </div>
        )}
      </main>

      {canCustomize && (
        <CustomizeDashboardDialog
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
          widgets={widgets}
          onSave={saveLayout}
          onReset={resetLayout}
        />
      )}
    </div>
  );
}
