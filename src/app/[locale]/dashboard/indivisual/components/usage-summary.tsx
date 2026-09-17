"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Info, AlertTriangle } from "lucide-react";
import b2cDashboardService from "@/app/api/dashboard/b2c/endpoints";
import type { DashboardStats } from "@/app/api/dashboard/b2c/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Surfaces the real entitlement ledger (EntitlementService, via
// DashboardStats) rather than the older Subscription.feature_limits/
// current_usage system the "Remaining This Period" card above uses - that
// system only reflects a recurring subscription and shows nothing for a
// B2C account that only ever bought one-time slot/points packages, which
// is the common case here. One compact info/warning banner, rendered
// unconditionally so those accounts still see what they actually have left.
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
    <Alert variant={outOfSlots ? "destructive" : "default"} className="max-w-2xl mx-auto mb-8">
      {outOfSlots ? <AlertTriangle /> : <Info />}
      <AlertTitle>{t("title")}</AlertTitle>
      <AlertDescription>
        <p>{parts.join(" · ")}</p>
        <p className={outOfSlots ? "font-medium" : undefined}>{moreText}</p>
      </AlertDescription>
    </Alert>
  );
}
