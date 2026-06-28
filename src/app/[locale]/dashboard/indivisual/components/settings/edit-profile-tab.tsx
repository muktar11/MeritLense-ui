"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useProfile } from "../../../../../hooks/useProfile"
import { Loader2 } from "lucide-react"
import { JOB_ROLES, NATIONALITIES, LANGUAGES } from "../../../../../api/auth/endpoints"

export default function EditProfileTab() {
  const t = useTranslations("dashboard.indivisual.settings.edit-profile-tab")
  const { profile, loading, error, updateProfile, fetchProfile } = useProfile()

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    address: "",
    passport_id: "",
    job_role: "",
    nationality: "",
    preferred_language: "EN",
  })

  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone_number: profile.phone_number || "",
        date_of_birth: profile.date_of_birth || "",
        address: profile.address || "",
        passport_id: profile.passport_id || "",
        job_role: profile.job_role || "",
        nationality: profile.nationality || "",
        preferred_language: profile.preferred_language || "EN",
      })
    }
  }, [profile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const success = await updateProfile({
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone_number: formData.phone_number,
      date_of_birth: formData.date_of_birth || undefined,
      address: formData.address || undefined,
      passport_id: formData.passport_id,
      job_role: formData.job_role,
      nationality: formData.nationality,
      preferred_language: formData.preferred_language,
    })

    if (success) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Profile Avatar */}
      <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
        <div className="shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-teal-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl sm:text-2xl font-bold">
              {formData.first_name?.[0]}{formData.last_name?.[0]}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {t("profilePictureTitle")}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {t("profilePictureSubtitle")}
          </p>
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            {t("changeButton")}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">Profile updated successfully!</p>
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            First Name *
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Last Name *
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date of Birth
          </label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Passport ID (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Passport ID
          </label>
          <input
            type="text"
            value={formData.passport_id}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        {/* Job Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Job Role *
          </label>
          <select
            name="job_role"
            value={formData.job_role}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select job role</option>
            {JOB_ROLES.map((role) => (
              <option key={role.key} value={role.key}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nationality *
          </label>
          <select
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select nationality</option>
            {NATIONALITIES.map((nation) => (
              <option key={nation.key} value={nation.key}>
                {nation.label}
              </option>
            ))}
          </select>
        </div>

        {/* Preferred Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Preferred Language *
          </label>
          <select
            name="preferred_language"
            value={formData.preferred_language}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.key} value={lang.key}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Your address"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center sm:justify-end">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            t("saveButton")
          )}
        </button>
      </div>
    </form>
  )
}