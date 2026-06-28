"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Shield, User, Building2 } from "lucide-react"
import rbacService from "@/app/api/admin/rbac/endpoints"
import type { UserPermission } from "@/app/api/admin/rbac/types"

const systems = [
  { id: "b2b-enterprise", labelKey: "systems.b2bEnterprise", value: "b2b-enterprise" },
  { id: "b2b-basic", labelKey: "systems.b2bBasic", value: "b2b-basic" },
  { id: "b2c-admin", labelKey: "systems.b2cAdmin", value: "b2c-admin" },
]

const rolesBySystem = {
  "b2b-enterprise": [
    { id: "super-admin", labelKey: "roles.superAdmin", value: "Super Admin" },
    { id: "admin", labelKey: "roles.admin", value: "Admin" },
    { id: "company-admin", labelKey: "roles.companyAdmin", value: "Company Admin" },
  ],
  "b2b-basic": [
    { id: "team-member", labelKey: "roles.teamMember", value: "Team Member" },
  ],
  "b2c-admin": [
    { id: "user", labelKey: "roles.user", value: "User" },
  ],
}

const getAccessBadgeColor = (access: string) => {
  switch (access) {
    case "full_access":
      return "bg-purple-100 text-purple-800"
    case "manage_evaluations":
      return "bg-green-100 text-green-800"
    case "view_candidates":
      return "bg-blue-100 text-blue-800"
    case "manage_users":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getUserTypeIcon = (type: string) => {
  switch (type) {
    case 'admin':
      return <Shield className="w-4 h-4 text-purple-500" />
    case 'employer':
      return <User className="w-4 h-4 text-blue-500" />
    case 'team_member':
      return <Building2 className="w-4 h-4 text-green-500" />
    default:
      return <User className="w-4 h-4 text-gray-500" />
  }
}

export default function RoleBasedManagementPage() {
  const t = useTranslations("dashboard.admin.rbac")
  const [selectedSystem, setSelectedSystem] = useState("b2b-enterprise")
  const [selectedRole, setSelectedRole] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<UserPermission[]>([])
  const [loading, setLoading] = useState(true)

  const availableRoles = rolesBySystem[selectedSystem as keyof typeof rolesBySystem] || []

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const allUsers = await rbacService.getAllUsersWithPermissions()
      setUsers(allUsers)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    if (selectedSystem !== 'all' && user.system !== selectedSystem) return false
    
    if (selectedRole !== 'all' && user.role !== selectedRole) return false
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return user.name.toLowerCase().includes(term) || 
             user.email.toLowerCase().includes(term)
    }
    
    return true
  })

  return (
    <main className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        <h1 className="text-4xl font-bold text-gray-900">
          {t("title")}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-blue-600">
              {t("explorerTitle")}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {t("description")}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("selectSystem")}
                </label>
                <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("placeholders.system")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Systems</SelectItem>
                    {systems.map(system => (
                      <SelectItem key={system.id} value={system.value}>
                        {t(system.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("selectRole")}
                </label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("placeholders.role")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {availableRoles.map(role => (
                      <SelectItem key={role.id} value={role.value}>
                        {t(role.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("search")}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 text-sm text-gray-600">
              <span>Total Users: {filteredUsers.length}</span>
              <span>•</span>
              <span>Admins: {filteredUsers.filter(u => u.type === 'admin').length}</span>
              <span>•</span>
              <span>Employers: {filteredUsers.filter(u => u.type === 'employer').length}</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>{t("table.user")}</TableHead>
                      <TableHead>{t("table.type")}</TableHead>
                      <TableHead>{t("table.role")}</TableHead>
                      <TableHead>{t("table.system")}</TableHead>
                      <TableHead>{t("table.permissions")}</TableHead>
                      <TableHead>{t("table.contact")}</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No users found matching the selected filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={`${user.type}-${user.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getUserTypeIcon(user.type)}
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {t(`roles.${user.role.toLowerCase().replace(' ', '')}`) || user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {t(`systems.${user.system.replace('-', '')}`)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.permissions.length > 0 ? (
                                user.permissions.slice(0, 2).map((perm, idx) => (
                                  <Badge key={idx} className={getAccessBadgeColor(perm)}>
                                    {perm.replace(/_/g, ' ')}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-gray-400">No permissions</span>
                              )}
                              {user.permissions.length > 2 && (
                                <Badge className="bg-gray-100 text-gray-800">
                                  +{user.permissions.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.phone && (
                              <p className="text-sm text-gray-600">{user.phone}</p>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}