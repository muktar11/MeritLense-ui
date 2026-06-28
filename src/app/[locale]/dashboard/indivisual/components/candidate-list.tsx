// app/dashboard/indivisual/overview/components/candidate-list.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import type { RecentCandidate } from "@/app/api/dashboard/b2c/types"
import { format } from "date-fns"

interface CandidateListProps {
  candidates: RecentCandidate[]
  searchTerm?: string
}

export function CandidateList({ candidates, searchTerm = "" }: CandidateListProps) {
  const t = useTranslations("dashboard.indivisual.candidateList")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(5)

  const filteredCandidates = candidates.filter(candidate => 
    candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredCandidates.length / rowsPerPage)
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Desktop / Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left py-2 px-2">{t("table.name")}</th>
                <th className="text-left py-2 px-2">{t("table.role")}</th>
                <th className="text-left py-2 px-2">{t("table.evaluation")}</th>
                <th className="text-left py-2 px-2">{t("table.action")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCandidates.map((candidate) => (
                <tr key={candidate.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-xs">
                          {getInitials(candidate.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{candidate.full_name}</div>
                        <div className="text-xs text-muted-foreground">{candidate.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">{candidate.job_role}</td>
                  <td className="py-3 px-2 text-xs">
                    {candidate.last_evaluation_date 
                      ? format(new Date(candidate.last_evaluation_date), 'MMM d, yyyy')
                      : 'No evaluations'}
                  </td>
                  <td className="py-3 px-2">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-7">
                      {t("table.viewResults")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {paginatedCandidates.map((candidate) => (
            <div key={candidate.id} className="border rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(candidate.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{candidate.full_name}</p>
                  <p className="text-xs text-muted-foreground">{candidate.email}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {candidate.job_role}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs">
                  {candidate.last_evaluation_date 
                    ? format(new Date(candidate.last_evaluation_date), 'MMM d, yyyy')
                    : 'No evaluations'}
                </span>
                <Button size="sm" className="text-xs h-7">
                  {t("table.viewResults")}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {filteredCandidates.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-2 text-xs text-muted-foreground">
            <span>{t("pagination.rowsPerPage")} {rowsPerPage}</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 hover:bg-muted rounded disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>{currentPage}</span>
              <span>/</span>
              <span>{totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 hover:bg-muted rounded disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}