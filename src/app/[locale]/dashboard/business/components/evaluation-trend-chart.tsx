// app/dashboard/business/overview/components/evaluation-trend-chart.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { EvaluationTrend } from "@/app/api/dashboard/b2b/types";
import { format } from "date-fns";

interface EvaluationTrendChartProps {
  data: EvaluationTrend[];
}

export function EvaluationTrendChart({ data }: EvaluationTrendChartProps) {
  const t = useTranslations("dashboard.business.overview.evaluationTrend");
  const locale = useLocale();

  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'MMM d'),
    scheduled: item.scheduled_count,
    completed: item.completed_count,
    cancelled: item.cancelled_count
  }));

  return (
    <Card className="bg-white border-gray-100" dir={locale === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">
          {t("title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-2 sm:px-4">
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stackId="1"
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
                name={t("legend.completed")}
              />
              <Area 
                type="monotone" 
                dataKey="scheduled" 
                stackId="1"
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
                name={t("legend.scheduled")}
              />
              <Area 
                type="monotone" 
                dataKey="cancelled" 
                stackId="1"
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.3}
                name={t("legend.cancelled")}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}