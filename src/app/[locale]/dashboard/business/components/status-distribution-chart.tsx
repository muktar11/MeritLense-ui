// app/dashboard/business/overview/components/status-distribution-chart.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { EvaluationStatusDistribution } from "@/app/api/dashboard/b2b/types";

interface StatusDistributionChartProps {
  data: EvaluationStatusDistribution[];
}

const COLORS = {
  COMPLETED: "#10b981",
  SCHEDULED: "#3b82f6",
  CANCELLED: "#ef4444",
  RESCHEDULED: "#f59e0b",
  NO_SHOW: "#6b7280"
};

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const t = useTranslations("dashboard.business.overview.statusDistribution");
  const locale = useLocale();

  const chartData = data.map(item => ({
    name: item.status_display,
    value: item.count,
    color: COLORS[item.status as keyof typeof COLORS] || "#9ca3af"
  }));

  return (
    <Card className="bg-white border-gray-100" dir={locale === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">
          {t("title")}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-full sm:w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col space-y-2">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600">{item.name}</span>
                <span className="text-gray-900 font-medium ml-auto">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}