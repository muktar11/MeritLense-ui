"use client"

import { useState, useEffect, Fragment } from "react"
import { useTranslations } from "next-intl"
import { 
  X, 
  Upload, 
  Loader2, 
  FileText,
  Trash2
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
  userRole = 'B2C'}: CandidateModalProps) {
  const t = useTranslations("dashboard.candidates.modal")
  
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
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [previewDocument, setPreviewDocument] = useState<string | null>(null)
  const [skillsList, setSkillsList] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
        })
        setSkillsList(candidate.skills_list || [])
        setPreviewPhoto(candidate.profile_photo || null)
        setPreviewDocument(null)
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
        })
        setSkillsList([])
        setPreviewPhoto(null)
        setPreviewDocument(null)
      }
      setErrors({})
      setTouchedFields({})
    }

    return () => {
      if (previewPhoto?.startsWith('blob:')) URL.revokeObjectURL(previewPhoto)
      if (previewDocument?.startsWith('blob:')) URL.revokeObjectURL(previewDocument)
    }
  }, [isOpen, mode, candidate])

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'passport_document' | 'profile_photo') => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }))
      
      const url = URL.createObjectURL(file)
      if (field === 'profile_photo') {
        setPreviewPhoto(url)
      } else {
        setPreviewDocument(url)
      }
    }
  }

  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name?.trim()) newErrors.first_name = "First name is required"
    if (!formData.last_name?.trim()) newErrors.last_name = "Last name is required"
    
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (!formData.passport_id?.trim()) newErrors.passport_id = "Passport ID is required"
    if (!formData.job_role) newErrors.job_role = "Job role is required"
    
    if (!formData.core_skills?.trim()) {
      newErrors.core_skills = "Skills are required"
    } else {
      const skills = formData.core_skills.split(',').map(s => s.trim()).filter(s => s)
      if (skills.length === 0) {
        newErrors.core_skills = "At least one skill is required"
      } else if (skills.length > 20) {
        newErrors.core_skills = "Maximum 20 skills allowed"
      }
    }

    if (!formData.preferred_language) newErrors.preferred_language = "Preferred language is required"

    if (mode === 'create' && !formData.passport_document && !candidate?.passport_document) {
      newErrors.passport_document = "Passport document is required"
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
        setErrors({ form: 'Failed to save candidate. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!candidate || !confirm('Are you sure you want to delete this candidate?')) return

    setDeleteLoading(true)
    try {
      await candidateService.deleteCandidate(candidate.id)
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error) {
      console.error('Failed to delete candidate:', error)
      setErrors({ form: 'Failed to delete candidate. Please try again.' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const isViewMode = mode === 'view'
  const isEditMode = mode === 'edit'
  const isCreateMode = mode === 'create'
  const canEdit = (isCreateMode || isEditMode) && 
    (userRole !== 'B2B_TEAM_MEMBER' || candidate?.created_by === candidate?.id)

  return (
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
                    {mode === 'create' && "Add New Candidate"}
                    {mode === 'edit' && "Edit Candidate"}
                    {mode === 'view' && "Candidate Details"}
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
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
                        {previewPhoto ? (
                          <Image
                            src={previewPhoto}
                            alt="Profile"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                            {formData.first_name?.[0]}{formData.last_name?.[0]}
                          </div>
                        )}
                      </div>
                      {!isViewMode && canEdit && (
                        <label className="absolute bottom-0 right-0 bg-purple-500 text-white p-1 rounded-full cursor-pointer hover:bg-purple-600">
                          <Upload size={14} />
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={(e) => handleFileChange(e, 'profile_photo')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Profile Photo</p>
                      <p className="text-xs text-gray-500">JPG, JPEG or PNG (Max 5MB)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
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
                        Last Name *
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
                        Email *
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
                        Passport ID *
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
                        Job Role *
                      </label>
                      {isViewMode ? (
                        <p className="text-gray-900 p-2 border rounded-lg bg-gray-50">
                          {JOB_ROLES.find(r => r.key === formData.job_role)?.label || formData.job_role}
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
                          <option value="">Select Role</option>
                          {JOB_ROLES.map(role => (
                            <option key={role.key} value={role.key}>
                              {role.label}
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
                        Preferred Language *
                      </label>
                      {isViewMode ? (
                        <p className="text-gray-900 p-2 border rounded-lg bg-gray-50">
                          {LANGUAGES.find(l => l.key === formData.preferred_language)?.label || formData.preferred_language}
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
                              {lang.label}
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
                      Core Skills *
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
                          placeholder="e.g., Cleaning, Cooking, First Aid"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            touchedFields.core_skills && errors.core_skills ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Enter skills separated by commas (max 20 skills)
                        </p>
                      </>
                    )}
                    {touchedFields.core_skills && errors.core_skills && (
                      <p className="mt-1 text-xs text-red-600">{errors.core_skills}</p>
                    )}
                  </div>

                  {!isViewMode && skillsList.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Skills Preview</p>
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
                        Passport Document {mode === 'create' && '*'}
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
                            <span className="text-sm">View Document</span>
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
                              <span className="text-sm text-purple-600">Replace Document</span>
                            ) : (
                              <span className="text-sm text-gray-600">Click to upload passport document</span>
                            )}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(e, 'passport_document')}
                              className="hidden"
                            />
                          </label>
                          <p className="mt-1 text-xs text-gray-500">PDF, JPG, JPEG, or PNG (Max 10MB)</p>
                          {touchedFields.passport_document && errors.passport_document && (
                            <p className="mt-1 text-xs text-red-600">{errors.passport_document}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {previewDocument && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Document Preview:</p>
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
                      <p>Created by: {candidate.created_by_name}</p>
                      <p>Created at: {new Date(candidate.created_at).toLocaleString()}</p>
                      <p>Last updated: {new Date(candidate.updated_at).toLocaleString()}</p>
                      {candidate.company_name && <p>Company: {candidate.company_name}</p>}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2">
                    {isViewMode && candidate?.created_by === candidate?.id && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mr-auto"
                      >
                        {deleteLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 size={16} />
                            Delete
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      {isViewMode ? 'Close' : 'Cancel'}
                    </button>
                    
                    {!isViewMode && canEdit && (
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          mode === 'create' ? 'Add Candidate' : 'Save Changes'
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
  )
}