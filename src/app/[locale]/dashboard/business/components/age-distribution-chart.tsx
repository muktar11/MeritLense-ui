"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const rawData = [
  { key: "age_18_25", accepted: 45, rejected: 22 },
  { key: "age_26_35", accepted: 28, rejected: 15 },
  { key: "appearance_4_6", accepted: 32, rejected: 18 },
  { key: "work_attitude_intermediate", accepted: 20, rejected: 12 },
];

const tabKeys = ["age", "nationality", "experience"] as const;

export function AgeDistributionChart() {
  const [activeTab, setActiveTab] = useState<(typeof tabKeys)[number]>("age");
  const t = useTranslations("dashboard.business.ageDistributionChart");
  const locale = useLocale();

  const data = rawData.map((item) => ({
    category: t(`categories.${item.key}.label`),
    shortLabel: t(`categories.${item.key}.short`),
    accepted: item.accepted,
    rejected: item.rejected,
  }));

  return (
    <Card
      className="bg-white border-gray-100 shadow-sm"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <CardHeader className="pb-2 pt-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0">
          {/* Tabs */}
          <div className="flex flex-row sm:flex-col gap-1 text-xs flex-wrap">
            {tabKeys.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-0.5 rounded text-left ${
                  activeTab === tab
                    ? "text-gray-900 font-medium"
                    : "text-gray-400"
                }`}
              >
                {t(`tabs.${tab}`)}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-gray-600">{t("legend.accepted")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-200" />
              <span className="text-gray-600">{t("legend.rejected")}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="w-full h-64 sm:h-72 md:h-80 lg:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 30 }}
              barGap={4}
            >
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                height={50}
              />

              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                domain={[0, 50]}
              />

              <Tooltip
                formatter={(value: number | undefined, name?: string) => [
                  value?.toLocaleString() ?? 0,
                  name ? t(`legend.${name}`) : "",
                ]}
                labelFormatter={(label) => label}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />

              <Bar
                dataKey="accepted"
                fill="#3b82f6"
                radius={[3, 3, 0, 0]}
                barSize={18} // smaller for mobile
              />
              <Bar
                dataKey="rejected"
                fill="#bfdbfe"
                radius={[3, 3, 0, 0]}
                barSize={18} // smaller for mobile
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
