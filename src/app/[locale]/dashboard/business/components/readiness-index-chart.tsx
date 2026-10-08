// app/dashboard/business/overview/components/readiness-index-chart.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { ReadinessDistribution, ReadinessStatus } from "@/app/api/dashboard/b2b/types";

interface ReadinessIndexChartProps {
  data: ReadinessDistribution;
}

const COLORS: Record<ReadinessStatus, string> = {
  READY: "#10b981",
  PARTIALLY_READY: "#f59e0b",
  NOT_READY: "#ef4444",
  INCOMPLETE: "#94a3b8",
  PENDING: "#cbd5e1",
};

// Completed evaluations by their actual readiness outcome (Ready /
// Partially Ready / Not Ready / Insufficient Evidence) - including any
// recorded readiness correction - rather than by evaluation status.
export function ReadinessIndexChart({ data }: ReadinessIndexChartProps) {
  const t = useTranslations("dashboard.business.readinessIndexChart");
  const locale = useLocale();

  // PENDING only shows up while a result is still being produced - hide it
  // when empty so the legend stays focused on actual outcomes.
  const rows = data.distribution
    .filter((row) => row.status !== "PENDING" || row.count > 0)
    .map((row) => ({
      key: row.status,
      name: t(`status.${row.status}`),
      value: row.count,
      color: COLORS[row.status] ?? "#9ca3af",
    }));
  const hasData = data.total > 0;

  return (
    <Card className="bg-white border-gray-100 h-full" dir={locale === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">{t("title")}</CardTitle>
      </CardHeader>

      <CardContent>
        {hasData ? (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rows.filter((row) => row.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {rows.filter((row) => row.value > 0).map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {data.ready_rate !== null ? `${Math.round(data.ready_rate)}%` : "—"}
                </span>
                <span className="text-[11px] text-gray-500">{t("readyRate")}</span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2.5">
              {rows.map((item) => (
                <div key={item.key} className="flex items-center gap-2 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                  <span className="text-gray-900 font-semibold ms-auto">{item.value}</span>
                </div>
              ))}
              <p className="pt-1 text-xs text-gray-400">{t("basedOn", { count: data.total })}</p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-40 items-center justify-center text-center text-sm text-gray-500">
            {t("empty")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
