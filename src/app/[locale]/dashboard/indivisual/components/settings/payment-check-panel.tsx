"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, RefreshCw, XCircle } from "lucide-react";
import paymentService, { type PaymentCheckResult } from "@/app/api/payments/endpoints";

// "Check payment" on the billing tabs (B2B and B2C): asks Stripe about the
// subscription's latest invoice and explains the result in plain words
// instead of showing raw data.
const KNOWN_STATUSES = new Set([
  "active", "trialing", "past_due", "incomplete", "incomplete_expired", "canceled", "unpaid", "paused",
  "draft", "open", "paid", "uncollectible", "void",
  "succeeded", "processing", "requires_payment_method", "requires_action", "requires_confirmation", "requires_capture",
]);
const KNOWN_ERRORS = new Set([
  "card_declined", "insufficient_funds", "expired_card", "incorrect_cvc", "incorrect_number",
  "processing_error", "authentication_required", "lost_card", "stolen_card", "do_not_honor", "generic_decline",
]);

type Outcome = "ok" | "attention" | "failed" | "none" | "error";

function outcomeOf(result: PaymentCheckResult | undefined): Outcome {
  if (!result) return "none";
  if ((result as { check_failed?: boolean }).check_failed) return "error";
  if (result.payment_intent_last_error) return "failed";
  if (result.invoice_status === "open" || result.stripe_status === "incomplete" || result.stripe_status === "past_due" || result.stripe_status === "unpaid") {
    return "attention";
  }
  return "ok";
}

export function PaymentCheckPanel({
  subscriptionId,
  onSync,
  syncing,
}: {
  subscriptionId: string | number | null | undefined;
  onSync: () => void;
  syncing: boolean;
}) {
  const t = useTranslations("dashboard.indivisual.settings.billing-tab.paymentCheck");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<PaymentCheckResult | undefined>();
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const check = async () => {
    setChecking(true);
    try {
      const results = await paymentService.checkPayment();
      const mine = results.find((r) => r.subscription_id === String(subscriptionId)) ?? results[0];
      setResult(mine);
      setOutcome(outcomeOf(mine));
    } catch (error) {
      console.error("Payment check failed:", error);
      setResult(undefined);
      setOutcome("error");
    } finally {
      setChecking(false);
    }
  };

  const statusLabel = (value: string | null) => (value && KNOWN_STATUSES.has(value) ? t(`statuses.${value}`) : value || t("notAvailable"));
  const errorCode = result?.payment_intent_last_error?.decline_code || result?.payment_intent_last_error?.code || "";
  const reason = KNOWN_ERRORS.has(errorCode) ? t(`errors.${errorCode}`) : t("errors.generic");

  const tone = {
    ok: "border-green-200 bg-green-50 text-green-800",
    attention: "border-amber-200 bg-amber-50 text-amber-800",
    failed: "border-red-200 bg-red-50 text-red-800",
    none: "border-gray-200 bg-gray-50 text-gray-700",
    error: "border-red-200 bg-red-50 text-red-800",
  } as const;
  const Icon = outcome === "ok" ? CheckCircle2 : outcome === "attention" ? AlertTriangle : outcome === "none" ? AlertTriangle : XCircle;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={check}
        disabled={!subscriptionId || checking}
        className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-3 py-1.5 text-sm text-white hover:bg-purple-600 disabled:opacity-60"
      >
        {checking && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("button")}
      </button>

      {outcome && (
        <div className={`rounded-lg border p-4 ${tone[outcome]}`} role="status">
          <p className="flex items-center gap-2 font-medium">
            <Icon className="h-5 w-5 shrink-0" />
            {t(`outcome.${outcome}`)}
          </p>
          {outcome === "failed" && <p className="mt-1 text-sm">{reason}</p>}
          {result && outcome !== "error" && (
            <dl className="mt-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-3">
              <div>
                <dt className="opacity-75">{t("subscription")}</dt>
                <dd className="font-medium">{statusLabel(result.stripe_status)}</dd>
              </div>
              <div>
                <dt className="opacity-75">{t("latestInvoice")}</dt>
                <dd className="font-medium">{statusLabel(result.invoice_status)}</dd>
              </div>
              <div>
                <dt className="opacity-75">{t("payment")}</dt>
                <dd className="font-medium">{statusLabel(result.payment_intent_status)}</dd>
              </div>
            </dl>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {(outcome === "attention" || outcome === "failed") && result?.hosted_invoice_url && (
              <a
                href={result.hosted_invoice_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
              >
                <ExternalLink className="h-4 w-4" /> {t("payInvoice")}
              </a>
            )}
            {outcome !== "none" && (
              <button
                type="button"
                onClick={onSync}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-current px-3 py-1.5 text-sm hover:bg-white/50 disabled:opacity-60"
              >
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {syncing ? t("syncing") : t("sync")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
