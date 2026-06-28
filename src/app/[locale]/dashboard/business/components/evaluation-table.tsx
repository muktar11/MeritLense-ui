"use client"

import { useState } from "react"
import { Copy, Eye, Calendar, XCircle, CheckCircle, Edit } from "lucide-react"
import type { EvaluationListItem } from "@/app/api/evaluations/types"
import { format } from "date-fns"

interface EvaluationTableProps {
  data: EvaluationListItem[]
  onViewDetails?: (evaluation: EvaluationListItem) => void
  onEdit?: (evaluation: EvaluationListItem) => void
  onComplete?: (evaluation: EvaluationListItem) => void
  onCancel?: (evaluation: EvaluationListItem) => void
  onReschedule?: (evaluation: EvaluationListItem) => void
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

export default function EvaluationTable({ 
  data, 
  onViewDetails,
  onEdit,
  onComplete,
  onCancel,
  onReschedule,
  userRole = 'B2C'
}: EvaluationTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyMeetingLink = async (evaluation: EvaluationListItem) => {
    setCopiedId(evaluation.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const canManage = userRole === 'B2B' || userRole === 'B2C'
  const canEdit = userRole !== 'B2B_TEAM_MEMBER'

  return (
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
            data.map((item) => (
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
                  {item.score ? `${item.score}%` : '-'}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDetails?.(item)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-purple-600"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {canEdit && (item.status === 'SCHEDULED' || item.status === 'RESCHEDULED') && (
                      <button
                        onClick={() => onEdit?.(item)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    
                    {canManage && item.status === 'SCHEDULED' && (
                      <button
                        onClick={() => onReschedule?.(item)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-yellow-600"
                        title="Reschedule"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    )}
                    
                    {canManage && (item.status === 'SCHEDULED' || item.status === 'RESCHEDULED') && (
                      <button
                        onClick={() => onComplete?.(item)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-green-600"
                        title="Mark Complete"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    
                    {canManage && (item.status === 'SCHEDULED' || item.status === 'RESCHEDULED') && (
                      <button
                        onClick={() => onCancel?.(item)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-red-600"
                        title="Cancel"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    
                    {(item.status === 'SCHEDULED' || item.status === 'RESCHEDULED') && (
                      <button
                        onClick={() => handleCopyMeetingLink(item)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700"
                        title="Copy Meeting Link"
                      >
                        {copiedId === item.id ? (
                          <span className="text-xs text-green-600">Copied!</span>
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}