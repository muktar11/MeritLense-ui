// app/dashboard/admin/packages/page.tsx
"use client"

import { useState, useEffect } from "react"
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
import { Plus, Loader2, ChevronLeft, ChevronRight, Pencil, Ban, ShieldAlert } from "lucide-react"
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
    if (!confirm(`Deactivate "${pkg.name}"? Existing subscribers keep it, but it won't be offered to new purchasers.`)) return
    try {
      await adminPackageService.deactivatePackage(pkg.id)
      fetchPackages()
    } catch (error) {
      console.error('Failed to deactivate package:', error)
      alert('Failed to deactivate package. Please try again.')
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (userRole !== 'SUPERADMIN') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
        <div className="text-center">
          <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">SuperAdmin Access Required</h1>
          <p className="text-gray-600">Package management is restricted to SuperAdmin accounts.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Package Management</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage subscription packages for B2C and B2B customers.</p>
          </div>
          <Button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Package
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={targetUserTypeFilter} onValueChange={setTargetUserTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Available To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Audiences</SelectItem>
              <SelectItem value="B2C">Individual (B2C)</SelectItem>
              <SelectItem value="B2B">Company (B2B)</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>

          <Select value={billingTypeFilter} onValueChange={setBillingTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Billing Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Billing Types</SelectItem>
              <SelectItem value="RECURRING">Recurring</SelectItem>
              <SelectItem value="ONE_TIME">One-Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-white shadow-sm border-0">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Packages ({totalCount})</h2>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Available To</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No packages found
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
                              {pkg.target_user_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {pkg.formatted_price}
                              {pkg.billing_type === 'RECURRING' && (
                                <span className="text-gray-500">/{pkg.interval?.toLowerCase()}</span>
                              )}
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {pkg.billing_type === 'ONE_TIME' ? 'One-Time' : 'Recurring'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{pkg.evaluation_tier || '—'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {pkg.feature_limits?.points_granted ?? '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={pkg.is_active ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-600 border-0'}>
                              {pkg.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(pkg)} className="text-blue-600 hover:text-blue-700">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              {pkg.is_active && (
                                <Button variant="ghost" size="sm" onClick={() => handleDeactivate(pkg)} className="text-red-600 hover:text-red-700">
                                  <Ban className="w-4 h-4" />
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
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} packages
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
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
