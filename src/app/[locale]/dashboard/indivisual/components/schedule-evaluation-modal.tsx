"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { X, Loader2, Calendar, MapPin, Video, FileText } from "lucide-react"
import { EVALUATION_TYPES, EVALUATION_STATUS, type Evaluation, type CreateEvaluationData } from "@/app/api/evaluations/types"
import { format } from "date-fns"

type ModalMode = 'view' | 'create' | 'edit' | 'reschedule';

interface EvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: CreateEvaluationData) => Promise<boolean>
  onReschedule?: (data: { new_date: string; reason?: string }) => Promise<boolean>
  mode: ModalMode
  evaluation?: Evaluation | null
  candidates?: Array<{ id: string; full_name: string; email: string; job_role: string }>
  userRole?: string
}

export default function EvaluationModal({
  isOpen,
  onClose,
  onSubmit,
  onReschedule,
  mode,
  evaluation,
  candidates = [],
  userRole = 'B2C'
}: EvaluationModalProps) {
  const t = useTranslations("dashboard.indivisual.evaluations")
  
  const [formData, setFormData] = useState<CreateEvaluationData>({
    candidate: "",
    evaluation_type: "INTERVIEW",
    scheduled_date: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16),
    duration_minutes: 60,
    meeting_link: "",
    meeting_id: "",
    meeting_password: "",
    location: "",
  })

  const [rescheduleData, setRescheduleData] = useState({
    new_date: "",
    reason: ""
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [meetingType, setMeetingType] = useState<'online' | 'inperson'>('online');
  

  useEffect(() => {
    if (isOpen) {
      if ((mode === 'view' || mode === 'edit') && evaluation) {
        setFormData({
          candidate: evaluation.candidate,
          evaluation_type: evaluation.evaluation_type,
          scheduled_date: new Date(evaluation.scheduled_date).toISOString().slice(0, 16),
          duration_minutes: evaluation.duration_minutes,
          meeting_link: evaluation.meeting_link || "",
          meeting_id: evaluation.meeting_id || "",
          meeting_password: evaluation.meeting_password || "",
          location: evaluation.location || "",
        })
      } else if (mode === 'reschedule' && evaluation) {
        setRescheduleData({
          new_date: new Date(evaluation.scheduled_date).toISOString().slice(0, 16),
          reason: ""
        })
      } else if (mode === 'create') {
        setFormData({
          candidate: candidates[0]?.id || "",
          evaluation_type: "INTERVIEW",
          scheduled_date: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16),
          duration_minutes: 60,
          meeting_link: "",
          meeting_id: "",
          meeting_password: "",
          location: "",
        })
      }
      setErrors({})
    }
  }, [isOpen, mode, evaluation, candidates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'reschedule') {
      await handleReschedule()
    } else {
      await handleCreateOrEdit()
    }
  }

  const handleCreateOrEdit = async () => {
    const newErrors: Record<string, string> = {}
    if (!formData.candidate) {
      newErrors.candidate = "Please select a candidate"
    }
    if (!formData.scheduled_date) {
      newErrors.scheduled_date = "Please select a date and time"
    } else {
      const selectedDate = new Date(formData.scheduled_date)
      if (selectedDate <= new Date() && mode === 'create') {
        newErrors.scheduled_date = "Scheduled date must be in the future"
      }
    }
    if (!formData.duration_minutes || formData.duration_minutes < 15) {
      newErrors.duration_minutes = "Duration must be at least 15 minutes"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    if (onSubmit) {
      const success = await onSubmit(formData)
      setLoading(false)
      if (success) {
        onClose()
      }
    }
  }

  const handleReschedule = async () => {
    const newErrors: Record<string, string> = {}
    if (!rescheduleData.new_date) {
      newErrors.new_date = "Please select a new date and time"
    } else {
      const selectedDate = new Date(rescheduleData.new_date)
      if (selectedDate <= new Date()) {
        newErrors.new_date = "New date must be in the future"
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    if (onReschedule) {
      const success = await onReschedule(rescheduleData)
      setLoading(false)
      if (success) {
        onClose()
      }
    }
  }

  const handleClose = () => {
    setFormData({
      candidate: candidates[0]?.id || "",
      evaluation_type: "INTERVIEW",
      scheduled_date: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16),
      duration_minutes: 60,
      meeting_link: "",
      meeting_id: "",
      meeting_password: "",
      location: "",
    })
    setRescheduleData({ new_date: "", reason: "" })
    setErrors({})
    onClose()
  }

  const isViewMode = mode === 'view'
  const isEditMode = mode === 'edit'
  const isCreateMode = mode === 'create'
  const isRescheduleMode = mode === 'reschedule'
  
  const canEdit = (isCreateMode || isEditMode || isRescheduleMode) && 
    (userRole !== 'B2B_TEAM_MEMBER' || evaluation?.created_by === evaluation?.id)

  if (!isOpen) return null

  const selectedCandidate = candidates.find(c => c.id === formData.candidate)

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={handleClose} />
      
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl pointer-events-auto relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-2 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'create' && 'Schedule New Evaluation'}
            {mode === 'edit' && 'Edit Evaluation'}
            {mode === 'view' && 'Evaluation Details'}
            {mode === 'reschedule' && 'Reschedule Evaluation'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isViewMode && evaluation && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Candidate Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium">{evaluation.candidate_first_name} {evaluation.candidate_last_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm">{evaluation.candidate_email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Job Role</p>
                  <p className="text-sm">{evaluation.candidate_job_role}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Preferred Language</p>
                  <p className="text-sm">{evaluation.candidate_preferred_language}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Evaluation Type</p>
                <p className="text-sm font-medium">{evaluation.evaluation_type_display}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    evaluation.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    evaluation.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                    evaluation.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {evaluation.status_display}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Scheduled Date</p>
                <p className="text-sm">{format(new Date(evaluation.scheduled_date), 'PPP p')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm">{evaluation.duration_minutes} minutes</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Meeting Details</h3>
              {evaluation.location ? (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">In-Person</p>
                    <p className="text-sm text-gray-600">{evaluation.location}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {evaluation.meeting_link && (
                    <div className="flex items-start gap-2">
                      <Video className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">Meeting Link</p>
                        <a href={evaluation.meeting_link} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-purple-600 hover:text-purple-700">
                          {evaluation.meeting_link}
                        </a>
                      </div>
                    </div>
                  )}
                  {evaluation.meeting_id && (
                    <div>
                      <p className="text-xs text-gray-500">Meeting ID: {evaluation.meeting_id}</p>
                    </div>
                  )}
                  {evaluation.meeting_password && (
                    <div>
                      <p className="text-xs text-gray-500">Password: {evaluation.meeting_password}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {evaluation.status === 'COMPLETED' && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="text-lg font-bold text-purple-600">{evaluation.score}%</p>
                  </div>
                  {evaluation.certificate_status !== 'NOT_ISSUED' && (
                    <div>
                      <p className="text-xs text-gray-500">Certificate</p>
                      {evaluation.certificate_url ? (
                        <a href={evaluation.certificate_url} target="_blank" rel="noopener noreferrer"
                           className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          View Certificate
                        </a>
                      ) : (
                        <p className="text-sm">{evaluation.certificate_status_display}</p>
                      )}
                    </div>
                  )}
                </div>
                {evaluation.feedback && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">Feedback</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{evaluation.feedback}</p>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4 text-xs text-gray-400">
              <p>Scheduled by: {evaluation.created_by_name}</p>
              <p>Created: {format(new Date(evaluation.created_at), 'PPP')}</p>
            </div>
          </div>
        )}

        {(isCreateMode || isEditMode) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isCreateMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Candidate *
                </label>
                <select
                  value={formData.candidate}
                  onChange={(e) => setFormData({ ...formData, candidate: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.candidate ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a candidate</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.full_name} - {candidate.email}
                    </option>
                  ))}
                </select>
                {errors.candidate && (
                  <p className="mt-1 text-xs text-red-600">{errors.candidate}</p>
                )}
              </div>
            )}

            {isEditMode && selectedCandidate && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Candidate:</p>
                <p className="text-sm font-medium">{selectedCandidate.full_name}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evaluation Type *
                </label>
                <select
                  value={formData.evaluation_type}
                  onChange={(e) => setFormData({ ...formData, evaluation_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {EVALUATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.duration_minutes ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.duration_minutes && (
                  <p className="mt-1 text-xs text-red-600">{errors.duration_minutes}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.scheduled_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.scheduled_date && (
                <p className="mt-1 text-xs text-red-600">{errors.scheduled_date}</p>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Meeting Details</h3>
              
              <div className="space-y-3">
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="locationType"
                      value="online"
                      checked={meetingType === 'online'}
                      onChange={() => {
                        setMeetingType('online');
                        setFormData({ 
                          ...formData, 
                          location: "",
                        });
                      }}
                    />
                    <span className="text-sm">Online</span>

                    <input
                      type="radio"
                      name="locationType"
                      value="inperson"
                      checked={meetingType === 'inperson'}
                      onChange={() => {
                        setMeetingType('inperson');
                        setFormData({ 
                          ...formData, 
                          location: " ",
                          meeting_link: "",
                          meeting_id: "",
                          meeting_password: ""
                        });
                      }}
                    />
                    <span className="text-sm">In-Person</span>
                  </label>
                </div>

                {!formData.location ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meeting Link
                      </label>
                      <input
                        type="url"
                        value={formData.meeting_link || ""}
                        onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                        placeholder="https://meet.google.com/..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meeting ID
                        </label>
                        <input
                          type="text"
                          value={formData.meeting_id || ""}
                          onChange={(e) => setFormData({ ...formData, meeting_id: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <input
                          type="text"
                          value={formData.meeting_password || ""}
                          onChange={(e) => setFormData({ ...formData, meeting_password: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Office address, room number, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        )}

        {isRescheduleMode && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <Calendar className="w-4 h-4 inline mr-2" />
                Current scheduled time: {evaluation && format(new Date(evaluation.scheduled_date), 'PPP p')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Date & Time *
              </label>
              <input
                type="datetime-local"
                value={rescheduleData.new_date}
                onChange={(e) => setRescheduleData({ ...rescheduleData, new_date: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.new_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.new_date && (
                <p className="mt-1 text-xs text-red-600">{errors.new_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rescheduling (Optional)
              </label>
              <textarea
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter reason..."
              />
            </div>
          </form>
        )}

        {(!isViewMode || isRescheduleMode) && (
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isRescheduleMode ? 'Rescheduling...' : 'Saving...'}
                </>
              ) : (
                isRescheduleMode ? 'Confirm Reschedule' : 'Save Changes'
              )}
            </button>
          </div>
        )}

        {isViewMode && (
          <div className="flex justify-end mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}