"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Info, AlertTriangle } from "lucide-react";
import b2bDashboardService from "@/app/api/dashboard/b2b/endpoints";
import type { DashboardStats } from "@/app/api/dashboard/b2b/types";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { localizedPlanName } from "@/app/api/payments/types";
import paymentService from "@/app/api/payments/endpoints";

const SUBSCRIPTION_STATUS_KEYS: Record<string, string> = {
  ACTIVE: "active",
  PAST_DUE: "pastDue",
  CANCELED: "canceled",
  INCOMPLETE: "incomplete",
  INCOMPLETE_EXPIRED: "incompleteExpired",
  TRIALING: "trialing",
  UNPAID: "unpaid",
};

// Surfaces the same real entitlement ledger (EntitlementService) the
// dashboard overview's "Assessment Slots" card uses - not the older,
// separate Subscription.feature_limits/current_usage system, which never
// reflects slot/points purchases (see indivisual dashboard's own comment
// on why that system was rejected there). Own translation namespace
// (dashboard.business.payment.usageSection), not shared with the B2C
// component - the two previously read the same keys, which silently broke
// this component when the B2C side later dropped its Points line.
export function UsageSummary() {
  const t = useTranslations("dashboard.business.payment.usageSection");
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
  const consumedSlots = stats.consumed_slots;
  const outOfSlots = !slotsUnlimited && remainingSlots !== null && remainingSlots <= 0;

  const priceDetails = subscription?.price_details;
  const interval = priceDetails?.interval?.toLowerCase();
  const intervalWord = interval ? t(`intervalWords.${interval}`) : "";

  const allowanceText = slotsUnlimited
    ? t("unlimitedValue")
    : stats.slot_limit !== null
      ? t("monthlyAllowanceLabel", { limit: stats.slot_limit, interval: intervalWord })
      : t("notAvailableShort");

  const usageText =
    !slotsUnlimited && remainingSlots !== null && consumedSlots !== null
      ? t("usedOfRemaining", { used: consumedSlots, remaining: remainingSlots })
      : null;

  const moreText = slotsUnlimited
    ? t("moreAssessmentsUnlimited")
    : outOfSlots
      ? t("noAssessmentsRemaining")
      : remainingSlots !== null
        ? (remainingSlots === 1
            ? t("moreAssessmentsAvailable", { count: remainingSlots })
            : t("moreAssessmentsAvailablePlural", { count: remainingSlots }))
        : t("noActivePlan");

  const priceText = priceDetails
    ? `${paymentService.formatPrice(Number(priceDetails.unit_amount), priceDetails.currency)}/${intervalWord}`
    : null;

  const billingPeriodText =
    subscription?.current_period_start && subscription?.current_period_end
      ? t("billingPeriodRange", {
          start: new Date(subscription.current_period_start).toLocaleDateString(locale),
          end: new Date(subscription.current_period_end).toLocaleDateString(locale),
        })
      : null;

  const parts = [
    `${stats.completed_ai_interviews} ${t("completedAiInterviews")}`,
    `${stats.completed_scheduled_assessments} ${t("completedScheduledAssessments")}`,
    [priceText, `${t("assessmentSlotsTitle")}: ${allowanceText}`].filter(Boolean).join(" · "),
    [
      usageText,
      reservedSlots ? t("slotsReservedNote", { count: reservedSlots }) : null,
    ].filter(Boolean).join(" · "),
    [
      billingPeriodText ? `${t("billingPeriodLabel")}: ${billingPeriodText}` : null,
      subscription?.status && SUBSCRIPTION_STATUS_KEYS[subscription.status]
        ? `${t("statusLabel")}: ${t(`subscriptionStatus.${SUBSCRIPTION_STATUS_KEYS[subscription.status]}`)}`
        : null,
    ].filter(Boolean).join(" · "),
  ].filter(Boolean);

  return (
    <Alert variant={outOfSlots ? "destructive" : "default"} className="mb-8 max-w-3xl">
      {outOfSlots ? <AlertTriangle /> : <Info />}
      <AlertTitle>
        {t("title")}
        {priceDetails?.name ? ` — ${localizedPlanName(priceDetails.name, locale)}` : ""}
      </AlertTitle>
      <AlertDescription>
        {parts.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        <p className={outOfSlots ? "font-medium" : undefined}>{moreText}</p>
      </AlertDescription>
    </Alert>
  );
}
