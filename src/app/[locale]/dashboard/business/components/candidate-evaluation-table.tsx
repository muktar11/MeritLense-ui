// app/dashboard/business/overview/components/candidate-evaluation-table.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, ChevronDown, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { RecentEvaluation } from "@/app/api/dashboard/b2b/types";
import { format } from "date-fns";

interface CandidateEvaluationTableProps {
  evaluations: RecentEvaluation[];
  searchTerm?: string;
}

export function CandidateEvaluationTable({ evaluations, searchTerm = "" }: CandidateEvaluationTableProps) {
  const t = useTranslations("dashboard.business.overview.candidateEvaluation");
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const filteredEvaluations = evaluations.filter(evaluation => 
    evaluation.candidate_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEvaluations.length / rowsPerPage);
  const paginatedEvaluations = filteredEvaluations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="bg-white border-gray-100" dir={locale === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                {[
                  "candidate",
                  "evaluationType",
                  "status",
                  "score",
                  "scheduledDate",
                  "actions",
                ].map((col) => (
                  <th key={col} className="text-left py-2 px-2 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {t(`columns.${col}`)}
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedEvaluations.length > 0 ? (
                paginatedEvaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2 min-w-30">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-xs bg-blue-100">
                            {getInitials(evaluation.candidate_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-700">{evaluation.candidate_name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-gray-600">
                      {evaluation.evaluation_type_display}
                    </td>
                    <td className="py-2 px-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(evaluation.status)}`}>
                        {evaluation.status_display}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-medium">
                      {evaluation.score ? `${evaluation.score}%` : '-'}
                    </td>
                    <td className="py-2 px-2 text-gray-600">
                      {format(new Date(evaluation.scheduled_date), 'MMM d, yyyy')}
                    </td>
                    <td className="py-2 px-2">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No recent evaluations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredEvaluations.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-2 sm:gap-0 text-xs text-gray-500">
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 hover:bg-gray-100 rounded border border-gray-200 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 py-1 border border-gray-200 rounded">{currentPage}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 hover:bg-gray-100 rounded border border-gray-200 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span>{t("pagination.rowsPerPage")}</span>
              <select 
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="border border-gray-200 rounded px-2 py-1 text-xs bg-white"
              >
                <option value={8}>8</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}