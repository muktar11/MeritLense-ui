"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { CheckCircle, FileText, ExternalLink } from "lucide-react"
import ProgressStepper from "../components/auth/progress-stepper"
import { JOB_ROLES, NATIONALITIES, LANGUAGES, COMPANY_SIZES } from "../../../../api/auth/endpoints"

const getLabel = (key: string, options: { key: string; label: string }[]): string => {
  const option = options.find(opt => opt.key === key)
  return option?.label || key
}

export default function PreviewRegistrationPage() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1]

  const [registrationType, setRegistrationType] = useState<string | null>(null)
  const [candidateData, setCandidateData] = useState<any>(null)
  const [companyData, setCompanyData] = useState<any>(null)
  const [email, setEmail] = useState<string>("")

  useEffect(() => {
    const type = localStorage.getItem("registrationType")
    setRegistrationType(type)
    
    // Get email from registration data or from verification storage
    const registrationEmail = localStorage.getItem("registrationEmail")
    if (registrationEmail) {
      setEmail(registrationEmail)
    }

    if (type === "b2c") {
      const candidate = JSON.parse(localStorage.getItem("candidateRegistration") || "{}")
      setCandidateData(candidate)
    } else if (type === "b2b") {
      const company = JSON.parse(localStorage.getItem("employeeRegistration") || "{}")
      setCompanyData(company)
    }
  }, [])

  const handleNext = () => {
    router.push(`/${locale}/auth/register/contract`)
  }

  const handleBack = () => {
    if (registrationType === "b2c") {
      router.push(`/${locale}/auth/register/candidate`)
    } else {
      router.push(`/${locale}/auth/register/employer`)
    }
  }

  // Document preview function
  const renderDocumentLink = (file: File | null, label: string) => {
    if (!file) return <span className="text-gray-400">Not uploaded</span>
    
    // Create object URL for preview (in real app, you might want to upload first)
    const url = URL.createObjectURL(file)
    
    return (
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-blue-500" />
        <span className="text-sm text-gray-700 truncate max-w-200px">{file.name}</span>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={14} />
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="w-10 h-10 bg-linear-to-br from-purple-400 to-blue-600 rounded-lg"></div>
        <select className="text-sm text-gray-600 border rounded-md px-2 py-1">
          <option>English</option>
        </select>
      </div>

      {/* Progress Stepper */}
      <ProgressStepper currentStep={3} />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-green-500" size={28} />
            <h1 className="text-2xl font-bold">Review Your Information</h1>
          </div>
          <p className="text-gray-600 mb-8">Please verify that all information is correct before proceeding.</p>

          {/* Email (common for both types) */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <label className="block text-sm font-medium text-blue-800 mb-1">Email Address (for verification)</label>
            <p className="text-blue-900 font-medium">{email || "Not provided"}</p>
          </div>

          <div className="space-y-8">
            {/* B2C - Individual Candidate Preview */}
            {registrationType === "b2c" && candidateData && (
              <>
                {/* Personal Information Section */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Personal Information</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                      <p className="text-gray-900 font-medium">
                        {candidateData.first_name} {candidateData.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                      <p className="text-gray-900 font-medium">{candidateData.phone_number || "—"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                      <p className="text-gray-900 font-medium">{candidateData.date_of_birth || "—"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                      <p className="text-gray-900 font-medium">{candidateData.address || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Professional Information Section */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Professional Information</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Passport ID</label>
                      <p className="text-gray-900 font-medium">{candidateData.passport_id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Job Role</label>
                      <p className="text-gray-900 font-medium">
                        {getLabel(candidateData.job_role, JOB_ROLES)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Nationality</label>
                      <p className="text-gray-900 font-medium">
                        {getLabel(candidateData.nationality, NATIONALITIES)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Preferred Language</label>
                      <p className="text-gray-900 font-medium">
                        {getLabel(candidateData.preferred_language, LANGUAGES)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Uploaded Documents</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">ID Document</label>
                      {renderDocumentLink(candidateData.id_document, "ID Document")}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Resume/CV</label>
                      {renderDocumentLink(candidateData.resume_document, "Resume")}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* B2B - Company Preview */}
            {registrationType === "b2b" && companyData && (
              <>
                {/* Account Information Section */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Account Information</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                      <p className="text-gray-900 font-medium">
                        {companyData.first_name} {companyData.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-gray-900 font-medium">{companyData.email}</p>
                    </div>
                  </div>
                </div>

                {/* Company Information Section */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Company Information</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Company Name</label>
                      <p className="text-gray-900 font-medium">{companyData.company_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Registration Number</label>
                      <p className="text-gray-900 font-medium">{companyData.company_registration_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Company Size</label>
                      <p className="text-gray-900 font-medium">
                        {getLabel(companyData.company_size, COMPANY_SIZES)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Industry</label>
                      <p className="text-gray-900 font-medium">{companyData.industry || "—"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                      <p className="text-gray-900 font-medium">{companyData.phone_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Website</label>
                      <p className="text-gray-900 font-medium">{companyData.website || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Location</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Country</label>
                      <p className="text-gray-900 font-medium">{companyData.country}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">City</label>
                      <p className="text-gray-900 font-medium">{companyData.city}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                      <p className="text-gray-900 font-medium">{companyData.address || "—"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Preferred Language</label>
                      <p className="text-gray-900 font-medium">
                        {getLabel(companyData.preferred_language, LANGUAGES)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Uploaded Documents</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Registration Certificate</label>
                      {renderDocumentLink(companyData.registration_certificate, "Registration Certificate")}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Resachetified License</label>
                      {renderDocumentLink(companyData.resachetified_license, "License")}
                    </div>
                    {companyData.tax_id_document && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Tax ID Document</label>
                        {renderDocumentLink(companyData.tax_id_document, "Tax Document")}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Verification Status */}
          <div className="mt-8 p-4 bg-green-50 rounded-lg flex items-start gap-3">
            <CheckCircle className="text-green-500 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-green-800">Email Verified</p>
              <p className="text-sm text-green-700">
                Your email has been verified. You can now proceed to the next step.
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              ← Edit Information
            </button>
            <button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2 rounded-lg transition"
            >
              Save and Continue →
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 text-center mt-6">
            By continuing, you confirm that all the information provided is accurate and complete.
          </p>
        </div>
      </div>
    </div>
  )
}