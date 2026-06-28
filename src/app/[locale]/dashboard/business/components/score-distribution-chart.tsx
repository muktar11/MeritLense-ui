// app/dashboard/business/overview/components/score-distribution-chart.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface ScoreDistributionChartProps {
  data: Array<{ roleLabel: string; score: number }>;
}

export function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  const t = useTranslations("dashboard.business.score-distribution-chart");
  const locale = useLocale();

  return (
    <Card className="bg-white border-gray-100 shadow-sm" dir={locale === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-900">
          {t("title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="w-full h-64 sm:h-80 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <XAxis
                dataKey="roleLabel"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value?: number) => [
                  value != null ? `${value}%` : "0%",
                  t("score"),
                ]}
              />
              <Bar
                dataKey="score"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}