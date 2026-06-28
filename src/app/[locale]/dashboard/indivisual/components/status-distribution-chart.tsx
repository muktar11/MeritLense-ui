// app/dashboard/indivisual/overview/components/status-distribution-chart.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { useTranslations } from "next-intl"
import type { EvaluationStatusDistribution } from "@/app/api/dashboard/b2c/types"

interface StatusDistributionChartProps {
  data: EvaluationStatusDistribution[]
}

const COLORS = {
  COMPLETED: "#10b981",
  SCHEDULED: "#3b82f6",
  RESCHEDULED: "#f59e0b",
  CANCELLED: "#ef4444",
  NO_SHOW: "#6b7280"
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const t = useTranslations("dashboard.indivisual.statusDistribution")

  const chartData = data.map(item => ({
    name: item.status_display,
    value: item.count,
    color: COLORS[item.status as keyof typeof COLORS] || "#9ca3af"
  }))

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm sm:text-base">
          {t("title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center">
        <div className="w-full h-50">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
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

        <div className="mt-4 grid grid-cols-2 gap-2 w-full">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}