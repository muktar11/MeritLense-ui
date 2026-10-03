"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Clock, Loader2, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import companyService, { RequestedCompanyDocument } from "@/app/api/company/endpoints"
import { profileAPI } from "@/app/api/profile/endpoints"

interface CompanyLicenseDocumentsProps {
  profile: Record<string, unknown>
  isCompanyOwner: boolean
  canUploadRequestedDocuments: boolean
  onLicenseUploaded: () => Promise<void>
}

const ACCEPTED_DOCUMENT_TYPES = ".pdf,.jpg,.jpeg,.png"

export function CompanyLicenseDocuments({
  profile,
  isCompanyOwner,
  canUploadRequestedDocuments,
  onLicenseUploaded,
}: CompanyLicenseDocumentsProps) {
  const t = useTranslations("dashboard.business.company-profile")
  const [requests, setRequests] = useState<RequestedCompanyDocument[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [requestsError, setRequestsError] = useState("")
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [requestedFiles, setRequestedFiles] = useState<Record<number, File>>({})
  const [uploading, setUploading] = useState<"license" | number | null>(null)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState("")

  const refreshRequests = async () => {
    setRequestsError("")
    try {
      const response = await companyService.getDocumentRequests()
      setRequests(response.results)
    } catch (error) {
      console.error("Failed to load requested company documents:", error)
      setRequestsError(t("documentRequests.loadError"))
    } finally {
      setRequestsLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    companyService.getDocumentRequests()
      .then((response) => {
        if (active) setRequests(response.results)
      })
      .catch((error) => {
        console.error("Failed to load requested company documents:", error)
        if (active) setRequestsError(t("documentRequests.loadError"))
      })
      .finally(() => {
        if (active) setRequestsLoading(false)
      })
    return () => {
      active = false
    }
  }, [t])

  const uploadLicense = async () => {
    if (!licenseFile || !isCompanyOwner) return
    setUploadError("")
    setUploadSuccess("")
    setUploading("license")
    try {
      await profileAPI.uploadDocument("license", licenseFile)
      setLicenseFile(null)
      setUploadSuccess(t("license.uploadSuccess"))
      await onLicenseUploaded()
    } catch (error) {
      console.error("Failed to upload business license:", error)
      setUploadError(t("license.uploadError"))
    } finally {
      setUploading(null)
    }
  }

  const uploadRequestedDocument = async (request: RequestedCompanyDocument) => {
    const file = requestedFiles[request.id]
    if (!file) return
    setUploadError("")
    setUploadSuccess("")
    setUploading(request.id)
    try {
      await companyService.uploadRequestedDocument(request.id, file)
      setRequestedFiles((current) => {
        const next = { ...current }
        delete next[request.id]
        return next
      })
      setUploadSuccess(t("documentRequests.uploadSuccess"))
      await refreshRequests()
    } catch (error) {
      console.error("Failed to upload requested company document:", error)
      setUploadError(t("documentRequests.uploadError"))
    } finally {
      setUploading(null)
    }
  }

  const hasLicense = profile.trade_license_uploaded === true
  const verificationStatus = String(profile.documents_verification_status || "").toUpperCase()
  const licenseApproved = profile.company_is_verified === true
  const pendingRequests = requests.filter((request) => request.status === "PENDING")

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <Card className={!hasLicense || verificationStatus === "REJECTED" ? "border-amber-300" : "border-blue-200"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {licenseApproved ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : hasLicense ? (
              <Clock className="h-5 w-5 text-blue-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            {t("license.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {licenseApproved
              ? t("license.approved")
              : !hasLicense || verificationStatus === "REJECTED"
              ? t("license.incomplete")
              : t("license.pendingReview")}
          </p>
          {isCompanyOwner && !licenseApproved ? (
            <>
              <label className="block">
                <span className="sr-only">{t("license.chooseFile")}</span>
                <input
                  type="file"
                  accept={ACCEPTED_DOCUMENT_TYPES}
                  onChange={(event) => setLicenseFile(event.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-md border p-2 text-sm"
                />
              </label>
              <Button onClick={uploadLicense} disabled={!licenseFile || uploading !== null}>
                {uploading === "license" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {hasLicense ? t("license.replaceButton") : t("license.uploadButton")}
              </Button>
            </>
          ) : (
            !isCompanyOwner && (
              <p className="text-sm text-muted-foreground">{t("license.ownerUploadOnly")}</p>
            )
          )}
        </CardContent>
      </Card>

      {(uploadError || uploadSuccess) && (
        <p className={`text-sm ${uploadError ? "text-red-600" : "text-green-600"}`} role="status">
          {uploadError || uploadSuccess}
        </p>
      )}

      {requestsLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("documentRequests.loading")}
        </div>
      ) : requestsError ? (
        <p className="text-sm text-red-600" role="alert">{requestsError}</p>
      ) : pendingRequests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("documentRequests.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="space-y-2 rounded-md border p-4">
                <p className="font-medium">{request.name}</p>
                {canUploadRequestedDocuments ? (
                  <>
                    <input
                      type="file"
                      accept={ACCEPTED_DOCUMENT_TYPES}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) setRequestedFiles((current) => ({ ...current, [request.id]: file }))
                      }}
                      className="block w-full cursor-pointer rounded-md border p-2 text-sm"
                    />
                    <Button
                      onClick={() => void uploadRequestedDocument(request)}
                      disabled={!requestedFiles[request.id] || uploading !== null}
                    >
                      {uploading === request.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("documentRequests.uploadButton")}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("license.ownerUploadOnly")}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
