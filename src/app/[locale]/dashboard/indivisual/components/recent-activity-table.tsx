// app/dashboard/indivisual/overview/components/recent-activity-table.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyActivity } from "@/app/api/dashboard/b2c/types";

interface RecentActivityTableProps {
  activities: MonthlyActivity[];
}

export function RecentActivityTable({ activities }: RecentActivityTableProps) {
  const t = useTranslations("dashboard.indivisual.recentActivityTable");
  const locale = useLocale();

  return (
    <Card className="bg-white border-gray-100" dir={locale === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="hidden md:block overflow-x-auto">
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

        {/* Mobile: card list, same fields as the table above. */}
        <div className="md:hidden divide-y divide-gray-100">
          {activities.map((activity) => (
            <div key={activity.month} className="py-3">
              <p className="text-gray-900 font-medium">{activity.month}</p>
              <div className="mt-1 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">{t("columns.candidatesAdded")}</p>
                  <p className="text-gray-700">{activity.candidates_added}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("columns.evaluationsCompleted")}</p>
                  <p className="text-gray-700">{activity.evaluations_completed}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("columns.certificatesIssued")}</p>
                  <p className="text-gray-700">{activity.certificates_issued}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
