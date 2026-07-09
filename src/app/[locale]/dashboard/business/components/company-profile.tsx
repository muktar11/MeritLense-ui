"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Download, LogOut, Loader2, Plus, MoreVertical, Mail, UserCheck, Clock, FileSignature, CheckCircle2, History } from "lucide-react"
import { useProfile } from "../../../../hooks/useProfile"
import { useAuth } from "../../../../hooks/useAuth"
import { LANGUAGES } from "../../../../api/auth/endpoints"
import { ChangePassword } from "./change-password"
import { InviteTeamModal } from "./invite-team-modal"
import { PendingInvitations } from "./pending-invitations"
import { AuditTrailModal } from "@/components/agreements/AuditTrailModal"
import teamService from "@/app/api/team/endpoints"
import type { TeamMember, TeamInvitation } from "@/app/api/team/types"
import agreementService from "@/app/api/agreements/endpoints"
import type { Agreement } from "@/app/api/agreements/types"
import { format } from "date-fns"

const REQUIRED_AGREEMENT_TYPES = ["B2B_AGREEMENT", "DPA"] as const

export function CompanyProfile() {
  const t = useTranslations("dashboard.business.company-profile")
  const locale = useLocale()
  const router = useRouter()
  const { profile, loading, error, updateProfile } = useProfile()
  const { logout } = useAuth()

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [agreementsLoading, setAgreementsLoading] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ id: string; label: string } | null>(null)
  const [updatingMember, setUpdatingMember] = useState<number | null>(null)
  
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    email: "",
    phone_number: "",
    country: "",
    city: "",
    address: "",
    website: "",
    industry: "",
    preferred_language: "EN",
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        company_name: profile.company_name || "",
        email: profile.email || "",
        phone_number: profile.phone_number || "",
        country: profile.country || "",
        city: profile.city || "",
        address: profile.address || "",
        website: profile.website || "",
        industry: profile.industry || "",
        preferred_language: profile.preferred_language || "EN",
      })
    }
  }, [profile])

  useEffect(() => {
    fetchTeamData()
    fetchAgreements()
  }, [])

  const handleDownloadAgreement = async (agreementId: string) => {
    try {
      const { url } = await agreementService.getDownloadUrl(agreementId)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (error) {
      console.error('Failed to get agreement download URL:', error)
    }
  }

  const fetchAgreements = async () => {
    setAgreementsLoading(true)
    try {
      const data = await agreementService.getStatus()
      setAgreements(data)
    } catch (error) {
      console.error('Failed to fetch agreement status:', error)
    } finally {
      setAgreementsLoading(false)
    }
  }

  const fetchTeamData = async () => {
    setTeamLoading(true)
    try {
      const [members, invitations] = await Promise.all([
        teamService.getTeamMembers(),
        teamService.getPendingInvitations()
      ])
      setTeamMembers(members)
      setPendingInvitations(invitations)
    } catch (error) {
      console.error('Failed to fetch team data:', error)
    } finally {
      setTeamLoading(false)
    }
  }

  const handleInviteSuccess = () => {
    fetchTeamData()
  }

  const handleCancelInvitation = async (invitationId: number) => {
    try {
      await teamService.cancelInvitation(invitationId)
      await fetchTeamData()
    } catch (error) {
      console.error('Failed to cancel invitation:', error)
    }
  }

  const handleUpdateMemberPermission = async (memberId: number, permissions: string[]) => {
    setUpdatingMember(memberId)
    try {
      await teamService.updateTeamMember(memberId, { permissions })
      await fetchTeamData()
    } catch (error) {
      console.error('Failed to update member permissions:', error)
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleUpdateMemberRole = async (memberId: number, jobTitle: string) => {
    setUpdatingMember(memberId)
    try {
      await teamService.updateTeamMember(memberId, { job_title: jobTitle })
      await fetchTeamData()
    } catch (error) {
      console.error('Failed to update member role:', error)
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this team member?')) return
    
    setUpdatingMember(memberId)
    try {
      await teamService.removeTeamMember(memberId)
      await fetchTeamData()
    } catch (error) {
      console.error('Failed to remove team member:', error)
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    const success = await updateProfile(formData)
    if (success) {
      setSaveSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  const handleLogout = () => {
    logout()
  }

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="text-sm bg-transparent whitespace-nowrap">
            <span className="mr-2">👤</span> {t("myProfile")}
          </Button>
          <Button variant="outline" size="sm" className="text-sm bg-transparent whitespace-nowrap">
            <span className="mr-2">🔔</span> {t("notification")}
          </Button>
          <span className="text-sm font-medium">{t("more")}</span>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm bg-transparent whitespace-nowrap"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> {t("logout")}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {saveSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">Company profile updated successfully!</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Card>
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t("companyDescription")}</CardTitle>
            {!isEditing ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed cursor-pointer hover:border-purple-500 transition">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground text-center">{t("uploadLogo")}</span>
              </div>

              <div className="flex-1 space-y-4 min-w-0">
                <div>
                  <label className="text-sm font-medium">{t("companyName")}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    />
                  ) : (
                    <p className="text-sm text-foreground truncate">{formData.company_name}</p>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>{t("companyDescriptionText")}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{t("agency")}</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{t("sales")}</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{t("market")}</span>
                </div>
                <div>
                  <span className="text-sm font-medium cursor-pointer text-purple-600 hover:underline">{t("addRole")}</span>
                </div>
              </div>

              <div className="space-y-3 shrink-0 min-w-50">
                <div>
                  <label className="text-xs text-muted-foreground">{t("email")}</label>
                  <p className="text-sm font-medium truncate">{formData.email}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("phone")}</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full mt-1 px-3 py-1 text-sm border rounded"
                    />
                  ) : (
                    <p className="text-sm font-medium truncate">{formData.phone_number}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("country")}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full mt-1 px-3 py-1 text-sm border rounded"
                    />
                  ) : (
                    <p className="text-sm font-medium truncate">{formData.country}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("city")}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full mt-1 px-3 py-1 text-sm border rounded"
                    />
                  ) : (
                    <p className="text-sm font-medium truncate">{formData.city}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("website")}</label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full mt-1 px-3 py-1 text-sm border rounded"
                    />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-1 truncate">
                      {formData.website} 
                      {formData.website && (
                        <a 
                          href={formData.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="cursor-pointer text-purple-600 hover:underline"
                        >
                          ↗
                        </a>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("preferredLanguage")}</label>
                  {isEditing ? (
                    <select
                      name="preferred_language"
                      value={formData.preferred_language}
                      onChange={handleInputChange}
                      className="w-full mt-1 px-3 py-1 text-sm border rounded"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.key} value={lang.key}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium truncate">
                      {LANGUAGES.find(l => l.key === formData.preferred_language)?.label || formData.preferred_language}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">{t("address")}</label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                />
              ) : (
                <p className="text-sm">{formData.address || "No address provided"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-2">
                <CardTitle className="text-lg">{t("manageUsers")}</CardTitle>
                <Button 
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> {t("addUser")}
                </Button>
              </CardHeader>
              <CardContent>
                {teamLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  </div>
                ) : (
                  <>
                    <PendingInvitations 
                      invitations={pendingInvitations}
                      onCancel={handleCancelInvitation}
                    />

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("columns.user")}</TableHead>
                            <TableHead>{t("columns.userRole")}</TableHead>
                            <TableHead>{t("columns.permission")}</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
{teamMembers.length === 0 && pendingInvitations.length === 0 ? (
  <TableRow>
    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
      No team members yet. Invite your first team member!
    </TableCell>
  </TableRow>
) : (
  teamMembers.map((member) => (
    <TableRow key={member.id}>
      <TableCell>
        <div>
          <p className="text-sm font-medium">
            {member.first_name} {member.last_name}
          </p>
          <p className="text-xs text-muted-foreground">{member.email}</p>
          {member.invitation_accepted_at && (
            <p className="text-xs text-gray-400 mt-1">
              Joined: {format(new Date(member.invitation_accepted_at), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Select
          defaultValue={member.job_title?.toLowerCase().replace(/\s+/g, '-') || 'member'}
          onValueChange={(value) => {
            const jobTitle = value.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')
            handleUpdateMemberRole(member.id, jobTitle)
          }}
          disabled={updatingMember === member.id}
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="business-manager">Business Manager</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="analyst">Analyst</SelectItem>
            <SelectItem value="hr-manager">HR Manager</SelectItem>
            <SelectItem value="recruiter">Recruiter</SelectItem>
            <SelectItem value="junior-recruiter">Junior Recruiter</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          defaultValue={member.permissions.includes('full_access') ? 'full-access' : 
                       member.permissions.length > 1 ? 'standard' : 'read-only'}
          onValueChange={(value) => {
            const permissions = value === 'full-access' 
              ? ['full_access', 'view_candidates', 'manage_evaluations', 'manage_team']
              : value === 'standard'
              ? ['view_candidates', 'manage_evaluations']
              : ['view_candidates']
            handleUpdateMemberPermission(member.id, permissions)
          }}
          disabled={updatingMember === member.id}
        >
          <SelectTrigger className="w-32 h-8 text-xs border-purple-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full-access">Full Access</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="read-only">Read Only</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        {member.is_active ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <UserCheck className="w-3 h-3" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            Inactive
          </span>
        )}
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8"
          onClick={() => handleRemoveMember(member.id)}
          disabled={updatingMember === member.id}
        >
          {updatingMember === member.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MoreVertical className="w-4 h-4" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  ))
)}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-lg">{t("partnerships")}</CardTitle>
                <Tabs defaultValue="my-connections" className="mt-2 sm:mt-0">
                  <TabsList className="grid w-full max-w-xs grid-cols-2">
                    <TabsTrigger value="my-connections">{t("tabs.myConnections")}</TabsTrigger>
                    <TabsTrigger value="discover">{t("tabs.discover")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-2 sm:gap-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {['B', 'R', 'N', 'R'][i-1]}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate">
                            {['Bluesky', 'Bluerights', 'Nova Group', 'Resilient Agency'][i-1]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">email@company.net</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs bg-transparent mt-2 sm:mt-0">{t("connect")}</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("candidatesStatus")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center gap-2">
                  <Download className="w-6 h-6 text-muted-foreground" />
                  <p className="text-xs font-medium">{t("downloadFiles")}</p>
                  <p className="text-xs text-muted-foreground">{t("downloadAllowed")}</p>
                </div>
                <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <p className="text-xs font-medium">{t("uploadFiles")}</p>
                  <p className="text-xs text-muted-foreground">{t("uploadCandidatesFile")}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSignature className="w-4 h-4" />
                  {t("agreements.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{t("agreements.description")}</p>
                {agreementsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("agreements.loading")}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {REQUIRED_AGREEMENT_TYPES.map((type) => {
                        const agreement = agreements.find((a) => a.agreement_type === type)
                        const isSigned = agreement?.status === "SIGNED"
                        const label = agreement?.agreement_type_display || type
                        return (
                          <div key={type} className="flex items-center justify-between text-xs gap-2">
                            <span className="truncate">{label}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {isSigned ? (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="w-3 h-3" /> {t("agreements.signed")}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-600">
                                  <Clock className="w-3 h-3" /> {t("agreements.pending")}
                                </span>
                              )}
                              {isSigned && agreement && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadAgreement(agreement.id)}
                                    title="Download PDF"
                                    className="text-gray-400 hover:text-purple-600"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAuditTarget({ id: agreement.id, label })}
                                    title="View Audit Trail"
                                    className="text-gray-400 hover:text-purple-600"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs"
                      onClick={() => router.push(`/${locale}/dashboard/business/sign-agreements`)}
                    >
                      {REQUIRED_AGREEMENT_TYPES.every((type) =>
                        agreements.find((a) => a.agreement_type === type)?.status === "SIGNED"
                      )
                        ? t("agreements.viewButton")
                        : t("agreements.signButton")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <ChangePassword />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("settings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">{t("theme")}</label>
                  <Select defaultValue="light">
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t("light")}</SelectItem>
                      <SelectItem value="dark">{t("dark")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">{t("language")}</label>
                  <Select defaultValue="eng">
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eng">{t("english")}</SelectItem>
                      <SelectItem value="es">{t("spanish")}</SelectItem>
                      <SelectItem value="ar">{t("arabic")}</SelectItem>
                      <SelectItem value="fr">{t("french")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">{t("notification")}</label>
                  <Select defaultValue="email">
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">{t("email")}</SelectItem>
                      <SelectItem value="push">{t("push")}</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs mt-2">{t("save")}</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 lg:static lg:mt-4">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full lg:w-auto">
            {t("saveChanges")}
          </Button>
        </div>
      </div>

      <InviteTeamModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={handleInviteSuccess}
      />

      <AuditTrailModal
        agreementId={auditTarget?.id ?? null}
        agreementLabel={auditTarget?.label ?? ""}
        onClose={() => setAuditTarget(null)}
      />
    </div>
  )
}