"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useProfile } from "../../../../../hooks/useProfile"
import { Loader2 } from "lucide-react"
import { LANGUAGES } from "../../../../../api/auth/endpoints"

const COMPANY_SIZES = [
  { key: '1-10', label: '1-10 employees' },
  { key: '11-50', label: '11-50 employees' },
  { key: '51-200', label: '51-200 employees' },
  { key: '201-1000', label: '201-1000 employees' },
  { key: '1000+', label: '1000+ employees' },
]

export default function EditProfileTab() {
  const t = useTranslations("dashboard.business.settings.edit-profile-tab")
  const { profile, loading, error, updateProfile, fetchProfile } = useProfile()

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company_name: "",
    company_registration_number: "",
    company_size: "",
    industry: "",
    phone_number: "",
    country: "",
    city: "",
    address: "",
    website: "",
    preferred_language: "EN",
  })

  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        company_name: profile.company_name || "",
        company_registration_number: profile.company_registration_number || "",
        company_size: profile.company_size || "",
        industry: profile.industry || "",
        phone_number: profile.phone_number || "",
        country: profile.country || "",
        city: profile.city || "",
        address: profile.address || "",
        website: profile.website || "",
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
      company_name: formData.company_name,
      phone_number: formData.phone_number,
      country: formData.country,
      city: formData.city,
      address: formData.address || undefined,
      website: formData.website || undefined,
      industry: formData.industry || undefined,
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
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Profile Picture</h3>
          <p className="text-sm text-gray-600 mb-4">Update your profile picture</p>
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Change
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">Profile updated successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={formData.email}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
          <input
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name *</label>
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration Number</label>
          <input
            type="text"
            value={formData.company_registration_number}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Size</label>
          <select
            name="company_size"
            value={formData.company_size}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          >
            <option value="">Select size</option>
            {COMPANY_SIZES.map((size) => (
              <option key={size.key} value={size.key}>{size.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
          <input
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            placeholder="e.g., Technology, Healthcare"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://example.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Country *</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Language</label>
          <select
            name="preferred_language"
            value={formData.preferred_language}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.key} value={lang.key}>{lang.label}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Company address"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

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
            "Save"
          )}
        </button>
      </div>
    </form>
  )
}
