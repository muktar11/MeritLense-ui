"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { CERTIFICATE_STATUS } from "../../../../api/evaluations/types"

interface CompleteEvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { score?: number; feedback?: string; certificate_status?: string; certificate_url?: string }) => Promise<boolean>
  candidateName: string
}

export default function CompleteEvaluationModal({
  isOpen,
  onClose,
  onSubmit,
  candidateName
}: CompleteEvaluationModalProps) {
  const [formData, setFormData] = useState({
    score: "",
    feedback: "",
    certificate_status: "NOT_ISSUED",
    certificate_url: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (formData.score && (Number(formData.score) < 0 || Number(formData.score) > 100)) {
      newErrors.score = "Score must be between 0 and 100"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    const success = await onSubmit({
      score: formData.score ? Number(formData.score) : undefined,
      feedback: formData.feedback || undefined,
      certificate_status: formData.certificate_status,
      certificate_url: formData.certificate_url || undefined
    })
    setSubmitting(false)
    
    if (success) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={onClose} />
      
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md pointer-events-auto relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Complete Evaluation</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Completing evaluation for <span className="font-medium">{candidateName}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Score (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                errors.score ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.score && <p className="mt-1 text-xs text-red-600">{errors.score}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback
            </label>
            <textarea
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Enter feedback..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificate Status
            </label>
            <select
              value={formData.certificate_status}
              onChange={(e) => setFormData({ ...formData, certificate_status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {CERTIFICATE_STATUS.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {formData.certificate_status === 'ISSUED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificate URL
              </label>
              <input
                type="url"
                value={formData.certificate_url}
                onChange={(e) => setFormData({ ...formData, certificate_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="https://..."
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Complete Evaluation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}