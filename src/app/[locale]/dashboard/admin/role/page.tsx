// app/dashboard/admin/user-role-management/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "next-intl"
import { Loader2, Search, ChevronLeft, ChevronRight, MoreVertical, UserPlus } from "lucide-react"
import { CreateAdminModal } from "./components/create-admin-modal"
import adminUserService from "@/app/api/admin/users/endpoints"
import type { AdminUser } from "@/app/api/admin/users/types"
import { format } from "date-fns"

/* ---------------------------
   COLOR MAPS
---------------------------- */
const ROLE_BADGE_STYLE: Record<string, string> = {
  SUPERADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
}

const STATUS_STYLE: Record<string, string> = {
  true: "text-green-600",
  false: "text-red-500",
}

/* ---------------------------
   COMPONENT
---------------------------- */
export default function UserRoleManagement() {
  const t = useTranslations("dashboard.admin.userRoleManagement")
  
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(10)

  useEffect(() => {
    fetchUsers()
  }, [currentPage, roleFilter, statusFilter, searchTerm])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await adminUserService.getAdminUsers({
        page: currentPage,
        page_size: pageSize,
        role: roleFilter && roleFilter !== 'all' ? roleFilter : undefined,
        is_active: statusFilter && statusFilter !== 'all' ? statusFilter === 'active' : undefined,
        search: searchTerm || undefined
      })
      setUsers(response.results)
      setTotalCount(response.count)
    } catch (error) {
      console.error('Failed to fetch admin users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async (data: any): Promise<boolean> => {
    try {
      await adminUserService.createAdminUser(data)
      await fetchUsers()
      return true
    } catch (error) {
      console.error('Failed to create admin:', error)
      return false
    }
  }


const handleToggleStatus = async (user: AdminUser) => {
  const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
  if (user.id === currentUser.id) {
    alert("You cannot disable your own account!");
    return;
  }

  if (user.role === 'SUPERADMIN') {
    const superAdmins = users.filter(u => u.role === 'SUPERADMIN' && u.is_active);
    if (superAdmins.length <= 1 && user.is_active) {
      const confirm = window.confirm(
        "This is the last active Super Admin. Disabling this account will remove all super admin access. Are you absolutely sure?"
      );
      if (!confirm) return;
    }
  }

  const action = user.is_active ? 'disable' : 'enable';
  const confirmMessage = user.is_active 
    ? `Are you sure you want to disable ${user.full_name}? They will lose access to the admin panel.`
    : `Are you sure you want to enable ${user.full_name}?`;

  if (!window.confirm(confirmMessage)) return;

  try {
    await adminUserService.updateAdminUser(user.id, {
      is_active: !user.is_active
    });
    await fetchUsers();
  } catch (error) {
    console.error('Failed to update user status:', error);
    alert('Failed to update user status. Please try again.');
  }
};

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("title")}
          </h1>
          <span className="px-3 py-1 text-sm text-gray-500 bg-gray-200 rounded-full">
            {t("access")}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {t("actions.createUser")}
          </Button>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
          >
            {t("actions.activityLog")}
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t("filters.allRoles")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t("filters.allStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card className="bg-white shadow-sm border-0">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              {t("table.title")} ({totalCount})
            </h2>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                          {t("table.headers.user")}
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                          {t("table.headers.role")}
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                          {t("table.headers.permissions")}
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                          {t("table.headers.status")}
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                          {t("table.headers.lastLogin")}
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                          {t("table.headers.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No admin users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow
                            key={user.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            {/* User */}
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{user.full_name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </TableCell>

                            {/* Role */}
                            <TableCell>
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${ROLE_BADGE_STYLE[user.role]}`}
                              >
                                {user.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}
                              </span>
                            </TableCell>

                            {/* Permissions */}
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {user.admin_permissions?.slice(0, 2).map((perm) => (
                                  <span key={perm} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                    {perm.replace('_', ' ')}
                                  </span>
                                ))}
                                {(user.admin_permissions?.length || 0) > 2 && (
                                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                    +{user.admin_permissions!.length - 2}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              <span
                                className={`text-sm font-medium ${STATUS_STYLE[String(user.is_active)]}`}
                              >
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </TableCell>

                            {/* Last Login */}
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {user.last_login ? format(new Date(user.last_login), 'MMM d, yyyy') : 'Never'}
                              </span>
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                {user.is_active ? (
                                  <button
                                    onClick={() => handleToggleStatus(user)}
                                    className="px-3 py-1 text-xs font-medium text-red-800 bg-red-400 rounded hover:bg-red-500"
                                  >
                                    {t("table.actions.disable")}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleStatus(user)}
                                    className="px-3 py-1 text-xs font-medium text-green-800 bg-green-400 rounded hover:bg-green-500"
                                  >
                                    {t("table.actions.enable")}
                                  </button>
                                )}
                                <button className="px-3 py-1 text-xs font-medium text-gray-800 bg-gray-400 rounded hover:bg-gray-500">
                                  <MoreVertical className="w-3 h-3" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} users
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
          </div>
        </Card>
      </div>

      {/* Create Admin Modal */}
      <CreateAdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAdmin}
      />
    </div>
  )
}