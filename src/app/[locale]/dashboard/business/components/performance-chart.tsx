// app/dashboard/business/overview/components/performance-chart.tsx
"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface PerformanceChartProps {
  data: Array<{ month: string; value: number }>;
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const t = useTranslations("dashboard.business.overview.performanceChart");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<"users" | "projects" | "operatingStatus">("users");

  return (
    <Card className="bg-white border-gray-100" dir={locale === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-sm md:text-base font-semibold text-gray-900">
            {t("title")}
          </CardTitle>

          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            {["users", "projects", "operatingStatus"].map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t(`tabs.${key}`)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-4">
        <div className="w-full h-50 sm:h-37.5 md:h-30">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="month"
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
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#performanceGradient)"
                name={t("tooltip.score")}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}