// app/dashboard/admin/system-config/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Loader2, Search, UserCheck, UserX, Clock, Users, Building2, Shield } from "lucide-react"
import systemService from "@/app/api/admin/system/endpoints"
import type { SystemStats, SystemUser } from "@/app/api/admin/system/types"
import { format } from "date-fns"

export default function SystemConfigSecurity() {
  const t = useTranslations("dashboard.admin.systemSecurity")
  
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Alert configurations (would be saved to backend in real app)
  const [alertConfigs, setAlertConfigs] = useState(systemService.getAlertConfigurations())

  useEffect(() => {
    fetchSystemData()
  }, [])

  const fetchSystemData = async () => {
    setLoading(true)
    try {
      const [statsData, usersData] = await Promise.all([
        systemService.getSystemStats(),
        systemService.getAllSystemUsers()
      ])
      setStats(statsData)
      setUsers(usersData)
    } catch (error) {
      console.error('Failed to fetch system data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAlert = (alertId: string) => {
    setAlertConfigs(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, enabled: !alert.defaultEnabled } : alert
      )
    )
  }

  const filteredUsers = users.filter(user => {
    if (roleFilter !== 'all' && user.role_type !== roleFilter) return false
    if (statusFilter !== 'all' && user.status !== statusFilter) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-0">{t("status.active")}</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-0">{t("status.inactive")}</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">{t("status.pending")}</Badge>
      default:
        return null
    }
  }

  const getRoleBadge = (roleType: string, role: string) => {
    switch (roleType) {
      case 'SUPERADMIN':
        return <Badge className="bg-purple-100 text-purple-800 border-0">{role}</Badge>
      case 'ADMIN':
        return <Badge className="bg-blue-100 text-blue-800 border-0">{role}</Badge>
      case 'B2B':
        return <Badge className="bg-green-100 text-green-800 border-0">{role}</Badge>
      case 'B2C':
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">{role}</Badge>
      case 'B2B_TEAM_MEMBER':
        return <Badge className="bg-indigo-100 text-indigo-800 border-0">{role}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-0">{role}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <Alert className="mb-8 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{t("title")}</strong>
            <Badge className="ml-2 bg-orange-200 text-orange-900 border-0">{t("subtitle")}</Badge>
            <p className="text-sm mt-1">{t("description")}</p>
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}

{stats && (
  <>
    <h2 className="text-xl font-bold text-gray-900 mb-6">{t("systemOverview")}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Users Card */}
      <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-semibold">{t("stats.totalUsers")}</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {systemService.formatNumber(stats.user_stats?.total_users)}
            </p>
          </div>
          <Users className="w-8 h-8 text-blue-500 opacity-50" />
        </div>
        <div className="mt-4 flex gap-4 text-xs text-gray-500">
          <span>Admins: {stats.user_stats?.total_admins ?? 0}</span>
          <span>B2C: {stats.user_stats?.total_b2c ?? 0}</span>
          <span>B2B: {stats.user_stats?.total_b2b ?? 0}</span>
        </div>
      </Card>

      {/* Pending Email Verification Card */}
      <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-semibold">{t("stats.pendingVerification")}</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {stats.verification_stats?.pending_email ?? 0}
            </p>
          </div>
          <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
        </div>
        <p className="mt-4 text-xs text-gray-500">Email verification pending</p>
      </Card>

      {/* Pending Documents Card */}
      <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-semibold">{t("stats.pendingDocuments")}</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {stats.verification_stats?.pending_documents ?? 0}
            </p>
          </div>
          <Shield className="w-8 h-8 text-orange-500 opacity-50" />
        </div>
        <div className="mt-4 flex gap-4 text-xs text-gray-500">
          <span>Approved: {stats.verification_stats?.approved_documents ?? 0}</span>
          <span>Rejected: {stats.verification_stats?.rejected_documents ?? 0}</span>
        </div>
      </Card>

      {/* Recent Registrations Card */}
      <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-semibold">{t("stats.recentRegistrations")}</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.recent_users?.length ?? 0}
            </p>
          </div>
          <UserCheck className="w-8 h-8 text-green-500 opacity-50" />
        </div>
        <p className="mt-4 text-xs text-gray-500">New users (last 30 days)</p>
      </Card>
    </div>

    {/* Recent Users List */}
    {stats.recent_users && stats.recent_users.length > 0 && (
      <Card className="p-6 shadow-lg mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Registrations</h3>
        <div className="space-y-3">
          {stats.recent_users.slice(0, 5).map(user => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{user.full_name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="flex gap-2">
                {user.is_verified ? (
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                )}
                <Badge className="bg-blue-100 text-blue-800">{user.role}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )}
  </>
)}

        {/* Alerts Configuration */}
        <Card className="p-6 shadow-lg mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t("alerts.title")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alertConfigs.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id={alert.id}
                  checked={alert.defaultEnabled}
                  onCheckedChange={() => toggleAlert(alert.id)}
                />
                <label htmlFor={alert.id} className="text-gray-700 cursor-pointer flex-1">
                  {t(alert.messageKey)}
                </label>
                {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
              </div>
            ))}
          </div>
        </Card>

        {/* User & Role Management Table */}
        <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">{t("table.title")}</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t("search.placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t("filters.role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="B2B">Company</SelectItem>
                  <SelectItem value="B2C">Individual</SelectItem>
                  <SelectItem value="B2B_TEAM_MEMBER">Team Member</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t("filters.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-700 font-semibold">{t("table.headers.user")}</TableHead>
                  <TableHead className="text-gray-700 font-semibold">{t("table.headers.role")}</TableHead>
                  <TableHead className="text-gray-700 font-semibold">{t("table.headers.status")}</TableHead>
                  <TableHead className="text-gray-700 font-semibold">{t("table.headers.joined")}</TableHead>
                  <TableHead className="text-gray-700 font-semibold">{t("table.headers.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.slice(0, 10).map((user) => (
                    <TableRow key={`${user.role_type}-${user.id}`} className="border-b hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role_type, user.role)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge className="bg-yellow-100 text-yellow-800 border-0 text-xs cursor-pointer hover:bg-yellow-200">
                            {t("actions.edit")}
                          </Badge>
                          <Badge className="bg-orange-100 text-orange-800 border-0 text-xs cursor-pointer hover:bg-orange-200">
                            {t("actions.reset")}
                          </Badge>
                          {user.status === 'active' ? (
                            <Badge className="bg-red-100 text-red-800 border-0 text-xs cursor-pointer hover:bg-red-200">
                              {t("actions.disable")}
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 border-0 text-xs cursor-pointer hover:bg-green-200">
                              {t("actions.enable")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length > 10 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Showing 10 of {filteredUsers.length} users. Use filters to narrow results.
            </p>
          )}

          <div className="flex gap-4 mt-6">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">{t("quickActions.createUser")}</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">{t("quickActions.manageRoles")}</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}