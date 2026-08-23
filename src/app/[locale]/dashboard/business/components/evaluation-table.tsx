"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// The full per-pool breakdown (Safety/Behavior/Psych/Task/Consistency) is
// already shown in the "View Details" modal via EvaluatorRatingCard - the
// table just needs a single at-a-glance number, so it averages the 5 pools
// instead of repeating the whole breakdown grid in every row.
function averageEvaluatorRating(rating: EvaluatorRating): number {
  const { safety_awareness, behavior_integrity, psych_professional, task_execution, consistency } = rating
  return Math.round((safety_awareness + behavior_integrity + psych_professional + task_execution + consistency) / 5)
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
    router.push(`/${locale}/dashboard/business/live-call?sessionId=${evaluation.session_id}`)
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
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Candidate</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Evaluation Type</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Scheduled Date</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Duration</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-gray-500">
                No evaluations found
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
                <td className="py-4 px-4 text-gray-600">{item.evaluation_type_display}</td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(item.status)}`}>
                    {item.status_display}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-600">
                  {format(new Date(item.scheduled_date), 'MMM d, yyyy h:mm a')}
                </td>
                <td className="py-4 px-4 text-gray-600">{item.duration_minutes} min</td>
                <td className="py-4 px-4 text-gray-600">
                  {item.assessment_mode === 'SCHEDULED_INTERVIEW' ? (
                    item.evaluator_rating ? (
                      <span
                        className="font-semibold text-gray-900"
                        title="Average of Safety, Behavior, Psych, Task and Consistency scores - see View Details for the full breakdown"
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
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {onViewResults && item.status === 'COMPLETED' && item.assessment_mode === 'AI_INTERVIEW' && (
                      <button
                        onClick={() => onViewResults(item)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-purple-600"
                        title="View AI Results"
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
                          title="Join Interview"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      )}

                    {(item.status === 'SCHEDULED' || item.status === 'RESCHEDULED') && item.meeting_link && (
                      <button
                        onClick={() => handleCopyMeetingLink(item)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700"
                        title={item.evaluation_type === 'INTERVIEW' ? "Copy Candidate Access Link" : "Copy Meeting Link"}
                      >
                        {copiedId === item.id ? (
                          <span className="text-xs text-green-600">Copied!</span>
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
                            title="More actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditRow && (
                            <DropdownMenuItem onClick={() => onEdit?.(item)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canRescheduleRow && (
                            <DropdownMenuItem onClick={() => onReschedule?.(item)}>
                              <Calendar className="w-4 h-4 mr-2" />
                              Reschedule
                            </DropdownMenuItem>
                          )}
                          {canCompleteRow && (
                            <DropdownMenuItem onClick={() => onComplete?.(item)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Complete
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
                              Start AI Interview
                            </DropdownMenuItem>
                          )}
                          {canCancelRow && (
                            <DropdownMenuItem onClick={() => onCancel?.(item)} variant="destructive">
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel
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
          itemLabel="evaluations"
        />
      )}
    </div>
  )
}
