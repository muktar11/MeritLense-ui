"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useTranslations } from "next-intl"
import b2cDashboardService from "@/app/api/dashboard/b2c/endpoints"
import type { CandidateComparison } from "@/app/api/dashboard/b2c/types"

export function CandidateComparison() {
  const t = useTranslations("dashboard.indivisual.candidateComparison")
  const [data, setData] = useState<CandidateComparison[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const comparisonData = await b2cDashboardService.getCandidateComparison()
      
      const validData = comparisonData
        ?.filter(item => item.average_score > 0)
        ?.sort((a, b) => b.average_score - a.average_score) || []
      
      setData(validData.slice(0, 10))
    } catch (error) {
      console.error('Failed to fetch candidate comparison:', error)
      setError('Failed to load comparison data')
    } finally {
      setLoading(false)
    }
  }

  const chartData = data.map(item => ({
    name: item.candidate_name.length > 15 
      ? item.candidate_name.substring(0, 12) + '...' 
      : item.candidate_name,
    fullName: item.candidate_name,
    score: Number(item.average_score) || 0,
    role: item.job_role
  }))

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading comparison data...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          No candidate comparison data available
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

      <CardContent>
        <div className="w-full h-75 sm:h-87.5 lg:h-100">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                interval={0}
                height={80}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value: number | undefined) => [`${value ?? 0}%`, t("averageScore")]}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload
                  return item?.fullName || label
                }}
                contentStyle={{ fontSize: "12px" }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: "12px" }}
              />
              <Bar
                dataKey="score"
                fill="#4f46e5"
                radius={[4, 4, 0, 0]}
                name={t("averageScore")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {data.length > 0 && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Showing top {data.length} candidates by average score
          </div>
        )}
      </CardContent>
    </Card>
  )
}