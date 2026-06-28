// app/dashboard/business/overview/components/recent-activity-table.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyActivity } from "@/app/api/dashboard/b2b/types";

interface RecentActivityTableProps {
  activities: MonthlyActivity[];
}

export function RecentActivityTable({ activities }: RecentActivityTableProps) {
  const t = useTranslations("dashboard.business.overview.recentActivity");
  const locale = useLocale();

  return (
    <Card className="bg-white border-gray-100" dir={locale === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left py-2 px-4 font-medium">{t("columns.month")}</th>
                <th className="text-left py-2 px-4 font-medium">{t("columns.candidatesAdded")}</th>
                <th className="text-left py-2 px-4 font-medium">{t("columns.evaluationsCompleted")}</th>
                <th className="text-left py-2 px-4 font-medium">{t("columns.certificatesIssued")}</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.month} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4 text-gray-900 font-medium">
                    {activity.month}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{activity.candidates_added}</td>
                  <td className="py-3 px-4 text-gray-600">{activity.evaluations_completed}</td>
                  <td className="py-3 px-4 text-gray-600">{activity.certificates_issued}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}