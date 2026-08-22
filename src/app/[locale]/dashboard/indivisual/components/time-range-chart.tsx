// app/dashboard/indivisual/overview/components/time-range-chart.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useTranslations } from "next-intl"
import type { EvaluationTimeRange } from "@/app/api/dashboard/b2c/types"

interface TimeRangeChartProps {
  data: EvaluationTimeRange[]
}

export function TimeRangeChart({ data }: TimeRangeChartProps) {
  const t = useTranslations("dashboard.indivisual.timeRange")

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm sm:text-base">
          {t("title")}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="w-full h-45 sm:h-55 lg:h-65">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} tickMargin={8} />
              <YAxis tick={{ fontSize: 10 }} tickMargin={8} />
              <Tooltip contentStyle={{ fontSize: "12px" }} />
              <Bar dataKey="count" fill="#9333ea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}