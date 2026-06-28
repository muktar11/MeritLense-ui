// app/dashboard/business/overview/components/language-distribution-chart.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface LanguageDistributionChartProps {
  data: Array<{ language: string; value: number }>;
}

export function LanguageDistributionChart({ data }: LanguageDistributionChartProps) {
  const t = useTranslations("dashboard.business.overview.languageDistributionChart");
  const locale = useLocale();

  return (
    <Card className="bg-white border-gray-100 shadow-sm" dir={locale === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">
          {t("title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="w-full h-40 sm:h-44 md:h-48 lg:h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
              barGap={6}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="language"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={60}
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
                  t("tooltip.usage"),
                ]}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}