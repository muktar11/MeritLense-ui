"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Download, Plus, LogOut } from "lucide-react"

const companyData = {
  name: "Acme Corporation",
  email: "company@acme.com",
  address: "123 Business St",
  phone: "+1 675 942 23 10",
  website: "www.acmeinnovations.com",
}

const users = [
  { id: 1, name: "Helena", email: "helena@gmail.com", role: "Business Manager", systemRole: "Admin", permission: "Full Access" },
  { id: 2, name: "Oscar", email: "oscar@gmail.com", role: "Agent", systemRole: "Manager", permission: "Standard" },
  { id: 3, name: "David", email: "david@gmail.com", role: "Analyst", systemRole: "Viewer", permission: "Read only" },
  { id: 4, name: "Jison", email: "jison@gmail.com", role: "Manager", systemRole: "Admin", permission: "Full Access" },
  { id: 5, name: "Jane", email: "jane@gmail.com", role: "HR", systemRole: "Manager", permission: "Standard" },
]

const partnerships = [
  { id: 1, name: "Bluesky", email: "email@gmailstatedomain.net" },
  { id: 2, name: "Bluerights", email: "email@gmailstatedomain.net" },
  { id: 3, name: "Nova group", email: "email@gmailstatedomain.net" },
  { id: 4, name: "Resilient Agency", email: "email@gmailstatedomain.net" },
]

export function CompanyProfile() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Company Profile</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <Button variant="outline" size="sm" className="text-sm bg-transparent">
            <span className="mr-1 sm:mr-2">👤</span> My Profile
          </Button>
          <Button variant="outline" size="sm" className="text-sm bg-transparent">
            <span className="mr-1 sm:mr-2">🔔</span> Notification
          </Button>
          <span className="text-sm font-medium">More</span>
          <Button variant="outline" size="sm" className="text-sm bg-transparent flex items-center gap-1">
            <LogOut className="w-4 h-4" /> Log Out
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Company Description Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Company Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Logo Upload */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Upload Logo</span>
              </div>

              {/* Company Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <p className="text-sm text-foreground">{companyData.name}</p>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed other passion socius. Integer tempore
                    portitor, tempore per, sed other passionate socius.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Agency</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Sales</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Market</span>
                </div>
                <div>
                  <span className="text-sm font-medium cursor-pointer text-blue-600 hover:underline">
                    + add role
                  </span>
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-2 lg:space-y-4 flex-1">
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <p className="text-sm font-medium">{companyData.email}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Address</label>
                  <p className="text-sm font-medium">{companyData.address}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Mobile Number</label>
                  <p className="text-sm font-medium">{companyData.phone}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Website Link</label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    {companyData.website}
                    <span className="cursor-pointer text-blue-600 hover:underline">↗</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Manage Users Card */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-3 sm:gap-0">
                <CardTitle className="text-lg">Manage Users and Permissions</CardTitle>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white text-sm gap-2">
                  <Plus className="w-4 h-4" /> Add User
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-600px">
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>User Role</TableHead>
                        <TableHead>System Role</TableHead>
                        <TableHead>Permission</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="text-sm">{user.name}</TableCell>
                          <TableCell>
                            <Select defaultValue={user.role.toLowerCase()}>
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="business manager">Business Manager</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="analyst">Analyst</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                              {user.systemRole}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Select defaultValue={user.permission.toLowerCase().replace(" ", "-")}>
                              <SelectTrigger className="w-32 h-8 text-xs border-purple-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full-access">Full Access</SelectItem>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="read-only">Read only</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8">
                              ⋮
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Partnerships Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Partnerships</CardTitle>
                <Tabs defaultValue="my-connections" className="mt-4">
                  <TabsList className="grid w-full max-w-xs grid-cols-2">
                    <TabsTrigger value="my-connections">My Connections</TabsTrigger>
                    <TabsTrigger value="discover">Discover</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {partnerships.map((partner) => (
                    <div
                      key={partner.id}
                      className="flex flex-col sm:flex-row sm:justify-between p-3 border rounded-lg gap-2 sm:gap-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {partner.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{partner.name}</p>
                          <p className="text-xs text-muted-foreground">{partner.email}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs bg-transparent">
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Candidates Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Candidates status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center gap-2">
                  <Download className="w-6 h-6 text-muted-foreground" />
                  <p className="text-xs font-medium">Download Files</p>
                  <p className="text-xs text-muted-foreground">CSV/PDF and 2025 files are allowed</p>
                </div>
                <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <p className="text-xs font-medium">Upload Files</p>
                  <p className="text-xs text-muted-foreground">Upload candidates list file</p>
                </div>
              </CardContent>
            </Card>

            {/* Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Theme", "Language", "Notification"].map((label, idx) => (
                  <div key={idx}>
                    <label className="text-xs text-muted-foreground block mb-2">{label}</label>
                    <Select defaultValue="light">
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs mt-2">Save</Button>
              </CardContent>
            </Card>

            {/* Billing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Billing & Subscription Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Current Plan</label>
                  <p className="text-sm font-medium">Premium</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Monthly Costs</label>
                  <p className="text-sm font-medium">$200</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Next Billing</label>
                  <p className="text-sm font-medium">January 25 2025</p>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs bg-transparent">
                  Update
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 sm:px-8 sm:py-3">Save Changes</Button>
      </div>
    </div>
  )
}
