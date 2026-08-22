// app/dashboard/indivisual/overview/components/bulk-schedule-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { X, Loader2, CalendarPlus } from "lucide-react"
import { useTranslations } from "next-intl"
import candidateService from "@/app/api/candidates/endpoints"
import evaluationService from "@/app/api/evaluations/endpoints"
import { EVALUATION_TYPES } from "@/app/api/evaluations/types"
import type { EvaluationType } from "@/app/api/evaluations/types"
import type { Candidate } from "@/app/api/candidates/types"

interface BulkScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BulkScheduleModal({ isOpen, onClose, onSuccess }: BulkScheduleModalProps) {
  const t = useTranslations("dashboard.indivisual.evaluationManagement")

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [evaluationType, setEvaluationType] = useState<EvaluationType>("INTERVIEW")
  const [scheduledDate, setScheduledDate] = useState("")
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setSelectedIds([])
    setEvaluationType("INTERVIEW")
    setScheduledDate("")
    setDurationMinutes(60)
    setError(null)
    setLoadingCandidates(true)
    candidateService
      .getCandidates()
      .then(setCandidates)
      .catch((err) => {
        console.error("Failed to fetch candidates:", err)
        setError("Failed to load candidates")
      })
      .finally(() => setLoadingCandidates(false))
  }, [isOpen])

  const toggleCandidate = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.length === candidates.length ? [] : candidates.map((c) => c.id)
    )
  }

  const handleSubmit = async () => {
    if (selectedIds.length === 0 || !scheduledDate) return
    setSubmitting(true)
    setError(null)

    const isoDate = new Date(scheduledDate).toISOString()
    const results = await Promise.allSettled(
      selectedIds.map((candidateId) =>
        evaluationService.createEvaluation({
          candidate: candidateId,
          evaluation_type: evaluationType,
          scheduled_date: isoDate,
          duration_minutes: durationMinutes,
        })
      )
    )

    const failures = results.filter((r) => r.status === "rejected").length
    setSubmitting(false)

    if (failures === 0) {
      onSuccess()
      onClose()
    } else if (failures < results.length) {
      setError(`Scheduled ${results.length - failures} of ${results.length} candidates. ${failures} failed.`)
      onSuccess()
    } else {
      setError("Failed to schedule evaluations. Please try again.")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CalendarPlus size={20} />
              {t("addBulkSchedule")}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Evaluation Type</label>
                <select
                  value={evaluationType}
                  onChange={(e) => setEvaluationType(e.target.value as EvaluationType)}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                >
                  {EVALUATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">
                  Candidates ({selectedIds.length} selected)
                </label>
                {candidates.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {selectedIds.length === candidates.length ? "Deselect all" : "Select all"}
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto border rounded-lg p-2">
                {loadingCandidates ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 size={20} className="animate-spin text-purple-500" />
                  </div>
                ) : candidates.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm">No candidates available</p>
                ) : (
                  candidates.map((candidate) => (
                    <label
                      key={candidate.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(candidate.id)}
                        onChange={() => toggleCandidate(candidate.id)}
                        className="rounded border-gray-300 text-purple-600"
                      />
                      <span className="flex-1 truncate">{candidate.full_name}</span>
                      <span className="text-xs text-gray-400">{candidate.job_role}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedIds.length === 0 || !scheduledDate}
              className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Schedule {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
