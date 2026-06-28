// app/dashboard/indivisual/overview/components/evaluation-management.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Circle } from "lucide-react"
import { useTranslations } from "next-intl"
import type { RecentEvaluation } from "@/app/api/dashboard/b2c/types"
import { format } from "date-fns"

interface EvaluationManagementProps {
  evaluations: RecentEvaluation[]
  activeTab: "scheduled" | "inProgress" | "completed"
  onTabChange: (tab: "scheduled" | "inProgress" | "completed") => void
}

export function EvaluationManagement({ 
  evaluations, 
  activeTab, 
  onTabChange 
}: EvaluationManagementProps) {
  const t = useTranslations("dashboard.indivisual.evaluationManagement")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [languageFilter, setLanguageFilter] = useState<string>("")

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700'
      case 'SCHEDULED':
      case 'RESCHEDULED':
        return 'bg-blue-100 text-blue-700'
      case 'CANCELLED':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base">
            {t("title")}
          </CardTitle>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs h-8">
            {t("addBulkSchedule")}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="scheduled" className="text-xs">
              {t("tabs.scheduled")}
            </TabsTrigger>
            <TabsTrigger value="inProgress" className="text-xs">
              {t("tabs.inProgress")}
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              {t("tabs.completed")}
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs border rounded-lg bg-background"
            >
              <option value="">{t("filters.type")}</option>
              <option value="INTERVIEW">Interview</option>
              <option value="TECHNICAL_TEST">Technical Test</option>
              <option value="LANGUAGE_TEST">Language Test</option>
            </select>
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs border rounded-lg bg-background"
            >
              <option value="">{t("filters.role")}</option>
              <option value="HK">Housekeeper</option>
              <option value="EC">Elder Companion</option>
              <option value="NA">Nursing Assistant</option>
            </select>
            <select 
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs border rounded-lg bg-background"
            >
              <option value="">{t("filters.language")}</option>
              <option value="EN">English</option>
              <option value="ES">Spanish</option>
              <option value="AR">Arabic</option>
            </select>
          </div>

          <TabsContent value={activeTab} className="space-y-3">
            {evaluations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No evaluations found
              </div>
            ) : (
              evaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-purple-200 text-purple-700">
                        {getInitials(evaluation.candidate_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="text-xs space-y-1">
                      <p className="font-medium">
                        {evaluation.evaluation_type_display}
                      </p>
                      <p className="text-muted-foreground">
                        {evaluation.candidate_name} • {evaluation.scheduled_date ? format(new Date(evaluation.scheduled_date), 'MMM d') : 'No date'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(evaluation.status)}`}>
                      {evaluation.status_display}
                    </span>
                    {evaluation.score && (
                      <span className="text-xs font-medium">{evaluation.score}%</span>
                    )}
                    <Circle className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}