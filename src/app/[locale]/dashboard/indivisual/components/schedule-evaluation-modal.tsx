"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  X, Loader2, Calendar, MapPin, Video, FileText, AlertCircle, Check, ChevronDown, Search,
  User, Clock, Globe, Info, Mail, CheckCircle2, MessageSquareText, ClipboardList,
} from "lucide-react"
import { EVALUATION_TYPES, EVALUATION_STATUS, type Evaluation, type CreateEvaluationData } from "@/app/api/evaluations/types"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { EvaluatorRatingCard } from "@/components/evaluations/EvaluatorRatingCard"

type ModalMode = 'view' | 'create' | 'edit' | 'reschedule';

const TYPE_KEYS: Record<string, string> = {
  INTERVIEW: 'interview',
  TECHNICAL_TEST: 'technicalTest',
  ASSESSMENT: 'assessment',
  LANGUAGE_PROFICIENCY: 'languageProficiency',
};

const STATUS_KEYS: Record<string, string> = {
  SCHEDULED: 'scheduled',
  RESCHEDULED: 'rescheduled',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'noShow',
};

// <input type="datetime-local">'s value is wall-clock digits with no
// timezone - toISOString() converts to UTC first, so for anyone not in
// UTC (e.g. AST, UTC+3) the picker showed a time hours off from what was
// actually selected/stored, both as the "now + 1 hour" default and when
// editing an existing evaluation. Build the local-time digits directly
// instead.
function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// A single native <input type="datetime-local"> combines its own date and
// time pickers into one control with no visible confirm step for the time
// portion - confusing enough on mobile that it read as "there's no submit
// button for the time" to a candidate trying to use it. Split into a plain
// <input type="date"> and <input type="time"> instead (each with its own
// unambiguous native picker), while keeping the same combined
// "YYYY-MM-DDTHH:mm" string as the single source of truth everywhere else.
function splitDateTimeLocalValue(value: string): { date: string; time: string } {
  const [date = "", time = ""] = value.split("T");
  return { date, time };
}
function combineDateTimeLocalValue(date: string, time: string): string {
  return date && time ? `${date}T${time}` : "";
}

// Validation allows 15-60 minutes; offer those in 15-minute steps, plus an
// existing evaluation's own value if it was saved as something in between.
const DURATION_OPTIONS = [15, 30, 45, 60];

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

// The browser's own timezone - the date/time fields are entered in it and
// converted to UTC on submit, so this is what the chosen time means.
function timeZoneLabel(value: string): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = value ? new Date(value) : new Date();
  const offsetMinutes = -(isNaN(date.getTime()) ? new Date() : date).getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const offset = `UTC${sign}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
  return zone ? `${zone} (${offset})` : offset;
}

interface EvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: CreateEvaluationData) => Promise<boolean>
  onReschedule?: (data: { new_date: string; reason?: string }) => Promise<boolean>
  mode: ModalMode
  evaluation?: Evaluation | null
  candidates?: Array<{ id: string; full_name: string; email: string; job_role: string }>
  userRole?: string
  currentUserId?: string
  errorMessage?: string | null
}

export default function EvaluationModal({
  isOpen,
  onClose,
  onSubmit,
  onReschedule,
  mode,
  evaluation,
  candidates = [],
  userRole = 'B2C',
  currentUserId,
  errorMessage
}: EvaluationModalProps) {
  const t = useTranslations("dashboard.indivisual.evaluations.scheduleModal")
  const tTypes = useTranslations("dashboard.indivisual.evaluationManagement.types")
  const tStatus = useTranslations("dashboard.indivisual.evaluationManagement.status")
  const locale = useLocale()
  const evaluatorMeetingLink = evaluation?.session_id
    ? `/${locale}/dashboard/indivisual/live-call?sessionId=${evaluation.session_id}`
    : null

  const [formData, setFormData] = useState<CreateEvaluationData>({
    candidate: "",
    evaluation_type: "INTERVIEW",
    scheduled_date: toDateTimeLocalValue(new Date(new Date().setHours(new Date().getHours() + 1))),
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
  // A fixed auto-close delay can't tell "done picking" from "still
  // deciding" - it either closes too quickly mid-interaction or lingers.
  // Give the user an explicit close/confirm action instead of guessing.
  const timeInputRef = useRef<HTMLInputElement | null>(null)
  const rescheduleTimeInputRef = useRef<HTMLInputElement | null>(null)
  const [candidateMenuOpen, setCandidateMenuOpen] = useState(false)
  const [candidateSearch, setCandidateSearch] = useState("")
  const candidateMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!candidateMenuOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (candidateMenuRef.current && !candidateMenuRef.current.contains(e.target as Node)) {
        setCandidateMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [candidateMenuOpen])

  useEffect(() => {
    if (isOpen) {
      if ((mode === 'view' || mode === 'edit') && evaluation) {
        setFormData({
          candidate: evaluation.candidate,
          evaluation_type: evaluation.evaluation_type,
          scheduled_date: toDateTimeLocalValue(new Date(evaluation.scheduled_date)),
          duration_minutes: evaluation.duration_minutes,
          meeting_link: evaluation.meeting_link || "",
          meeting_id: evaluation.meeting_id || "",
          meeting_password: evaluation.meeting_password || "",
          location: evaluation.location || "",
        })
      } else if (mode === 'reschedule' && evaluation) {
        setRescheduleData({
          new_date: toDateTimeLocalValue(new Date(evaluation.scheduled_date)),
          reason: ""
        })
      } else if (mode === 'create') {
        setFormData({
          candidate: candidates[0]?.id || "",
          evaluation_type: "INTERVIEW",
          scheduled_date: toDateTimeLocalValue(new Date(new Date().setHours(new Date().getHours() + 1))),
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
      newErrors.candidate = t("errors.candidateRequired")
    }
    if (!formData.scheduled_date) {
      newErrors.scheduled_date = t("errors.dateRequired")
    } else {
      const selectedDate = new Date(formData.scheduled_date)
      if (selectedDate <= new Date() && mode === 'create') {
        newErrors.scheduled_date = t("errors.dateMustBeFuture")
      }
    }
    if (!formData.duration_minutes || formData.duration_minutes < 15) {
      newErrors.duration_minutes = t("errors.durationMin")
    } else if (formData.duration_minutes > 60) {
      newErrors.duration_minutes = t("errors.durationMax")
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    if (onSubmit) {
      // formData.scheduled_date is a datetime-local value (local wall-clock
      // digits, no timezone) - sending it as-is would have the backend
      // (TIME_ZONE=UTC, no per-request timezone activation) interpret it AS
      // UTC instead of the browser's actual local time, silently shifting
      // the stored instant by the local UTC offset. new Date(...) parses a
      // timezone-less datetime string as local time per spec, so
      // toISOString() here correctly converts it to the real UTC instant.
      const success = await onSubmit({
        ...formData,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
      })
      setLoading(false)
      if (success) {
        onClose()
      }
    }
  }

  const handleReschedule = async () => {
    const newErrors: Record<string, string> = {}
    if (!rescheduleData.new_date) {
      newErrors.new_date = t("errors.newDateRequired")
    } else {
      const selectedDate = new Date(rescheduleData.new_date)
      if (selectedDate <= new Date()) {
        newErrors.new_date = t("errors.newDateMustBeFuture")
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    if (onReschedule) {
      // Same local-time-to-UTC conversion as the create/edit path above -
      // rescheduleData.new_date is a naive datetime-local value.
      const success = await onReschedule({
        ...rescheduleData,
        new_date: new Date(rescheduleData.new_date).toISOString(),
      })
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
      scheduled_date: toDateTimeLocalValue(new Date(new Date().setHours(new Date().getHours() + 1))),
      duration_minutes: 60,
      meeting_link: "",
      meeting_id: "",
      meeting_password: "",
      location: "",
    })
    setRescheduleData({ new_date: "", reason: "" })
    setErrors({})
    setCandidateMenuOpen(false)
    setCandidateSearch("")
    onClose()
  }

  const isViewMode = mode === 'view'
  const isEditMode = mode === 'edit'
  const isCreateMode = mode === 'create'
  const isRescheduleMode = mode === 'reschedule'

  const canEdit = (isCreateMode || isEditMode || isRescheduleMode) &&
    (userRole !== 'B2B_TEAM_MEMBER' || evaluation?.created_by === currentUserId)

  if (!isOpen) return null

  const selectedCandidate = candidates.find(c => c.id === formData.candidate)

  if (isCreateMode || isEditMode) {
    // Edit mode may not get the candidate list - fall back to the
    // evaluation's own candidate fields for the read-only card/preview.
    const candidateName = selectedCandidate?.full_name
      ?? (evaluation ? `${evaluation.candidate_first_name ?? ""} ${evaluation.candidate_last_name ?? ""}`.trim() : "")
    const candidateEmail = selectedCandidate?.email ?? evaluation?.candidate_email ?? ""
    const isInterview = formData.evaluation_type === 'INTERVIEW'
    const { date: dateValue, time: timeValue } = splitDateTimeLocalValue(formData.scheduled_date)
    const scheduledAt = formData.scheduled_date ? new Date(formData.scheduled_date) : null
    const scheduledAtValid = scheduledAt !== null && !isNaN(scheduledAt.getTime())
    const durationOptions = DURATION_OPTIONS.includes(formData.duration_minutes)
      ? DURATION_OPTIONS
      : [...DURATION_OPTIONS, formData.duration_minutes].sort((a, b) => a - b)
    const searchQuery = candidateSearch.trim().toLowerCase()
    const filteredCandidates = searchQuery
      ? candidates.filter((c) => c.full_name.toLowerCase().includes(searchQuery) || c.email.toLowerCase().includes(searchQuery))
      : candidates
    const inputBase = "w-full h-12 rounded-xl border bg-white text-base sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
    const typeLabel = TYPE_KEYS[formData.evaluation_type] ? tTypes(TYPE_KEYS[formData.evaluation_type]) : formData.evaluation_type
    const dateLocale = locale === 'ar' ? { locale: ar } : undefined

    const stepHeader = (n: number, title: string, subtitle?: string) => (
      <div className="flex items-start gap-4 mb-4">
        <span className="shrink-0 w-9 h-9 rounded-full bg-purple-50 text-purple-700 font-bold flex items-center justify-center">{n}</span>
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    )

    const previewRow = (icon: React.ReactNode, label: string, children: React.ReactNode) => (
      <div className="flex items-start gap-4 py-4 border-b border-gray-200/70 last:border-b-0">
        <span className="shrink-0 w-11 h-11 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">{icon}</span>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          {children}
        </div>
      </div>
    )

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-0 sm:p-4">
        <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={handleClose} />

        <form
          onSubmit={handleSubmit}
          className="bg-white sm:rounded-2xl shadow-xl w-full max-w-5xl pointer-events-auto relative h-full sm:h-auto sm:max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-5 sm:px-8 pt-6 pb-5 border-b border-gray-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {isCreateMode ? t("titles.create") : t("titles.edit")}
              </h2>
              {isCreateMode && <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>}
            </div>
            <button type="button" onClick={handleClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1" aria-label={t("buttons.cancel")}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-8">
              {/* Left: steps */}
              <div className="space-y-6">
                {/* Step 1: Candidate */}
                <section className="pb-6 border-b border-gray-200">
                  {stepHeader(1, t("steps.candidate.title"), isCreateMode ? t("steps.candidate.subtitle") : undefined)}
                  <div className="sm:ps-[52px]">
                    {isCreateMode ? (
                      <div className="relative" ref={candidateMenuRef}>
                        <button
                          type="button"
                          onClick={() => setCandidateMenuOpen((open) => !open)}
                          aria-haspopup="listbox"
                          aria-expanded={candidateMenuOpen}
                          className={`w-full flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-start focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.candidate ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          {selectedCandidate ? (
                            <>
                              <span className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm font-semibold flex items-center justify-center">
                                {initialsOf(selectedCandidate.full_name)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-semibold text-gray-900 truncate">{selectedCandidate.full_name}</span>
                                <span className="block text-sm text-gray-500 truncate">{selectedCandidate.email}</span>
                              </span>
                            </>
                          ) : (
                            <span className="flex-1 text-gray-400">{t("selectCandidatePlaceholder")}</span>
                          )}
                          <ChevronDown className={`w-5 h-5 text-gray-500 shrink-0 transition-transform ${candidateMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {candidateMenuOpen && (
                          <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                            <div className="p-2 border-b border-gray-100">
                              <div className="relative">
                                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  autoFocus
                                  type="text"
                                  value={candidateSearch}
                                  onChange={(e) => setCandidateSearch(e.target.value)}
                                  placeholder={t("searchCandidates")}
                                  className="w-full ps-9 pe-3 py-2 rounded-lg border border-gray-200 text-base sm:text-sm focus:outline-none focus:border-purple-400"
                                />
                              </div>
                            </div>
                            <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
                              {filteredCandidates.length === 0 ? (
                                <li className="px-4 py-3 text-sm text-gray-400">{t("noCandidatesFound")}</li>
                              ) : filteredCandidates.map((candidate) => {
                                const isSelected = candidate.id === formData.candidate
                                return (
                                  <li key={candidate.id} role="option" aria-selected={isSelected}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData({ ...formData, candidate: candidate.id })
                                        setErrors((prev) => ({ ...prev, candidate: "" }))
                                        setCandidateMenuOpen(false)
                                        setCandidateSearch("")
                                      }}
                                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-start hover:bg-purple-50 ${isSelected ? 'bg-purple-50' : ''}`}
                                    >
                                      <span className="shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center">
                                        {initialsOf(candidate.full_name)}
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium text-gray-900 truncate">{candidate.full_name}</span>
                                        <span className="block text-xs text-gray-500 truncate">{candidate.email}</span>
                                      </span>
                                      {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )}
                        {errors.candidate && <p className="mt-1 text-xs text-red-600">{errors.candidate}</p>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <span className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm font-semibold flex items-center justify-center">
                          {initialsOf(candidateName)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-gray-900 truncate">{candidateName}</span>
                          {candidateEmail && <span className="block text-sm text-gray-500 truncate">{candidateEmail}</span>}
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Step 2: Evaluation details */}
                <section className="pb-6 border-b border-gray-200">
                  {stepHeader(2, t("steps.details.title"), t("steps.details.subtitle"))}
                  <div className="sm:ps-[52px] grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("evaluationType")} *</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center">
                          <MessageSquareText className="w-4 h-4" />
                        </span>
                        <select
                          value={formData.evaluation_type}
                          onChange={(e) => setFormData({ ...formData, evaluation_type: e.target.value as CreateEvaluationData['evaluation_type'] })}
                          className={`${inputBase} appearance-none border-gray-300 ps-12 pe-10`}
                        >
                          {EVALUATION_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>{tTypes(TYPE_KEYS[type.value])}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("durationLabel")} *</label>
                      <div className="relative">
                        <Clock className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                        <select
                          value={formData.duration_minutes}
                          onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                          className={`${inputBase} appearance-none ps-12 pe-10 ${errors.duration_minutes ? 'border-red-500' : 'border-gray-300'}`}
                        >
                          {durationOptions.map((minutes) => (
                            <option key={minutes} value={minutes}>{minutes}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      </div>
                      {errors.duration_minutes && <p className="mt-1 text-xs text-red-600">{errors.duration_minutes}</p>}
                    </div>
                  </div>
                </section>

                {/* Step 3: Date & time */}
                <section className={isInterview ? "" : "pb-6 border-b border-gray-200"}>
                  {stepHeader(3, t("steps.schedule.title"), t("steps.schedule.subtitle"))}
                  <div className="sm:ps-[52px] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("dateLabel")} *</label>
                        <div className="relative">
                          <Calendar className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600" />
                          <input
                            type="date"
                            value={dateValue}
                            onChange={(e) => setFormData({ ...formData, scheduled_date: combineDateTimeLocalValue(e.target.value, timeValue) })}
                            className={`${inputBase} ps-12 pe-3 ${errors.scheduled_date ? 'border-red-500' : 'border-gray-300'}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("timeLabel")} *</label>
                        <div className="relative">
                          <Clock className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                          <input
                            ref={timeInputRef}
                            type="time"
                            value={timeValue}
                            onChange={(e) => setFormData({ ...formData, scheduled_date: combineDateTimeLocalValue(dateValue, e.target.value) })}
                            className={`${inputBase} ps-12 pe-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${errors.scheduled_date ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          <ChevronDown className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        </div>
                        {/* Mobile time pickers have no visible confirm step -
                            keep an explicit close action there. */}
                        <button
                          type="button"
                          onClick={() => timeInputRef.current?.blur()}
                          className="sm:hidden mt-1 ms-auto text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {t("closeTimePicker")}
                        </button>
                      </div>
                    </div>
                    {errors.scheduled_date && <p className="text-xs text-red-600">{errors.scheduled_date}</p>}
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
                      <Globe className="w-5 h-5 text-purple-600 shrink-0" />
                      <span className="text-gray-500">{t("timeZoneLabel")}</span>
                      <span className="text-gray-900 truncate" dir="ltr">{timeZoneLabel(formData.scheduled_date)}</span>
                    </div>
                  </div>
                </section>

                {isInterview ? (
                  // AI interviews get their meeting link auto-generated by the
                  // backend when scheduled (and re-generated on reschedule) -
                  // any online/in-person/link/location fields entered here
                  // would be silently overwritten, so don't offer them.
                  <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Info className="w-4 h-4" />
                    </span>
                    <p className="text-sm text-indigo-800">{t("aiLinkNote")}</p>
                  </div>
                ) : (
                  <section>
                    {stepHeader(4, t("meetingDetailsHeading"))}
                    <div className="sm:ps-[52px] space-y-3">
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="locationType"
                            value="online"
                            checked={meetingType === 'online'}
                            onChange={() => {
                              setMeetingType('online');
                              setFormData({ ...formData, location: "" });
                            }}
                          />
                          {t("online")}
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="locationType"
                            value="inperson"
                            checked={meetingType === 'inperson'}
                            onChange={() => {
                              setMeetingType('inperson');
                              setFormData({ ...formData, location: " ", meeting_link: "", meeting_id: "", meeting_password: "" });
                            }}
                          />
                          {t("inPersonOption")}
                        </label>
                      </div>

                      {!formData.location ? (
                        <>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("meetingLink")}</label>
                            <input
                              type="url"
                              value={formData.meeting_link || ""}
                              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                              placeholder={t("meetingLinkPlaceholder")}
                              className={`${inputBase} border-gray-300 px-4`}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("meetingIdLabel")}</label>
                              <input
                                type="text"
                                value={formData.meeting_id || ""}
                                onChange={(e) => setFormData({ ...formData, meeting_id: e.target.value })}
                                className={`${inputBase} border-gray-300 px-4`}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("passwordLabel")}</label>
                              <input
                                type="text"
                                value={formData.meeting_password || ""}
                                onChange={(e) => setFormData({ ...formData, meeting_password: e.target.value })}
                                className={`${inputBase} border-gray-300 px-4`}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("locationLabel")}</label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder={t("locationPlaceholder")}
                            className={`${inputBase} border-gray-300 px-4`}
                          />
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Right: live preview */}
              <aside className="rounded-2xl bg-gray-50 border border-gray-100 p-5 sm:p-6 h-fit">
                <h3 className="text-lg font-bold text-gray-900">{t("preview.title")}</h3>
                <p className="text-sm text-gray-500 pb-3 border-b border-gray-200/70">{t("preview.subtitle")}</p>

                {previewRow(<User className="w-5 h-5" />, t("preview.candidate"), candidateName ? (
                  <>
                    <p className="font-bold text-gray-900 truncate">{candidateName}</p>
                    {candidateEmail && <p className="text-sm text-gray-500 truncate">{candidateEmail}</p>}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">{t("preview.notSelected")}</p>
                ))}

                {previewRow(<ClipboardList className="w-5 h-5" />, t("evaluationType"), (
                  <p className="font-bold text-gray-900 flex items-center gap-2">
                    {typeLabel}
                    {isInterview && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">{t("preview.aiBadge")}</span>
                    )}
                  </p>
                ))}

                {previewRow(<Clock className="w-5 h-5" />, t("duration"), (
                  <p className="font-bold text-gray-900">{t("durationMinutesValue", { value: formData.duration_minutes })}</p>
                ))}

                {previewRow(<Calendar className="w-5 h-5" />, t("preview.dateTime"), scheduledAtValid ? (
                  <>
                    <p className="font-bold text-gray-900">{format(scheduledAt!, 'd MMMM yyyy, hh:mm a', dateLocale)}</p>
                    <p className="text-sm text-gray-500" dir="ltr">{timeZoneLabel(formData.scheduled_date)}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">{t("preview.notSet")}</p>
                ))}

                {isInterview && isCreateMode && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="flex items-center gap-2 font-bold text-gray-900 mb-3">
                      <Mail className="w-5 h-5 text-emerald-600" />
                      {t("nextSteps.title")}
                    </p>
                    <ul className="space-y-2">
                      {(["link", "email", "dateTime", "join"] as const).map((key) => (
                        <li key={key} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="w-5 h-5 text-white fill-emerald-500 shrink-0" />
                          {t(`nextSteps.${key}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 sm:px-8 py-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              {t("buttons.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isCreateMode && <Calendar className="w-4 h-4" />}
              {loading ? t("buttons.saving") : isCreateMode ? t("scheduleButton") : t("buttons.saveChanges")}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={handleClose} />

      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl pointer-events-auto relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-2 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'view' && t("titles.view")}
            {mode === 'reschedule' && t("titles.reschedule")}
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
              <h3 className="font-medium text-gray-900 mb-3">{t("candidateInfo.heading")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">{t("candidateInfo.name")}</p>
                  <p className="text-sm font-medium">{evaluation.candidate_first_name} {evaluation.candidate_last_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("candidateInfo.email")}</p>
                  <p className="text-sm">{evaluation.candidate_email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("candidateInfo.jobRole")}</p>
                  <p className="text-sm">{evaluation.candidate_job_role}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("candidateInfo.preferredLanguage")}</p>
                  <p className="text-sm">{evaluation.candidate_preferred_language}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">{t("evaluationType")}</p>
                <p className="text-sm font-medium">{TYPE_KEYS[evaluation.evaluation_type] ? tTypes(TYPE_KEYS[evaluation.evaluation_type]) : evaluation.evaluation_type_display}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("status")}</p>
                <p className="text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    evaluation.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    evaluation.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                    evaluation.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {STATUS_KEYS[evaluation.status] ? tStatus(STATUS_KEYS[evaluation.status]) : evaluation.status_display}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("scheduledDate")}</p>
                <p className="text-sm">{format(new Date(evaluation.scheduled_date), 'PPP p', locale === 'ar' ? { locale: ar } : undefined)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("duration")}</p>
                <p className="text-sm">{t("durationMinutesValue", { value: evaluation.duration_minutes })}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">
                {evaluation.evaluation_type === 'INTERVIEW' ? t("interviewAccessHeading") : t("meetingDetailsHeading")}
                {evaluation.evaluation_type === 'INTERVIEW' && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 align-middle">
                    {t("aiInterviewBadge")}
                  </span>
                )}
              </h3>
              {evaluation.evaluation_type === 'INTERVIEW' ? (
                <div className="space-y-3">
                  {evaluatorMeetingLink && (
                    <div className="flex items-start gap-2">
                      <Video className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">{t("interviewerAccess")}</p>
                        <a href={evaluatorMeetingLink} className="text-sm text-purple-600 hover:text-purple-700">
                          {t("joinInterview")}
                        </a>
                        <p className="text-xs text-gray-500">{t("interviewerOnlyNote")}</p>
                      </div>
                    </div>
                  )}
                  {evaluation.meeting_link && (
                    <div className="flex items-start gap-2">
                      <Video className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">{t("candidateAccessLink")}</p>
                        <a href={evaluation.meeting_link} target="_blank" rel="noopener noreferrer"
                           className="text-sm text-purple-600 hover:text-purple-700">
                          {evaluation.meeting_link}
                        </a>
                        <p className="text-xs text-gray-500">{t("candidateOnlyNote")}</p>
                      </div>
                    </div>
                  )}
                  {evaluation.meeting_id && (
                    <div>
                      <p className="text-xs text-gray-500">{t("meetingId", { value: evaluation.meeting_id })}</p>
                    </div>
                  )}
                  {evaluation.meeting_password && (
                    <div>
                      <p className="text-xs text-gray-500">{t("password", { value: evaluation.meeting_password })}</p>
                    </div>
                  )}
                </div>
              ) : evaluation.location ? (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">{t("inPerson")}</p>
                    <p className="text-sm text-gray-600">{evaluation.location}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {evaluation.meeting_link && (
                    <div className="flex items-start gap-2">
                      <Video className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">{t("meetingLink")}</p>
                        <a href={evaluation.meeting_link} target="_blank" rel="noopener noreferrer"
                           className="text-sm text-purple-600 hover:text-purple-700">
                          {evaluation.meeting_link}
                        </a>
                      </div>
                    </div>
                  )}
                  {evaluation.meeting_id && (
                    <div>
                      <p className="text-xs text-gray-500">{t("meetingId", { value: evaluation.meeting_id })}</p>
                    </div>
                  )}
                  {evaluation.meeting_password && (
                    <div>
                      <p className="text-xs text-gray-500">{t("password", { value: evaluation.meeting_password })}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {evaluation.status === 'COMPLETED' && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">{t("resultsHeading")}</h3>
                {evaluation.assessment_mode === 'SCHEDULED_INTERVIEW' && (
                  <EvaluatorRatingCard evaluationId={evaluation.id} />
                )}
                {evaluation.assessment_mode === 'AI_INTERVIEW' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">{t("aiScoreLabel")}</p>
                    <p className="text-lg font-bold text-purple-600">
                      {evaluation.score !== null && evaluation.score !== undefined ? `${evaluation.score}%` : t("scoringPending")}
                    </p>
                  </div>
                  {evaluation.certificate_status !== 'NOT_ISSUED' && (
                    <div>
                      <p className="text-xs text-gray-500">{t("certificate")}</p>
                      {evaluation.certificate_url ? (
                        <a href={evaluation.certificate_url} target="_blank" rel="noopener noreferrer"
                           className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {t("viewCertificate")}
                        </a>
                      ) : (
                        <p className="text-sm">{evaluation.certificate_status_display}</p>
                      )}
                    </div>
                  )}
                </div>
                )}
                {evaluation.feedback && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">{t("feedback")}</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{evaluation.feedback}</p>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4 text-xs text-gray-400">
              <p>{t("scheduledBy", { name: evaluation.created_by_name })}</p>
              <p>{t("created", { date: format(new Date(evaluation.created_at), 'PPP', locale === 'ar' ? { locale: ar } : undefined) })}</p>
            </div>
          </div>
        )}

        {isRescheduleMode && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <Calendar className="w-4 h-4 inline mr-2" />
                {evaluation && t("currentScheduledTime", { date: format(new Date(evaluation.scheduled_date), 'PPP p', locale === 'ar' ? { locale: ar } : undefined) })}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("newDateTimeLabel")} *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={splitDateTimeLocalValue(rescheduleData.new_date).date}
                  onChange={(e) => setRescheduleData({
                    ...rescheduleData,
                    new_date: combineDateTimeLocalValue(e.target.value, splitDateTimeLocalValue(rescheduleData.new_date).time),
                  })}
                  className={`w-full px-4 py-2 border rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.new_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <input
                  ref={rescheduleTimeInputRef}
                  type="time"
                  value={splitDateTimeLocalValue(rescheduleData.new_date).time}
                  onChange={(e) => setRescheduleData({
                    ...rescheduleData,
                    new_date: combineDateTimeLocalValue(splitDateTimeLocalValue(rescheduleData.new_date).date, e.target.value),
                  })}
                  className={`w-full px-4 py-2 border rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.new_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div />
                <button
                  type="button"
                  onClick={() => rescheduleTimeInputRef.current?.blur()}
                  className="mt-1 justify-self-end text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t("closeTimePicker")}
                </button>
              </div>
              {errors.new_date && (
                <p className="mt-1 text-xs text-red-600">{errors.new_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("rescheduleReasonLabel")}
              </label>
              <textarea
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={t("reasonPlaceholder")}
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
              {t("buttons.cancel")}
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
                  {isRescheduleMode ? t("buttons.rescheduling") : t("buttons.saving")}
                </>
              ) : (
                isRescheduleMode ? t("buttons.confirmReschedule") : t("buttons.saveChanges")
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
              {t("buttons.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
