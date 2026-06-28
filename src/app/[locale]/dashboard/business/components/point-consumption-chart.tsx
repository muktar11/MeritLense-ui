"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const rawData = [
  { key: "cleaner", value: 30, color: "#3b82f6" },
  { key: "maintenance", value: 25, color: "#f59e0b" },
  { key: "companion", value: 20, color: "#10b981" },
  { key: "sales", value: 25, color: "#8b5cf6" },
];

export function PointConsumptionChart() {
  const t = useTranslations("dashboard.business.pointConsumptionChart");
  const locale = useLocale();

  const data = rawData.map((item) => ({
    ...item,
    name: t(`services.${item.key}`),
  }));

  return (
    <Card
      className="bg-white border-gray-100"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">
          {t("title")}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Pie chart */}
          <div className="w-full sm:w-1/2 h-64 sm:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={50} // smaller radius on mobile
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-col sm:flex-1 space-y-2 text-sm">
            {data.map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-gray-600">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
