// app/dashboard/admin/candidates/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Archive, Upload, Search, Loader2, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { useTranslations } from "next-intl"
import { EmployerDetailModal } from "./components/employer-detail-modal"
import { AddEmployerModal } from "./components/add-employer-modal"
import employerService from "@/app/api/admin/employers/endpoints"
import type { Employer } from "@/app/api/admin/employers/types"
import { format } from "date-fns"

/* ---------------------------
   COLOR MAPS
---------------------------- */
const ROLE_COLOR: Record<string, string> = {
  B2C: "bg-pink-100 text-pink-800",
  B2B: "bg-purple-100 text-purple-800",
  B2B_TEAM_MEMBER: "bg-gray-100 text-gray-800",
}

const VERIFICATION_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  info_needed: "bg-blue-100 text-blue-800",
}

const DOC_STATUS_COLOR: Record<string, string> = {
  true: "bg-green-100 text-green-800",
  false: "bg-red-100 text-red-800",
}

export default function CandidateManagementConsole() {
  const t = useTranslations("dashboard.admin.candidateManagement")
  
  const [employers, setEmployers] = useState<Employer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [verificationFilter, setVerificationFilter] = useState<string>("")
  const [docVerifiedFilter, setDocVerifiedFilter] = useState<string>("")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(10)

  useEffect(() => {
    fetchEmployers()
  }, [currentPage, roleFilter, verificationFilter, docVerifiedFilter, searchTerm])

  const fetchEmployers = async () => {
    setLoading(true)
    try {
      const response = await employerService.getEmployers({
        page: currentPage,
        page_size: pageSize,
        role: roleFilter && roleFilter !== 'all' ? roleFilter : undefined,
        verification_status: verificationFilter && verificationFilter !== 'all' ? verificationFilter : undefined,
        documents_verified: docVerifiedFilter && docVerifiedFilter !== 'all' ? docVerifiedFilter === 'true' : undefined,
        search: searchTerm || undefined,
        ordering: '-created_at'
      })
      setEmployers(response.results)
      setTotalCount(response.count)
    } catch (error) {
      console.error('Failed to fetch employers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (employer: Employer) => {
    setSelectedEmployer(employer)
    setIsDetailModalOpen(true)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {t("title")}
        </h1>
        <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
          {t("subtitle")}
        </p>

        {/* Quick Actions */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="font-semibold text-gray-700">
              {t("quickActions.title")}
            </span>

            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              {t("quickActions.add")}
            </Button>

            <Button variant="outline" className="gap-2 bg-transparent">
              <Upload className="w-4 h-4" />
              {t("quickActions.bulkUpload")}
            </Button>

            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white gap-2">
              <Archive className="w-4 h-4" />
              {t("quickActions.archive")}
            </Button>

            {/* Search */}
            <div className="flex-1 flex gap-2 ml-auto">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t("search.placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("filters.allRoles")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="B2C">Individual</SelectItem>
              <SelectItem value="B2B">Company</SelectItem>
              <SelectItem value="B2B_TEAM_MEMBER">Team Member</SelectItem>
            </SelectContent>
          </Select>

          <Select value={verificationFilter} onValueChange={setVerificationFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("filters.verificationStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={docVerifiedFilter} onValueChange={setDocVerifiedFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("filters.documents")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Verified</SelectItem>
              <SelectItem value="false">Not Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="shadow-lg">
          <div className="p-4 sm:p-6 border-b flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {t("table.title")} ({totalCount})
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>{t("table.headers.name")}</TableHead>
                      <TableHead>{t("table.headers.role")}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("table.headers.email")}</TableHead>
                      <TableHead>{t("table.headers.verification")}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t("table.headers.documents")}</TableHead>
                      <TableHead>{t("table.headers.joined")}</TableHead>
                      <TableHead>{t("table.headers.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {employers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No employers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      employers.map((employer) => (
                        <TableRow key={employer.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-semibold">{employer.full_name}</p>
                              <p className="text-sm text-gray-500 md:hidden">{employer.email}</p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge className={`${ROLE_COLOR[employer.role]} border-0`}>
                              {employer.role}
                            </Badge>
                          </TableCell>

                          <TableCell className="hidden md:table-cell text-gray-600">
                            {employer.email}
                          </TableCell>

                          <TableCell>
                            <Badge className={`${VERIFICATION_COLOR[employer.documents_verification_status] || 'bg-gray-400'} border-0`}>
                              {employer.documents_verification_status || 'Pending'}
                            </Badge>
                          </TableCell>

                          <TableCell className="hidden lg:table-cell">
                            <Badge className={`${DOC_STATUS_COLOR[String(employer.documents_verified)]} border-0`}>
                              {employer.documents_verified ? 'Verified' : 'Not Verified'}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-sm text-gray-600">
                            {format(new Date(employer.created_at), 'MMM d, yyyy')}
                          </TableCell>

                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(employer)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} employers
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Detail Modal */}
      <EmployerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEmployer(null);
        }}
        employer={selectedEmployer}
      />

      {/* Add Employer Modal */}
      <AddEmployerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchEmployers}
      />
    </div>
  )
}