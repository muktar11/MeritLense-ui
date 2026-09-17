"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import b2bDashboardService from "@/app/api/dashboard/b2b/endpoints";
import type { DashboardStats } from "@/app/api/dashboard/b2b/types";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { MetricCard } from "./metric-card";

// Surfaces the same real entitlement ledger (EntitlementService) the
// dashboard overview's "Assessment Slots" card uses - not the older,
// separate Subscription.feature_limits/current_usage system, which never
// reflects slot/points purchases (see indivisual dashboard's own comment
// on why that system was rejected there).
export function UsageSummary() {
  const t = useTranslations("dashboard.indivisual.payment.usageSection");
  const { subscription } = useSubscription();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await b2bDashboardService.getStats();
        if (active) setStats(data);
      } catch {
        // Usage is supplementary context on this page - fail silently and
        // just show the plan grid below without it.
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
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{t("title")}</h3>
        {subscription?.price_details?.name && (
          <span className="text-xs text-gray-500">
            {t("currentPlanLabel")}: <span className="font-medium text-gray-700">{subscription.price_details.name}</span>
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <MetricCard
          title={t("completedAiInterviews")}
          value={stats.completed_ai_interviews.toString()}
          change=""
          changeType="neutral"
          icon="clipboard"
        />
        <MetricCard
          title={t("completedScheduledAssessments")}
          value={stats.completed_scheduled_assessments.toString()}
          change=""
          changeType="neutral"
          icon="certificate"
        />
        <MetricCard
          title={t("assessmentSlotsTitle")}
          value={slotsValue}
          change={slotsChange}
          changeType={!slotsUnlimited && remainingSlots !== null && remainingSlots <= 0 ? "negative" : "neutral"}
          icon="coins"
        />
        <MetricCard
          title={t("pointsTitle")}
          value={pointsValue}
          change=""
          changeType="neutral"
          icon="trending"
        />
      </div>
    </div>
  );
}
