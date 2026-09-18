"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Info, AlertTriangle } from "lucide-react";
import b2bDashboardService from "@/app/api/dashboard/b2b/endpoints";
import type { DashboardStats } from "@/app/api/dashboard/b2b/types";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { localizedPlanName } from "@/app/api/payments/types";

// Surfaces the same real entitlement ledger (EntitlementService) the
// dashboard overview's "Assessment Slots" card uses - not the older,
// separate Subscription.feature_limits/current_usage system, which never
// reflects slot/points purchases (see indivisual dashboard's own comment
// on why that system was rejected there). Deliberately one compact
// info/warning banner rather than a card grid - everything at a glance.
export function UsageSummary() {
  const t = useTranslations("dashboard.indivisual.payment.usageSection");
  const locale = useLocale();
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
  const outOfSlots = !slotsUnlimited && remainingSlots !== null && remainingSlots <= 0;

  const slotsText = slotsUnlimited
    ? t("unlimitedValue")
    : remainingSlots !== null
      ? t("slotsRemainingOfLimit", { remaining: remainingSlots, limit: stats.slot_limit ?? remainingSlots })
      : t("notAvailableShort");

  const pointsText = pointsUnlimited
    ? t("unlimitedValue")
    : remainingPoints !== null
      ? t("pointsRemainingOfLimit", { remaining: remainingPoints, limit: stats.points_limit ?? remainingPoints })
      : t("notAvailableShort");

  const moreText = slotsUnlimited
    ? t("moreAssessmentsUnlimited")
    : outOfSlots
      ? t("noAssessmentsRemaining")
      : remainingSlots !== null
        ? (remainingSlots === 1
            ? t("moreAssessmentsAvailable", { count: remainingSlots })
            : t("moreAssessmentsAvailablePlural", { count: remainingSlots }))
        : t("noActivePlan");

  const parts = [
    `${stats.completed_ai_interviews} ${t("completedAiInterviews")}`,
    `${stats.completed_scheduled_assessments} ${t("completedScheduledAssessments")}`,
    `${t("assessmentSlotsTitle")}: ${slotsText}${reservedSlots ? ` (${t("slotsReservedNote", { count: reservedSlots })})` : ""}`,
    `${t("pointsTitle")}: ${pointsText}`,
  ];

  return (
    <Alert variant={outOfSlots ? "destructive" : "default"} className="mb-8 max-w-3xl">
      {outOfSlots ? <AlertTriangle /> : <Info />}
      <AlertTitle>
        {t("title")}
        {subscription?.price_details?.name ? ` — ${localizedPlanName(subscription.price_details.name, locale)}` : ""}
      </AlertTitle>
      <AlertDescription>
        <p>{parts.join(" · ")}</p>
        <p className={outOfSlots ? "font-medium" : undefined}>{moreText}</p>
      </AlertDescription>
    </Alert>
  );
}
