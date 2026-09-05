"use client"

import { useState, useEffect, Fragment } from "react"
import { useTranslations } from "next-intl"
import {
  X,
  Upload,
  Loader2,
  FileText,
  Trash2,
  CheckCircle2
} from "lucide-react"
import Image from "next/image"
import { Dialog, Transition } from '@headlessui/react'
import candidateService from "../../../../../api/candidates/endpoints"
import {
  Candidate,
  CandidateFormData,
  CandidateModalMode,
  JOB_ROLES,
  LANGUAGES
} from "../../../../../api/candidates/types"
import { checkPassportPhotoQuality, matchFaces, passportQualityMessage, FaceMatchResult, PassportPhotoQualityResult, PASSPORT_PHOTO_MATCH_THRESHOLD } from "@/lib/face-detection"
import { PASSPORT_PHOTO_GUIDELINES } from "@/lib/photo-guidelines"

type PhotoField = 'passport_document' | 'profile_photo'

interface CandidateModalProps {
  isOpen: boolean
  onClose: () => void
  mode: CandidateModalMode
  candidate?: Candidate | null
  onSuccess?: () => void
  userRole: string;
  currentUserId?: string;
}

export function CandidateModal({
  isOpen,
  onClose,
  mode,
  candidate,
  onSuccess,
  userRole = 'B2C',
  currentUserId}: CandidateModalProps) {
  const t = useTranslations("dashboard.candidates.modal")
  const tRoles = useTranslations("dashboard.candidates.table.candidateRoles")
  const tLanguages = useTranslations("dashboard.indivisual.settings.edit-profile-tab.languages")
  
  const [formData, setFormData] = useState<CandidateFormData>({
    first_name: "",
    last_name: "",
    email: "",
    passport_id: "",
    job_role: "",
    core_skills: "",
    preferred_language: "EN",
    passport_document: null,
    profile_photo: null,
    verification_photo: null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [previewDocument, setPreviewDocument] = useState<string | null>(null)
  const [skillsList, setSkillsList] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [photoQuality, setPhotoQuality] = useState<Record<PhotoField, PassportPhotoQualityResult | null>>({
    passport_document: null,
    profile_photo: null,
  })
  const [photoQualityChecking, setPhotoQualityChecking] = useState<Record<PhotoField, boolean>>({
    passport_document: false,
    profile_photo: false,
  })
  const [passportMatch, setPassportMatch] = useState<FaceMatchResult | null>(null)
  const [passportMatchChecking, setPassportMatchChecking] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if ((mode === 'edit' || mode === 'view') && candidate) {
        setFormData({
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          email: candidate.email,
          passport_id: candidate.passport_id,
          job_role: candidate.job_role,
          core_skills: candidate.core_skills,
          preferred_language: candidate.preferred_language,
          passport_document: null,
          profile_photo: null,
          verification_photo: null,
        })
        setSkillsList(candidate.skills_list || [])
        setPreviewPhoto(candidate.profile_photo || null)
        setPreviewDocument(null)
        setPhotoQuality({ passport_document: null, profile_photo: null })
        setPhotoQualityChecking({ passport_document: false, profile_photo: false })
        setPassportMatch(null)
        setPassportMatchChecking(false)
      } else {
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          passport_id: "",
          job_role: "",
          core_skills: "",
          preferred_language: "EN",
          passport_document: null,
          profile_photo: null,
          verification_photo: null,
        })
        setSkillsList([])
        setPreviewPhoto(null)
        setPreviewDocument(null)
        setPhotoQuality({ passport_document: null, profile_photo: null })
        setPhotoQualityChecking({ passport_document: false, profile_photo: false })
        setPassportMatch(null)
        setPassportMatchChecking(false)
      }
      setErrors({})
      setTouchedFields({})
    }

    return () => {
      if (previewPhoto?.startsWith('blob:')) URL.revokeObjectURL(previewPhoto)
      if (previewDocument?.startsWith('blob:')) URL.revokeObjectURL(previewDocument)
    }
  }, [isOpen, mode, candidate])

  // Once both a passport document and a photo are present, sanity-check
  // that they plausibly show the same person - this is a loose check (see
  // PASSPORT_PHOTO_MATCH_THRESHOLD), not the real biometric verification
  // that happens later at interview time. A clear mismatch almost always
  // means the wrong document or photo was picked, so force a fresh
  // passport upload rather than silently accepting it. On a pass, the
  // uploaded photo (not a crop of the passport) becomes the reference
  // image used for that later real check.
  useEffect(() => {
    const passport = formData.passport_document
    const photo = formData.profile_photo
    if (!passport || !photo) {
      setPassportMatch(null)
      return
    }
    let cancelled = false
    setPassportMatchChecking(true)
    matchFaces(passport, photo)
      .then((result) => {
        if (cancelled) return
        setPassportMatch(result)
        if (result.status === 'ok' && result.score !== null) {
          if (result.score < PASSPORT_PHOTO_MATCH_THRESHOLD) {
            setFormData(prev => ({ ...prev, passport_document: null, verification_photo: null }))
            setPreviewDocument(null)
            setErrors(prev => ({
              ...prev,
              passport_document: t("errors.passportMismatch", { score: result.score!.toFixed(0) }),
            }))
            setTouchedFields(prev => ({ ...prev, passport_document: true }))
          } else {
            setFormData(prev => ({ ...prev, verification_photo: photo }))
          }
        }
      })
      .finally(() => {
        if (!cancelled) setPassportMatchChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [formData.passport_document, formData.profile_photo])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    if (name === 'core_skills') {
      const skills = value.split(',').map(s => s.trim()).filter(s => s)
      setSkillsList(skills)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: PhotoField) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }))

      const url = URL.createObjectURL(file)
      if (field === 'profile_photo') {
        setPreviewPhoto(url)
      } else {
        setPreviewDocument(url)
        setFormData(prev => ({ ...prev, verification_photo: null }))
      }

      setPhotoQuality(prev => ({ ...prev, [field]: null }))
      setPhotoQualityChecking(prev => ({ ...prev, [field]: true }))
      checkPassportPhotoQuality(file)
        .then((result) => setPhotoQuality(prev => ({ ...prev, [field]: result })))
        .finally(() => setPhotoQualityChecking(prev => ({ ...prev, [field]: false })))
    }
  }

  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name?.trim()) newErrors.first_name = t("errors.firstNameRequired")
    if (!formData.last_name?.trim()) newErrors.last_name = t("errors.lastNameRequired")

    if (!formData.email?.trim()) {
      newErrors.email = t("errors.emailRequired")
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("errors.emailInvalid")
    }

    if (!formData.passport_id?.trim()) newErrors.passport_id = t("errors.passportRequired")
    if (!formData.job_role) newErrors.job_role = t("errors.jobRoleRequired")

    if (!formData.core_skills?.trim()) {
      newErrors.core_skills = t("errors.skillsRequired")
    } else {
      const skills = formData.core_skills.split(',').map(s => s.trim()).filter(s => s)
      if (skills.length === 0) {
        newErrors.core_skills = t("errors.skillsMin")
      } else if (skills.length > 20) {
        newErrors.core_skills = t("errors.skillsMax")
      }
    }

    if (!formData.preferred_language) newErrors.preferred_language = t("errors.languageRequired")

    if (mode === 'create' && !formData.passport_document && !candidate?.passport_document) {
      newErrors.passport_document = t("errors.documentRequired")
    } else if (formData.passport_document && photoQualityChecking.passport_document) {
      newErrors.passport_document = t("errors.photoQualityChecking")
    } else if (formData.passport_document && photoQuality.passport_document && passportQualityMessage(photoQuality.passport_document.status, 'document')) {
      newErrors.passport_document = passportQualityMessage(photoQuality.passport_document.status, 'document')!
    }

    if (mode === 'create' && !formData.profile_photo && !candidate?.profile_photo) {
      newErrors.profile_photo = t("errors.photoRequired")
    } else if (formData.profile_photo && photoQualityChecking.profile_photo) {
      newErrors.profile_photo = t("errors.photoQualityChecking")
    } else if (formData.profile_photo && photoQuality.profile_photo && passportQualityMessage(photoQuality.profile_photo.status, 'photo')) {
      newErrors.profile_photo = passportQualityMessage(photoQuality.profile_photo.status, 'photo')!
    }

    if (formData.passport_document && formData.profile_photo && passportMatchChecking) {
      newErrors.passport_document = t("errors.passportMatchChecking")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      const allFields = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
      setTouchedFields(allFields)
      return
    }

    setIsLoading(true)

    try {
      if (mode === 'create') {
        await candidateService.createCandidate(formData)
      } else if (mode === 'edit' && candidate) {
        await candidateService.updateCandidate(candidate.id, formData)
      }

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error: any) {
      console.error('Failed to save candidate:', error)
      if (error.response?.data) {
        const backendErrors: Record<string, string> = {}
        Object.entries(error.response.data).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            backendErrors[key] = value[0]
          } else if (typeof value === 'string') {
            backendErrors[key] = value
          }
        })
        setErrors(backendErrors)
      } else {
        setErrors({ form: t("errors.saveFailed") })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!candidate || !confirm(t("errors.confirmDelete"))) return

    setDeleteLoading(true)
    try {
      await candidateService.deleteCandidate(candidate.id)
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error) {
      console.error('Failed to delete candidate:', error)
      setErrors({ form: t("errors.deleteFailed") })
    } finally {
      setDeleteLoading(false)
    }
  }

  const isViewMode = mode === 'view'
  const isEditMode = mode === 'edit'
  const isCreateMode = mode === 'create'
  const canEdit = (isCreateMode || isEditMode) &&
    (userRole !== 'B2B_TEAM_MEMBER' || candidate?.created_by === currentUserId)

  // Shown as soon as the check completes, independent of touchedFields/
  // submit attempts - without this, a failed quality check produced zero
  // visible feedback (the "Checking..." spinner just disappeared) until
  // the candidate happened to try submitting the form.
  const passportQualityIssue =
    formData.passport_document && photoQuality.passport_document
      ? passportQualityMessage(photoQuality.passport_document.status, 'document')
      : null
  const profilePhotoQualityIssue =
    formData.profile_photo && photoQuality.profile_photo
      ? passportQualityMessage(photoQuality.profile_photo.status, 'photo')
      : null

  return (
    <>
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    {mode === 'create' && t("title.add")}
                    {mode === 'edit' && t("title.edit")}
                    {mode === 'view' && t("title.view")}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                {errors.form && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {errors.form}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("photo.label")} {mode === 'create' && '*'}
                    </label>
                    {isViewMode ? (
                      candidate?.profile_photo && (
                        <Image
                          src={candidate.profile_photo}
                          alt="Candidate photo"
                          width={96}
                          height={96}
                          className="rounded-lg object-cover w-24 h-24 border border-gray-200"
                        />
                      )
                    ) : (
                      <div>
                        <label className={`flex items-center gap-4 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-purple-500 transition ${
                          touchedFields.profile_photo && errors.profile_photo ? 'border-red-500' : 'border-gray-300'
                        }`}>
                          <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {previewPhoto ? (
                              <Image
                                src={previewPhoto}
                                alt="Photo preview"
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Upload size={22} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            {formData.profile_photo ? (
                              <span className="text-sm text-green-600">{formData.profile_photo.name}</span>
                            ) : candidate?.profile_photo ? (
                              <span className="text-sm text-purple-600">{t("photo.replace")}</span>
                            ) : (
                              <span className="text-sm text-gray-600">{t("photo.uploadHint")}</span>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5">
                              {t("photo.fileHint")}
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={(e) => handleFileChange(e, 'profile_photo')}
                            className="hidden"
                          />
                        </label>
                        {photoQualityChecking.profile_photo && (
                          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" />
                            {t("photo.checkingQuality")}
                          </p>
                        )}
                        {!photoQualityChecking.profile_photo && profilePhotoQualityIssue && (
                          <p className="mt-1 text-xs text-red-600">{profilePhotoQualityIssue}</p>
                        )}
                        {touchedFields.profile_photo && errors.profile_photo && !profilePhotoQualityIssue && (
                          <p className="mt-1 text-xs text-red-600">{errors.profile_photo}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("fields.firstName")} *
                      </label>
                      {isViewMode ? (
                        <p className="text-gray-900 p-2 border rounded-lg bg-gray-50">
                          {formData.first_name}
                        </p>
                      ) : (
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('first_name')}
                          disabled={!canEdit}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            touchedFields.first_name && errors.first_name ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      )}
                      {touchedFields.first_name && errors.first_name && (
                        <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("fields.lastName")} *
                      </label>
                      {isViewMode ? (
                        <p className="text-gray-900 p-2 border rounded-lg bg-gray-50">
                          {formData.last_name}
                        </p>
                      ) : (
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('last_name')}
                          disabled={!canEdit}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            touchedFields.last_name && errors.last_name ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      )}
                      {touchedFields.last_name && errors.last_name && (
                        <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("fields.email")} *
                      </label>
                      {isViewMode ? (
                        <p className="text-gray-900 p-2 border rounded-lg bg-gray-50">
                          {formData.email}
                        </p>
                      ) : (
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('email')}
                          disabled={!canEdit}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            touchedFields.email && errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      )}
                      {touchedFields.email && errors.email && (
                        <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("fields.passportId")} *
                      </label>
                      {isViewMode ? (
                        <p className="text-gray-900 p-2 border rounded-lg bg-gray-50">
                          {formData.passport_id}
                        </p>
                      ) : (
                        <input
                          type="text"
                          name="passport_id"
                          value={formData.passport_id}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('passport_id')}
                          disabled={!canEdit}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            touchedFields.passport_id && errors.passport_id ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      )}
                      {touchedFields.passport_id && errors.passport_id && (
                        <p className="mt-1 text-xs text-red-600">{errors.passport_id}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("fields.jobRole")} *
                      </label>
                      {isViewMode ? (
                        <p className="text-gray-900 p-2 border rounded-lg bg-gray-50">
                          {formData.job_role ? tRoles(formData.job_role) : formData.job_role}
                        </p>
                      ) : (
                        <select
                          name="job_role"
                          value={formData.job_role}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('job_role')}
                          disabled={!canEdit}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            touchedFields.job_role && errors.job_role ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">{t("fields.selectRole")}</option>
                          {JOB_ROLES.map(role => (
                            <option key={role.key} value={role.key}>
                              {tRoles(role.key)}
                            </option>
                          ))}
                        </select>
                      )}
                      {touchedFields.job_role && errors.job_role && (
                        <p className="mt-1 text-xs text-red-600">{errors.job_role}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("fields.preferredLanguage")} *
                      </label>
                      {isViewMode ? (
                        <p className="text-gray-900 p-2 border rounded-lg bg-gray-50">
                          {formData.preferred_language ? tLanguages(formData.preferred_language) : formData.preferred_language}
                        </p>
                      ) : (
                        <select
                          name="preferred_language"
                          value={formData.preferred_language}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('preferred_language')}
                          disabled={!canEdit}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            touchedFields.preferred_language && errors.preferred_language ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          {LANGUAGES.map(lang => (
                            <option key={lang.key} value={lang.key}>
                              {tLanguages(lang.key)}
                            </option>
                          ))}
                        </select>
                      )}
                      {touchedFields.preferred_language && errors.preferred_language && (
                        <p className="mt-1 text-xs text-red-600">{errors.preferred_language}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("fields.coreSkills")} *
                    </label>
                    {isViewMode ? (
                      <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50">
                        {skillsList.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <>
                        <textarea
                          name="core_skills"
                          value={formData.core_skills}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('core_skills')}
                          disabled={!canEdit}
                          rows={3}
                          placeholder={t("fields.skillsPlaceholder")}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            touchedFields.core_skills && errors.core_skills ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {t("fields.skillsHint")}
                        </p>
                      </>
                    )}
                    {touchedFields.core_skills && errors.core_skills && (
                      <p className="mt-1 text-xs text-red-600">{errors.core_skills}</p>
                    )}
                  </div>

                  {!isViewMode && skillsList.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{t("skillsPreviewLabel")}</p>
                      <div className="flex flex-wrap gap-2">
                        {skillsList.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("fields.passportDocument")} {mode === 'create' && '*'}
                      </label>
                      {isViewMode ? (
                        candidate?.passport_document && (
                          <a
                            href={candidate.passport_document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50 text-purple-600 hover:text-purple-700"
                          >
                            <FileText size={16} />
                            <span className="text-sm">{t("viewDocument")}</span>
                          </a>
                        )
                      ) : (
                        <div>
                          <label className={`block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 transition ${
                            errors.passport_document ? 'border-red-500' : 'border-gray-300'
                          }`}>
                            <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                            {formData.passport_document ? (
                              <span className="text-sm text-green-600">{formData.passport_document.name}</span>
                            ) : candidate?.passport_document ? (
                              <span className="text-sm text-purple-600">{t("replaceDocument")}</span>
                            ) : (
                              <span className="text-sm text-gray-600">{t("uploadDocument")}</span>
                            )}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(e, 'passport_document')}
                              className="hidden"
                            />
                          </label>
                          <p className="mt-1 text-xs text-gray-500">{t("photo.documentFileHint")}</p>
                          {touchedFields.passport_document && errors.passport_document && !passportQualityIssue && (
                            <p className="mt-1 text-xs text-red-600">{errors.passport_document}</p>
                          )}
                          {photoQualityChecking.passport_document && (
                            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                              <Loader2 size={12} className="animate-spin" />
                              {t("photo.checkingQuality")}
                            </p>
                          )}
                          {!photoQualityChecking.passport_document && passportQualityIssue && (
                            <p className="mt-1 text-xs text-red-600">{passportQualityIssue}</p>
                          )}
                          <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 p-2">
                            <p className="text-xs font-medium text-blue-800 mb-1">{t("photo.guidelinesTitle")}</p>
                            <ul className="text-xs text-blue-700 list-disc list-inside space-y-0.5">
                              {PASSPORT_PHOTO_GUIDELINES.map((tip) => (
                                <li key={tip}>{tip}</li>
                              ))}
                            </ul>
                            <p className="text-xs text-blue-700 mt-1">
                              {t("photo.matchTip")}
                            </p>
                          </div>
                          {formData.passport_document && formData.profile_photo && (
                            <div className="mt-2">
                              {passportMatchChecking ? (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Loader2 size={12} className="animate-spin" />
                                  {t("errors.passportMatchChecking")}
                                </p>
                              ) : passportMatch?.status === 'ok' && passportMatch.score !== null ? (
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle2 size={12} />
                                  {t("photo.matchSuccess", { score: passportMatch.score.toFixed(0) })}
                                </p>
                              ) : passportMatch?.status === 'no-face-a' ? (
                                <p className="text-xs text-amber-600">
                                  {t("photo.matchNoFaceA")}
                                </p>
                              ) : passportMatch?.status === 'no-face-b' ? (
                                <p className="text-xs text-amber-600">
                                  {t("photo.matchNoFaceB")}
                                </p>
                              ) : passportMatch?.status === 'skipped' ? (
                                <p className="text-xs text-gray-500">
                                  {t("photo.matchSkipped")}
                                </p>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {previewDocument && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">{t("documentPreview")}:</p>
                      {previewDocument.endsWith('.pdf') ? (
                        <iframe
                          src={previewDocument}
                          className="w-full h-40 border rounded-lg"
                          title="Document preview"
                        />
                      ) : (
                        <Image
                          src={previewDocument}
                          alt="Document preview"
                          width={200}
                          height={200}
                          className="max-w-full h-auto border rounded-lg"
                        />
                      )}
                    </div>
                  )}

                  {isViewMode && candidate && (
                    <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                      <p>{t("createdBy", { name: candidate.created_by_name })}</p>
                      <p>{t("createdAt", { date: new Date(candidate.created_at).toLocaleString() })}</p>
                      <p>{t("updatedAt", { date: new Date(candidate.updated_at).toLocaleString() })}</p>
                      {candidate.company_name && <p>{t("company", { name: candidate.company_name })}</p>}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2">
                    {isViewMode && candidate?.created_by === currentUserId && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mr-auto"
                      >
                        {deleteLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            {t("buttons.deleting")}
                          </>
                        ) : (
                          <>
                            <Trash2 size={16} />
                            {t("buttons.delete")}
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      {isViewMode ? t("buttons.close") : t("buttons.cancel")}
                    </button>

                    {!isViewMode && canEdit && (
                      <button
                        type="submit"
                        disabled={isLoading || photoQualityChecking.passport_document || photoQualityChecking.profile_photo || passportMatchChecking}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            {t("buttons.saving")}
                          </>
                        ) : (
                          mode === 'create' ? t("buttons.add") : t("buttons.save")
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
    </>
  )
}