"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import b2cDashboardService from "@/app/api/dashboard/b2c/endpoints";
import type { DashboardStats } from "@/app/api/dashboard/b2c/types";
import { MetricCard } from "./metric-card";

// Surfaces the real entitlement ledger (EntitlementService, via
// DashboardStats) rather than the older Subscription.feature_limits/
// current_usage system the "Remaining This Period" card above uses - that
// system only reflects a recurring subscription and shows nothing for a
// B2C account that only ever bought one-time slot/points packages, which
// is the common case here. Rendered unconditionally so those accounts
// still see what they actually have left.
export function UsageSummary() {
  const t = useTranslations("dashboard.indivisual.payment.usageSection");
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await b2cDashboardService.getStats();
        if (active) setStats(data);
      } catch {
        // Usage is supplementary context on this page - fail silently.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!stats) return null;

  const slotsUnlimited = stats.slots_unlimited;
  const remainingSlots = stats.remaining_slots;
  const reservedSlots = stats.reserved_slots;
  const pointsUnlimited = stats.points_unlimited;
  const remainingPoints = stats.remaining_points;

  const slotsValue = slotsUnlimited
    ? t("unlimitedValue")
    : remainingSlots !== null
      ? t("slotsRemainingOfLimit", { remaining: remainingSlots, limit: stats.slot_limit ?? remainingSlots })
      : t("notAvailableShort");

  const slotsChange = slotsUnlimited
    ? t("moreAssessmentsUnlimited")
    : reservedSlots
      ? t("slotsReservedNote", { count: reservedSlots })
      : remainingSlots !== null && remainingSlots <= 0
        ? t("noAssessmentsRemaining")
        : remainingSlots !== null
          ? (remainingSlots === 1
              ? t("moreAssessmentsAvailable", { count: remainingSlots })
              : t("moreAssessmentsAvailablePlural", { count: remainingSlots }))
          : t("noActivePlan");

  const pointsValue = pointsUnlimited
    ? t("unlimitedValue")
    : remainingPoints !== null
      ? t("pointsRemainingOfLimit", { remaining: remainingPoints, limit: stats.points_limit ?? remainingPoints })
      : t("notAvailableShort");

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("title")}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard title={t("completedAiInterviews")} value={stats.completed_ai_interviews.toString()} change="" icon="🎤" />
        <MetricCard title={t("completedScheduledAssessments")} value={stats.completed_scheduled_assessments.toString()} change="" icon="📅" />
        <MetricCard title={t("assessmentSlotsTitle")} value={slotsValue} change={slotsChange} icon="🎟️" />
        <MetricCard title={t("pointsTitle")} value={pointsValue} change="" icon="🪙" />
      </div>
    </div>
  );
}
