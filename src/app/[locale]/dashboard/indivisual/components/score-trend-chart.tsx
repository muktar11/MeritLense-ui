// app/dashboard/indivisual/overview/components/score-trend-chart.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useTranslations } from "next-intl"
import type { ScoreTrend } from "@/app/api/dashboard/b2c/types"

interface ScoreTrendChartProps {
  data: ScoreTrend[]
}

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const t = useTranslations("dashboard.indivisual.scoreTrend")

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm sm:text-base">
          {t("title")}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="w-full h-62.5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                interval={Math.ceil(data.length / 10)}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: number | undefined) => [`${value}%`, t("averageScore")]}
                contentStyle={{ fontSize: "12px" }}
              />
              <Line
                type="monotone"
                dataKey="avg_score"
                stroke="#9333ea"
                strokeWidth={2}
                dot={false}
                name={t("averageScore")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}