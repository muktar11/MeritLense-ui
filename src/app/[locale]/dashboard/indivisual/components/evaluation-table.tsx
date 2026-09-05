"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Copy, Eye, Calendar, XCircle, CheckCircle, Edit, Mic, BarChart3, Video, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import TablePagination from "@/components/ui/table-pagination"
import type { EvaluationListItem, EvaluatorRating } from "@/app/api/evaluations/types"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

const PAGE_SIZE = 10

interface EvaluationTableProps {
  data: EvaluationListItem[]
  onViewDetails?: (evaluation: EvaluationListItem) => void
  onEdit?: (evaluation: EvaluationListItem) => void
  onComplete?: (evaluation: EvaluationListItem) => void
  onCancel?: (evaluation: EvaluationListItem) => void
  onReschedule?: (evaluation: EvaluationListItem) => void
  onStartSession?: (evaluation: EvaluationListItem) => void
  onViewResults?: (evaluation: EvaluationListItem) => void
  userRole?: string
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-700'
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-700'
    case 'RESCHEDULED':
      return 'bg-yellow-100 text-yellow-700'
    case 'CANCELLED':
      return 'bg-red-100 text-red-700'
    case 'NO_SHOW':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const STATUS_KEYS: Record<string, string> = {
  COMPLETED: 'completed',
  SCHEDULED: 'scheduled',
  RESCHEDULED: 'rescheduled',
  CANCELLED: 'cancelled',
  NO_SHOW: 'noShow',
  IN_PROGRESS: 'inProgress',
}

const TYPE_KEYS: Record<string, string> = {
  INTERVIEW: 'interview',
  TECHNICAL_TEST: 'technicalTest',
  ASSESSMENT: 'assessment',
  LANGUAGE_PROFICIENCY: 'languageProficiency',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// The full per-pool breakdown (Safety/Hygiene/Communication/Task/Behavioral)
// is already shown in the "View Details" modal via EvaluatorRatingCard -
// the table just needs a single at-a-glance number, so it averages the 5
// approved dimensions the same way the backend's headline score does (see
// EvaluationReportService._derive_authoritative_score) - psych_professional
// (not an approved dimension) and consistency (a reliability metric, not a
// competency) are excluded. hygiene/communication can be null on ratings
// submitted before those dimensions were collected; skipped rather than
// producing NaN.
function averageEvaluatorRating(rating: EvaluatorRating): number {
  const { safety_awareness, hygiene, communication, task_execution, behavior_integrity } = rating
  const scores = [safety_awareness, hygiene, communication, task_execution, behavior_integrity].filter(
    (value): value is number => value !== null && value !== undefined
  )
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
}

export default function EvaluationTable({
  data,
  onViewDetails,
  onEdit,
  onComplete,
  onCancel,
  onReschedule,
  onStartSession,
  onViewResults,
  userRole = 'B2C'
}: EvaluationTableProps) {
  const t = useTranslations("dashboard.indivisual.evaluations.table")
  const tStatus = useTranslations("dashboard.indivisual.evaluationManagement.status")
  const tType = useTranslations("dashboard.indivisual.evaluationManagement.types")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()
  const locale = useLocale()

  // Upstream filters/search (in the parent page) replace `data` wholesale -
  // snap back to page 1 rather than showing a now out-of-range page. Adjusted
  // during render (not an Effect) per https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevData, setPrevData] = useState(data)
  if (data !== prevData) {
    setPrevData(data)
    setCurrentPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedData = data.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleJoinLiveInterview = (evaluation: EvaluationListItem) => {
    if (!evaluation.session_id) return
    router.push(`/${locale}/dashboard/indivisual/live-call?sessionId=${evaluation.session_id}`)
  }

  const handleCopyMeetingLink = async (evaluation: EvaluationListItem) => {
    if (!evaluation.meeting_link) return
    await navigator.clipboard.writeText(evaluation.meeting_link)
    setCopiedId(evaluation.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const canManage = userRole === 'B2B' || userRole === 'B2C'
  const canEdit = userRole !== 'B2B_TEAM_MEMBER'

  return (
    <div>
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("headers.candidate")}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("headers.evaluationType")}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("headers.status")}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("headers.scheduledDate")}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("headers.duration")}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("headers.score")}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("headers.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-gray-500">
                {t("noEvaluations")}
              </td>
            </tr>
          ) : (
            paginatedData.map((item) => {
              const canEditRow = canEdit && (item.status === 'SCHEDULED' || item.status === 'RESCHEDULED')
              const canRescheduleRow = canManage && item.status === 'SCHEDULED'
              const canCompleteRow = canManage && (item.status === 'SCHEDULED' || item.status === 'RESCHEDULED')
              const canCancelRow = canManage && (item.status === 'SCHEDULED' || item.status === 'RESCHEDULED')
              const canStartSessionRow = !!onStartSession && item.status !== 'CANCELLED' && !item.session_id
              const hasMoreActions = canEditRow || canRescheduleRow || canCompleteRow || canCancelRow || canStartSessionRow

              return (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {getInitials(item.candidate_name)}
                    </div>
                    <span className="font-medium text-gray-900">{item.candidate_name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-600">
                  {TYPE_KEYS[item.evaluation_type] ? tType(TYPE_KEYS[item.evaluation_type]) : item.evaluation_type_display}
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(item.status)}`}>
                    {STATUS_KEYS[item.status] ? tStatus(STATUS_KEYS[item.status]) : item.status_display}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-600">
                  {format(new Date(item.scheduled_date), 'MMM d, yyyy h:mm a', locale === 'ar' ? { locale: ar } : undefined)}
                </td>
                <td className="py-4 px-4 text-gray-600">{t("durationMinutes", { value: item.duration_minutes })}</td>
                <td className="py-4 px-4 text-gray-600">
                  {item.assessment_mode === 'SCHEDULED_INTERVIEW' ? (
                    item.evaluator_rating ? (
                      <span
                        className="font-semibold text-gray-900"
                        title={t("scoreTooltip")}
                      >
                        {averageEvaluatorRating(item.evaluator_rating)}%
                      </span>
                    ) : '-'
                  ) : item.score !== null && item.score !== undefined ? `${item.score}%` : '-'}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewDetails?.(item)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-purple-600"
                      title={t("actions.viewDetails")}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {onViewResults && item.status === 'COMPLETED' && item.assessment_mode === 'AI_INTERVIEW' && (
                      <button
                        onClick={() => onViewResults(item)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-purple-600"
                        title={t("actions.viewAiResults")}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    )}

                    {item.evaluation_type === 'INTERVIEW' &&
                      item.session_id &&
                      ['SCHEDULED', 'RESCHEDULED', 'IN_PROGRESS'].includes(item.status) && (
                        <button
                          onClick={() => handleJoinLiveInterview(item)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-purple-600"
                          title={t("actions.joinInterview")}
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      )}

                    {(item.status === 'SCHEDULED' || item.status === 'RESCHEDULED') && item.meeting_link && (
                      <button
                        onClick={() => handleCopyMeetingLink(item)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700"
                        title={item.evaluation_type === 'INTERVIEW' ? t("actions.copyAccessLink") : t("actions.copyMeetingLink")}
                      >
                        {copiedId === item.id ? (
                          <span className="text-xs text-green-600">{t("actions.copied")}</span>
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {hasMoreActions && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700"
                            title={t("actions.moreActions")}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditRow && (
                            <DropdownMenuItem onClick={() => onEdit?.(item)}>
                              <Edit className="w-4 h-4 mr-2" />
                              {t("actions.edit")}
                            </DropdownMenuItem>
                          )}
                          {canRescheduleRow && (
                            <DropdownMenuItem onClick={() => onReschedule?.(item)}>
                              <Calendar className="w-4 h-4 mr-2" />
                              {t("actions.reschedule")}
                            </DropdownMenuItem>
                          )}
                          {canCompleteRow && (
                            <DropdownMenuItem onClick={() => onComplete?.(item)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {t("actions.markComplete")}
                            </DropdownMenuItem>
                          )}
                          {canStartSessionRow && (
                            // Hidden once an AI interview session already exists for this
                            // evaluation (item.session_id set - auto-linked when an
                            // INTERVIEW-type evaluation is scheduled) - this opens the
                            // separate ad-hoc "Start AI Interview Session" flow, which
                            // would otherwise create a second, unrelated session for the
                            // same candidate.
                            <DropdownMenuItem onClick={() => onStartSession?.(item)}>
                              <Mic className="w-4 h-4 mr-2" />
                              {t("actions.startAiInterview")}
                            </DropdownMenuItem>
                          )}
                          {canCancelRow && (
                            <DropdownMenuItem onClick={() => onCancel?.(item)} variant="destructive">
                              <XCircle className="w-4 h-4 mr-2" />
                              {t("actions.cancel")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </td>
              </tr>
              )
            })
          )}
        </tbody>
      </table>
      </div>

      {data.length > 0 && (
        <TablePagination
          currentPage={safePage}
          totalItems={data.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemLabel={t("itemLabelPlural")}
        />
      )}
    </div>
  )
}
