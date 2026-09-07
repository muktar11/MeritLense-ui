// app/dashboard/admin/packages/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Loader2, ChevronLeft, ChevronRight, Pencil, Ban, Trash2, ShieldAlert } from "lucide-react"
import { PackageModal } from "./components/package-modal"
import adminPackageService from "@/app/api/admin/packages/endpoints"
import type { Package } from "@/app/api/admin/packages/types"
import { useAuth } from "@/app/hooks/useAuth"

const TARGET_USER_TYPE_COLOR: Record<string, string> = {
  B2C: "bg-pink-100 text-pink-800",
  B2B: "bg-purple-100 text-purple-800",
  BOTH: "bg-blue-100 text-blue-800",
}

export default function PackageManagementPage() {
  const t = useTranslations("dashboard.admin.packages")
  const { userRole } = useAuth()

  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)

  const [targetUserTypeFilter, setTargetUserTypeFilter] = useState<string>("all")
  const [billingTypeFilter, setBillingTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20)

  useEffect(() => {
    if (userRole === 'SUPERADMIN') {
      fetchPackages()
    }
  }, [currentPage, targetUserTypeFilter, billingTypeFilter, statusFilter, userRole])

  const fetchPackages = async () => {
    setLoading(true)
    try {
      const response = await adminPackageService.getPackages({
        page: currentPage,
        page_size: pageSize,
        target_user_type: targetUserTypeFilter !== 'all' ? targetUserTypeFilter : undefined,
        billing_type: billingTypeFilter !== 'all' ? billingTypeFilter : undefined,
        is_active: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
      })
      setPackages(response.results)
      setTotalCount(response.count)
    } catch (error) {
      console.error('Failed to fetch packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingPackage(null)
    setIsModalOpen(true)
  }

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg)
    setIsModalOpen(true)
  }

  const handleDeactivate = async (pkg: Package) => {
    if (!confirm(t("confirm.deactivate", { name: pkg.name }))) return
    try {
      await adminPackageService.deactivatePackage(pkg.id)
      fetchPackages()
    } catch (error) {
      console.error('Failed to deactivate package:', error)
      alert(t("errors.deactivateFailed"))
    }
  }

  const handleDelete = async (pkg: Package) => {
    if (!confirm(t("confirm.delete", { name: pkg.name }))) return
    try {
      await adminPackageService.deletePackagePermanently(pkg.id)
      fetchPackages()
    } catch (error: any) {
      console.error('Failed to delete package:', error)
      alert(error?.response?.data?.error || t("errors.deleteFailed"))
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (userRole !== 'SUPERADMIN') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
        <div className="text-center">
          <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t("accessRestricted.title")}</h1>
          <p className="text-gray-600">{t("accessRestricted.description")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
          </div>
          <Button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {t("newPackage")}
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={targetUserTypeFilter} onValueChange={setTargetUserTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("filters.availableTo")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allAudiences")}</SelectItem>
              <SelectItem value="B2C">{t("targetUserTypes.B2C")}</SelectItem>
              <SelectItem value="B2B">{t("targetUserTypes.B2B")}</SelectItem>
              <SelectItem value="BOTH">{t("targetUserTypes.BOTH")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={billingTypeFilter} onValueChange={setBillingTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("filters.billingType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allBillingTypes")}</SelectItem>
              <SelectItem value="RECURRING">{t("billingTypes.RECURRING")}</SelectItem>
              <SelectItem value="ONE_TIME">{t("billingTypes.ONE_TIME")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allStatus")}</SelectItem>
              <SelectItem value="active">{t("filters.active")}</SelectItem>
              <SelectItem value="inactive">{t("filters.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-white shadow-sm border-0">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{t("table.title", { count: totalCount })}</h2>
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
                      <TableHead>{t("table.headers.availableTo")}</TableHead>
                      <TableHead>{t("table.headers.price")}</TableHead>
                      <TableHead>{t("table.headers.billing")}</TableHead>
                      <TableHead>{t("table.headers.tier")}</TableHead>
                      <TableHead>{t("table.headers.slots")}</TableHead>
                      <TableHead>{t("table.headers.points")}</TableHead>
                      <TableHead>{t("table.headers.status")}</TableHead>
                      <TableHead>{t("table.headers.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          {t("table.noResults")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      packages.map((pkg) => (
                        <TableRow key={pkg.id} className="hover:bg-gray-50">
                          <TableCell>
                            <p className="font-medium text-gray-900">{pkg.name}</p>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${TARGET_USER_TYPE_COLOR[pkg.target_user_type]} border-0`}>
                              {t(`targetUserTypes.${pkg.target_user_type}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {pkg.formatted_price}
                              {pkg.billing_type === 'RECURRING' && pkg.interval && (
                                <span className="text-gray-500">/{t(`intervals.${pkg.interval}`)}</span>
                              )}
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {t(`billingTypes.${pkg.billing_type}`)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{pkg.evaluation_tier ? t(`evaluationTiers.${pkg.evaluation_tier}`) : '—'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {pkg.slot_grant ?? t("table.unlimited")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {pkg.points_grant ?? t("table.unlimited")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={pkg.is_active ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-600 border-0'}>
                              {pkg.is_active ? t("filters.active") : t("filters.inactive")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(pkg)} className="text-blue-600 hover:text-blue-700">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              {pkg.is_active ? (
                                <Button variant="ghost" size="sm" onClick={() => handleDeactivate(pkg)} className="text-red-600 hover:text-red-700">
                                  <Ban className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(pkg)} className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-gray-600">
                    {t("pagination.showing", { start: ((currentPage - 1) * pageSize) + 1, end: Math.min(currentPage * pageSize, totalCount), total: totalCount })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">{t("pagination.page", { current: currentPage, total: totalPages })}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <PackageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPackages}
        packageToEdit={editingPackage}
      />
    </div>
  )
}
