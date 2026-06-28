// app/dashboard/indivisual/overview/components/time-range-chart.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "next-intl"
import { useState } from "react"
import type { EvaluationTimeRange } from "@/app/api/dashboard/b2c/types"

interface TimeRangeChartProps {
  data: EvaluationTimeRange[]
}

export function TimeRangeChart({ data }: TimeRangeChartProps) {
  const t = useTranslations("dashboard.indivisual.timeRange")
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly")

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm sm:text-base">
            {t("title")}
          </CardTitle>

          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList className="h-8 grid grid-cols-3">
              <TabsTrigger value="monthly" className="text-xs">
                {t("tabs.monthly")}
              </TabsTrigger>
              <TabsTrigger value="quarterly" className="text-xs">
                {t("tabs.quarterly")}
              </TabsTrigger>
              <TabsTrigger value="yearly" className="text-xs">
                {t("tabs.yearly")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
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