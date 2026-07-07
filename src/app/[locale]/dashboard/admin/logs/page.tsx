// app/dashboard/admin/audit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  ClipboardList, 
  Search, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle
} from "lucide-react"
import { VerifyDocumentsModal } from "./components/verify-documents-modal"
import auditService from "@/app/api/admin/audit/endpoints"
import type { 
  AuditLogEntry, 
  AuditLogSummary,
  PendingVerificationUser 
} from "@/app/api/admin/audit/types"

export default function AuditLog() {
  const t = useTranslations("dashboard.admin.auditLog")
  const [activeTab, setActiveTab] = useState<"evaluation" | "audit">("evaluation")
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [auditSummary, setAuditSummary] = useState<AuditLogSummary | null>(null)
  const [auditLoading, setAuditLoading] = useState(true)
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditFilters, setAuditFilters] = useState({
    search: "",
    category: "",
    severity: "",
    date_from: "",
    date_to: ""
  })
  const [categories, setCategories] = useState<Array<{ key: string; label: string }>>([])
  const [actions, setActions] = useState<Array<{ key: string; label: string }>>([])
  const [userActivity, setUserActivity] = useState<any[]>([])

  // Pending verifications state
  const [pendingUsers, setPendingUsers] = useState<PendingVerificationUser[]>([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<PendingVerificationUser | null>(null)
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)

  const pageSize = 20

  useEffect(() => {
    fetchCategories()
    fetchActions()
    fetchAuditLogs()
    fetchAuditSummary()
    fetchUserActivity()
  }, [])

  useEffect(() => {
    fetchAuditLogs()
  }, [auditPage, auditFilters])

  useEffect(() => {
    if (activeTab === "evaluation") {
      fetchPendingVerifications()
    }
  }, [activeTab])

  const fetchCategories = async () => {
    try {
      const data = await auditService.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchActions = async () => {
    try {
      const data = await auditService.getActions()
      setActions(data)
    } catch (error) {
      console.error('Failed to fetch actions:', error)
    }
  }

  const fetchAuditLogs = async () => {
    setAuditLoading(true)
    try {
      const response = await auditService.getAuditLogs({
        page: auditPage,
        page_size: pageSize,
        search: auditFilters.search || undefined,
        category: auditFilters.category || undefined,
        severity: auditFilters.severity || undefined,
        date_from: auditFilters.date_from || undefined,
        date_to: auditFilters.date_to || undefined
      })
      setAuditLogs(response.results || [])
      setAuditTotal(response.count || 0)
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      setAuditLogs([])
    } finally {
      setAuditLoading(false)
    }
  }

  const fetchAuditSummary = async () => {
    try {
      const summary = await auditService.getAuditSummary(30)
      setAuditSummary(summary)
    } catch (error) {
      console.error('Failed to fetch audit summary:', error)
    }
  }

  const fetchUserActivity = async () => {
    try {
      const activity = await auditService.getUserActivity(30, 10)
      setUserActivity(activity)
    } catch (error) {
      console.error('Failed to fetch user activity:', error)
    }
  }

  const fetchPendingVerifications = async () => {
    setPendingLoading(true)
    try {
      const response = await auditService.getPendingVerifications()
      setPendingUsers(response.results || [])
    } catch (error) {
      console.error('Failed to fetch pending verifications:', error)
      setPendingUsers([])
    } finally {
      setPendingLoading(false)
    }
  }

  const handleVerifyDocuments = async (userId: string, notes: string) => {
    await auditService.verifyDocuments({
      user_id: userId,
      status: 'APPROVED',
      verification_notes: notes
    })
    await fetchPendingVerifications()
    await fetchAuditLogs()
  }

  const handleRejectDocuments = async (userId: string, reason: string, notes: string) => {
    await auditService.rejectDocuments({
      user_id: userId,
      rejection_reason: reason,
      verification_notes: notes
    })
    await fetchPendingVerifications()
    await fetchAuditLogs()
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'INFO':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'CRITICAL':
        return <AlertCircle className="w-4 h-4 text-purple-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'INFO':
        return <Badge className="bg-blue-100 text-blue-800">{t(`severity.${severity}`)}</Badge>
      case 'WARNING':
        return <Badge className="bg-yellow-100 text-yellow-800">{t(`severity.${severity}`)}</Badge>
      case 'ERROR':
        return <Badge className="bg-red-100 text-red-800">{t(`severity.${severity}`)}</Badge>
      case 'CRITICAL':
        return <Badge className="bg-purple-100 text-purple-800">{t(`severity.${severity}`)}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{severity}</Badge>
    }
  }

  const totalPages = Math.ceil(auditTotal / pageSize)

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab("evaluation")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === "evaluation" ? "text-purple-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === "evaluation" ? "text-purple-600" : "text-gray-400"}`} />
              {t("tabs.pendingVerifications")}
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === "audit" ? "text-purple-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ClipboardList className={`w-4 h-4 ${activeTab === "audit" ? "text-purple-600" : "text-gray-400"}`} />
              {t("tabs.auditLogs")}
            </button>
          </div>
          <span className="px-4 py-1.5 bg-blue-900 text-white text-xs font-semibold rounded-full whitespace-nowrap">
            {t("adminAccess")}
          </span>
        </div>

        {/* Pending Verifications Tab */}
        {activeTab === "evaluation" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {pendingUsers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-white">
                  <p className="text-sm text-gray-600">{t("pending.total")}</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
                </Card>
                <Card className="p-4 bg-white">
                  <p className="text-sm text-gray-600">{t("pending.b2c")}</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {pendingUsers.filter(u => u.role === 'B2C').length}
                  </p>
                </Card>
                <Card className="p-4 bg-white">
                  <p className="text-sm text-gray-600">{t("pending.b2b")}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {pendingUsers.filter(u => u.role === 'B2B').length}
                  </p>
                </Card>
              </div>
            )}

            {/* Pending Verifications Table */}
            <Card className="bg-white shadow-sm border-0 overflow-x-auto">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("pending.title")}
                </h3>
              </div>

              {pendingLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">{t("pending.empty")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>{t("pending.table.user")}</TableHead>
                      <TableHead>{t("pending.table.role")}</TableHead>
                      <TableHead>{t("pending.table.documents")}</TableHead>
                      <TableHead>{t("pending.table.submitted")}</TableHead>
                      <TableHead>{t("pending.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={user.role === 'B2C' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                            {user.role === 'B2C' ? t("roles.b2c") : t("roles.b2b")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {Object.values(user.documents || {}).filter(Boolean).length} / {Object.keys(user.documents || {}).length}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsVerifyModalOpen(true)
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {t("pending.table.review")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === "audit" && (
          <>
            {/* Summary Cards */}
            {auditSummary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-white">
                  <p className="text-sm text-gray-600">{t("audit.totalLogs")}</p>
                  <p className="text-2xl font-bold text-gray-900">{auditSummary.total_logs}</p>
                </Card>
                {auditSummary.by_severity.slice(0, 3).map(item => (
                  <Card key={item.severity} className="p-4 bg-white">
                    <p className="text-sm text-gray-600">{item.severity_display}</p>
                    <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* Filters */}
            <Card className="p-4 bg-white">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={t("audit.search")}
                      value={auditFilters.search}
                      onChange={(e) => setAuditFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select 
                  value={auditFilters.category} 
                  onValueChange={(v) => setAuditFilters(prev => ({ ...prev, category: v === 'all' ? '' : v }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("audit.allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("audit.allCategories")}</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={auditFilters.severity} 
                  onValueChange={(v) => setAuditFilters(prev => ({ ...prev, severity: v === 'all' ? '' : v }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("audit.allSeverities")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("audit.allSeverities")}</SelectItem>
                    <SelectItem value="INFO">{t("severity.INFO")}</SelectItem>
                    <SelectItem value="WARNING">{t("severity.WARNING")}</SelectItem>
                    <SelectItem value="ERROR">{t("severity.ERROR")}</SelectItem>
                    <SelectItem value="CRITICAL">{t("severity.CRITICAL")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Audit Logs Table */}
            <Card className="bg-white shadow-sm border-0 overflow-x-auto">
              {auditLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>{t("audit.table.user")}</TableHead>
                        <TableHead>{t("audit.table.action")}</TableHead>
                        <TableHead>{t("audit.table.category")}</TableHead>
                        <TableHead>{t("audit.table.severity")}</TableHead>
                        <TableHead>{t("audit.table.resource")}</TableHead>
                        <TableHead>{t("audit.table.timestamp")}</TableHead>
                        <TableHead>{t("audit.table.description")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!auditLogs || auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            {t("audit.noLogs")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{log.user_name || t("audit.system")}</p>
                                <p className="text-xs text-gray-500">{log.user_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action_display}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-800">{log.category_display}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getSeverityIcon(log.severity)}
                                {getSeverityBadge(log.severity)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.resource_name ? (
                                <div>
                                  <p className="text-sm font-medium">{log.resource_name}</p>
                                  <p className="text-xs text-gray-500">{log.resource_type_name || '-'}</p>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {auditService.formatTimestamp(log.created_at)}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className="text-sm text-gray-600 truncate" title={log.description}>
                                {log.description}
                              </p>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {auditTotal > 0 && (
                    <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-sm text-gray-500">
                        {t("audit.showing", { 
                          from: ((auditPage - 1) * pageSize) + 1, 
                          to: Math.min(auditPage * pageSize, auditTotal), 
                          total: auditTotal 
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                          disabled={auditPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-600">
                          {t("audit.page", { current: auditPage, total: totalPages })}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAuditPage(p => Math.min(totalPages, p + 1))}
                          disabled={auditPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </>
        )}
      </div>

      {/* Verify Documents Modal */}
      <VerifyDocumentsModal
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onVerify={handleVerifyDocuments}
        onReject={handleRejectDocuments}
      />
    </div>
  )
}