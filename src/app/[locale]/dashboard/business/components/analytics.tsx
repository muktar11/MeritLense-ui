"use client";

import { useLocale, useTranslations } from "next-intl";
import { OPTIONAL_WIDGETS, WidgetGrid, type WidgetId } from "./widgets/widget-registry";

// Every statistical view in one place, regardless of what the company
// chose to pin on its overview dashboard. The operational widgets
// (Requires Attention, Recent Evaluations) stay on the overview.
const ANALYTICS_WIDGETS: readonly WidgetId[] = [
  "readiness_index",
  "evaluation_status",
  "evaluation_trend",
  ...OPTIONAL_WIDGETS,
];

export function Analytics() {
  const t = useTranslations("dashboard.business.analytics");
  const locale = useLocale();

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[#f8f9fc]">
      <main className="p-4 sm:p-6 md:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <WidgetGrid widgets={ANALYTICS_WIDGETS} />
      </main>
    </div>
  );
}
