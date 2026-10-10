"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  ReadinessIndexWidget,
  EvaluationStatusWidget,
  SystemLoadWidget,
  UserGrowthWidget,
  EvaluationTypesWidget,
  UserTypeWidget,
  PackageContributionWidget,
  GeographicWidget,
  RevenueTrendWidget,
} from "../components/admin-charts"

// Admin/Superadmin Analytics & Insights: every platform-wide chart in one
// place - the overview's charts plus readiness, evaluation status, user
// types and companies by country.
export default function AdminAnalyticsPage() {
  const t = useTranslations("dashboard.admin.analytics")
  const locale = useLocale()

  return (
    <main dir={locale === "ar" ? "rtl" : "ltr"} className="flex-1 overflow-auto bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 [&>*]:min-w-0">
          <ReadinessIndexWidget />
          <EvaluationStatusWidget />
          <SystemLoadWidget />
          <UserGrowthWidget />
          <EvaluationTypesWidget />
          <UserTypeWidget />
          <PackageContributionWidget />
          <GeographicWidget />
        </div>

        <RevenueTrendWidget />
      </div>
    </main>
  )
}
