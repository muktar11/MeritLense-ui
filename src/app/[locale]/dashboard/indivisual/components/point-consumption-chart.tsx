// app/dashboard/indivisual/overview/components/point-consumption-chart.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { useTranslations } from "next-intl"
import type { JobRoleDistribution } from "@/app/api/dashboard/b2c/types"

interface PointConsumptionChartProps {
  data: JobRoleDistribution[]
}

const COLORS = ["#9333ea", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#14b8a6", "#8b5cf6"]

export function PointConsumptionChart({ data }: PointConsumptionChartProps) {
  const t = useTranslations("dashboard.indivisual.pointConsumption")

  // Filter out items with zero count and sort by count descending
  const validData = data?.filter(item => item.count > 0) || []
  
  const chartData = validData.map(item => ({
    nameKey: item.job_role,
    name: item.job_role_display,
    value: item.count
  }))

  // If no valid data, show empty state
  if (chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">No job role data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm sm:text-base">
          {t("title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center">
        <div className="w-full h-50 sm:h-55 lg:h-60">
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
                label={({ name, percent }) => percent !== undefined && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xs">
          {chartData.map((item, index) => (
            <div key={item.nameKey} className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-muted-foreground truncate">{item.name}</span>
              <span className="font-medium ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}