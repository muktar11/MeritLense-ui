import { Check, X } from "lucide-react";
import { planCoverageFlags } from "@/app/api/payments/types";

// A 4-line "what this plan actually includes" checklist for a plan card -
// Screening interviews, Full interviews, Certificate eligibility, and a
// transcript/employer report - each explicitly shown as included or not,
// rather than only listing what's included and leaving the rest implicit.
// Shared between the B2B and B2C plan-card renderers (business/plans-tab.tsx
// and indivisual/payment/page.tsx), which otherwise have no shared component
// tree - see planCoverageFlags for the underlying business rule.
export function PlanCoverageChecklist({
  t,
  coverage,
}: {
  // Only ever called with a plain key here (no interpolation values), so
  // this accepts next-intl's richer Translator type without needing to
  // match its full generic signature.
  t: (key: string) => string;
  coverage: ReturnType<typeof planCoverageFlags>;
}) {
  const rows: Array<{ included: boolean; label: string }> = [
    { included: coverage.hasScreening, label: t("plansGrid.screeningInterviews") },
    { included: coverage.hasFull, label: t("plansGrid.fullInterviews") },
    {
      included: coverage.hasCertificate,
      label: coverage.hasCertificate ? t("plansGrid.certificateIncluded") : t("plansGrid.certificateNotIncluded"),
    },
    { included: coverage.hasTranscript, label: t("plansGrid.transcriptIncluded") },
  ];

  return (
    <>
      {rows.map((row) => (
        <div key={row.label} className="flex items-start gap-2 sm:gap-3">
          {row.included ? (
            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0 mt-1" />
          ) : (
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 shrink-0 mt-1" />
          )}
          <span className={`text-xs sm:text-sm ${row.included ? "text-gray-700" : "text-gray-400"}`}>{row.label}</span>
        </div>
      ))}
    </>
  );
}
