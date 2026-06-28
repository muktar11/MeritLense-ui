"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Moon, Sun, Bell, LogOut, Upload, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, XCircle } from "lucide-react"
import { useProfile } from "../../../../hooks/useProfile"
import { useAuth } from "../../../../hooks/useAuth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminProfileSettings() {
  const t = useTranslations("dashboard.admin.profile")
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1]
  
  const { profile, loading, error, updateProfile, fetchProfile } = useProfile()
  const { logout } = useAuth()
  const { changePassword } = useProfile()

  const [activeTab, setActiveTab] = useState("profile")
  const [isDark, setIsDark] = useState(false)
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    phone_number: "",
  })

  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  })
  
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{
    current_password?: string[];
    new_password?: string[];
    confirm_new_password?: string[];
    non_field_errors?: string[];
  }>({})
  
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasSymbol: false,
  })

  const [touchedFields, setTouchedFields] = useState({
    current_password: false,
    new_password: false,
    confirm_new_password: false,
  })

  // Load profile data
  useEffect(() => {
    fetchProfile()
  }, [])

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        department: profile.department || "",
        phone_number: profile.phone_number || "",
      })
    }
  }, [profile])

  const contractHistory = [
    { id: 1, nameKey: "contracts.update1", date: "6/10/2025", statusKey: "pending", color: "bg-yellow-100 text-yellow-800" },
    { id: 2, nameKey: "contracts.update2", date: "7/27/2025", statusKey: "success", color: "bg-green-100 text-green-800" },
    { id: 3, nameKey: "contracts.update3", date: "9/24/2025", statusKey: "failed", color: "bg-red-100 text-red-800" },
  ]

  const consumptionHistory = [
    { date: "Jun 24, 2025", typeKey: "evaluation", amount: "-100" },
    { date: "Mar 10, 2025", typeKey: "subscription", amount: "+200" },
    { date: "Nov 10, 2025", typeKey: "evaluation", amount: "+100" },
    { date: "Dec 20, 2025", typeKey: "evaluation", amount: "-200" },
  ]

  // Profile form handlers
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm(prev => ({ ...prev, [name]: value }))
    setProfileError(null)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const success = await updateProfile({
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      industry: profileForm.department,
      phone_number: profileForm.phone_number,
    })

    if (success) {
      setProfileSaveSuccess(true)
      setIsEditing(false)
      setTimeout(() => setProfileSaveSuccess(false), 3000)
    }
  }

  // Password change handlers
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
    
    // Clear field-specific errors when user starts typing
    setPasswordFieldErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name as keyof typeof passwordFieldErrors]
      delete newErrors.non_field_errors
      return newErrors
    })

    if (name === 'new_password') {
      setPasswordValidation({
        minLength: value.length >= 8,
        hasNumber: /\d/.test(value),
        hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      })
    }
  }

  const handleFieldBlur = (field: keyof typeof touchedFields) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }))
  }

  const validatePasswordForm = (): boolean => {
    const errors: typeof passwordFieldErrors = {}
    let isValid = true

    if (!passwordForm.current_password) {
      errors.current_password = ['Current password is required']
      isValid = false
    }

    if (!passwordForm.new_password) {
      errors.new_password = ['New password is required']
      isValid = false
    } else {
      if (!passwordValidation.minLength) {
        errors.new_password = ['Password must be at least 8 characters']
        isValid = false
      } else if (!passwordValidation.hasNumber || !passwordValidation.hasSymbol) {
        errors.new_password = ['Password must contain at least one number and one symbol']
        isValid = false
      }
    }

    if (!passwordForm.confirm_new_password) {
      errors.confirm_new_password = ['Please confirm your new password']
      isValid = false
    } else if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      errors.confirm_new_password = ['Passwords do not match']
      isValid = false
    }

    if (passwordForm.current_password && passwordForm.new_password && 
        passwordForm.current_password === passwordForm.new_password) {
      errors.new_password = ['New password must be different from current password']
      isValid = false
    }

    setPasswordFieldErrors(errors)
    return isValid
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouchedFields({
      current_password: true,
      new_password: true,
      confirm_new_password: true,
    })

    if (!validatePasswordForm()) {
      return
    }

    setPasswordLoading(true)
    setPasswordFieldErrors({})
    
    try {
      const success = await changePassword(passwordForm)
      
      if (success) {
        setPasswordSuccess(true)
        setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_new_password: "",
        })
        setPasswordValidation({
          minLength: false,
          hasNumber: false,
          hasSymbol: false,
        })
        setTouchedFields({
          current_password: false,
          new_password: false,
          confirm_new_password: false,
        })
        setTimeout(() => setPasswordSuccess(false), 5000)
      }
    } catch (err: any) {
      // Handle API errors
      if (err.current_password) {
        setPasswordFieldErrors(prev => ({ ...prev, current_password: err.current_password }))
      }
      if (err.new_password) {
        setPasswordFieldErrors(prev => ({ ...prev, new_password: err.new_password }))
      }
      if (err.confirm_new_password) {
        setPasswordFieldErrors(prev => ({ ...prev, confirm_new_password: err.confirm_new_password }))
      }
      if (err.non_field_errors) {
        setPasswordFieldErrors(prev => ({ ...prev, non_field_errors: err.non_field_errors }))
      }
      if (err.error) {
        setPasswordFieldErrors(prev => ({ ...prev, non_field_errors: [err.error] }))
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push(`/${locale}/auth/login`)
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const isPasswordValid = passwordValidation.minLength && passwordValidation.hasNumber && passwordValidation.hasSymbol
  const doPasswordsMatch = passwordForm.new_password === passwordForm.confirm_new_password

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-600 mt-2">{t("subtitle")}</p>
      </div>

      {/* Top Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap justify-between items-center gap-4">
        <span className="text-sm text-gray-600">{t("companyManagement")}</span>

        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => setIsDark(!isDark)} className="p-2 hover:bg-gray-100 rounded-lg">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <span className="text-xs text-gray-500">{t("lightMode")}</span>
          <span className="text-xs text-gray-500">{t("language")}</span>

          <Bell size={18} className="text-gray-600" />

          <button className="ml-2 px-3 py-1 text-xs bg-gray-100 rounded">
            {t("allowMode")}
          </button>

          <button 
            onClick={handleLogout}
            className="ml-2 px-3 py-1 text-xs bg-gray-100 rounded flex items-center gap-1 hover:bg-gray-200 transition"
          >
            <LogOut size={14} />
            {t("logout")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border-b">
          <TabsList className="w-full justify-start gap-8 px-6 bg-transparent">
            {/* <TabsTrigger value="msa" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-2 py-4">
              {t("tabs.msa")}
            </TabsTrigger> */}
            <TabsTrigger value="profile" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-2 py-4">
              {t("tabs.profile")}
            </TabsTrigger>
            {/* <TabsTrigger value="billing" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-2 py-4">
              {t("tabs.billing")}
            </TabsTrigger> */}
          </TabsList>
        </div>

        {/* MSA Tab */}
        {/* <TabsContent value="msa">
          <Card>
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-bold">{t("msa.title")}</h2>
              <p className="text-gray-600">{t("msa.description")}</p>

              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                {t("msa.review")}
              </Button>

              <div className="overflow-x-auto">
                <table className="w-full mt-6">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">{t("table.contract")}</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">{t("table.date")}</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">{t("table.status")}</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">{t("table.pdf")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractHistory.map(c => (
                      <tr key={c.id} className="border-b">
                        <td className="p-3 text-sm">{t(c.nameKey)}</td>
                        <td className="p-3 text-sm">{c.date}</td>
                        <td className="p-3">
                          <Badge className={c.color}>{t(`status.${c.statusKey}`)}</Badge>
                        </td>
                        <td className="p-3">
                          <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                            <Download size={14} />
                            <span className="text-sm">{t("download")}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t("title")}</CardTitle>
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      if (profile) {
                        setProfileForm({
                          first_name: profile.first_name || "",
                          last_name: profile.last_name || "",
                          email: profile.email || "",
                          department: profile.department || "",
                          phone_number: profile.phone_number || "",
                        })
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Success Message */}
              {profileSaveSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-green-600">Profile updated successfully!</p>
                </div>
              )}

              {/* Error Message */}
              {(error || profileError) && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-600">{error || profileError}</p>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    {isEditing ? (
                      <Input
                        id="first_name"
                        name="first_name"
                        value={profileForm.first_name}
                        onChange={handleProfileChange}
                        required
                      />
                    ) : (
                      <p className="text-sm text-gray-900 p-2 border rounded-lg bg-gray-50">
                        {profileForm.first_name || "—"}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    {isEditing ? (
                      <Input
                        id="last_name"
                        name="last_name"
                        value={profileForm.last_name}
                        onChange={handleProfileChange}
                        required
                      />
                    ) : (
                      <p className="text-sm text-gray-900 p-2 border rounded-lg bg-gray-50">
                        {profileForm.last_name || "—"}
                      </p>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <p className="text-sm text-gray-900 p-2 border rounded-lg bg-gray-50">
                      {profileForm.email}
                    </p>
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    {isEditing ? (
                      <Input
                        id="department"
                        name="department"
                        value={profileForm.department}
                        onChange={handleProfileChange}
                        placeholder="e.g., IT, HR, Finance"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 p-2 border rounded-lg bg-gray-50">
                        {profileForm.department || "—"}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone_number"
                        name="phone_number"
                        value={profileForm.phone_number}
                        onChange={handleProfileChange}
                        placeholder="+1234567890"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 p-2 border rounded-lg bg-gray-50">
                        {profileForm.phone_number || "—"}
                      </p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                )}
              </form>

              {/* Change Password Section */}
              <div className="border-t pt-8">
                <h3 className="text-lg font-semibold mb-6">Change Password</h3>

                {/* Password Success Message */}
                {passwordSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Password changed successfully!</p>
                      <p className="text-sm text-green-600">Please use your new password next time you log in.</p>
                    </div>
                  </div>
                )}

                {/* Non-field errors (general errors) */}
                {passwordFieldErrors.non_field_errors && passwordFieldErrors.non_field_errors.length > 0 && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      {passwordFieldErrors.non_field_errors.map((error, idx) => (
                        <p key={idx} className="text-sm text-red-600">{error}</p>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="current_password" className="flex items-center gap-1">
                      Current Password *
                      {touchedFields.current_password && passwordFieldErrors.current_password && (
                        <span className="text-xs text-red-500">(required)</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        name="current_password"
                        type={showPassword.current ? "text" : "password"}
                        value={passwordForm.current_password}
                        onChange={handlePasswordChange}
                        onBlur={() => handleFieldBlur('current_password')}
                        placeholder="Enter current password"
                        required
                        className={`pr-10 ${
                          touchedFields.current_password && passwordFieldErrors.current_password
                            ? 'border-red-500 focus:ring-red-500'
                            : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {touchedFields.current_password && passwordFieldErrors.current_password && (
                      <div className="mt-1">
                        {passwordFieldErrors.current_password.map((error, idx) => (
                          <p key={idx} className="text-xs text-red-500 flex items-center gap-1">
                            <XCircle size={12} />
                            {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="flex items-center gap-1">
                      New Password *
                      {touchedFields.new_password && passwordFieldErrors.new_password && (
                        <span className="text-xs text-red-500">(invalid)</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        name="new_password"
                        type={showPassword.new ? "text" : "password"}
                        value={passwordForm.new_password}
                        onChange={handlePasswordChange}
                        onBlur={() => handleFieldBlur('new_password')}
                        placeholder="Enter new password"
                        required
                        minLength={8}
                        className={`pr-10 ${
                          touchedFields.new_password && passwordFieldErrors.new_password
                            ? 'border-red-500 focus:ring-red-500'
                            : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Field-specific errors */}
                    {touchedFields.new_password && passwordFieldErrors.new_password && (
                      <div className="mt-2">
                        {passwordFieldErrors.new_password.map((error, idx) => (
                          <p key={idx} className="text-xs text-red-500 flex items-center gap-1 mb-1">
                            <XCircle size={12} />
                            {error}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Password strength indicator (only show if no field errors) */}
                    {!passwordFieldErrors.new_password && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isPasswordValid
                                ? "w-full bg-green-500"
                                : passwordValidation.minLength && (passwordValidation.hasNumber || passwordValidation.hasSymbol)
                                  ? "w-2/3 bg-yellow-500"
                                  : passwordValidation.minLength
                                    ? "w-1/3 bg-red-500"
                                    : "w-0"
                            }`}
                          />
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center gap-2">
                            {passwordValidation.minLength ? (
                              <CheckCircle size={14} className="text-green-600" />
                            ) : (
                              <span className="text-red-600 font-bold text-xs">✕</span>
                            )}
                            <span className="text-xs text-gray-600">At least 8 characters</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordValidation.hasNumber ? (
                              <CheckCircle size={14} className="text-green-600" />
                            ) : (
                              <span className="text-red-600 font-bold text-xs">✕</span>
                            )}
                            <span className="text-xs text-gray-600">Contains a number</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {passwordValidation.hasSymbol ? (
                              <CheckCircle size={14} className="text-green-600" />
                            ) : (
                              <span className="text-red-600 font-bold text-xs">✕</span>
                            )}
                            <span className="text-xs text-gray-600">Contains a symbol</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm_new_password" className="flex items-center gap-1">
                      Confirm New Password *
                      {touchedFields.confirm_new_password && passwordFieldErrors.confirm_new_password && (
                        <span className="text-xs text-red-500">(mismatch)</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm_new_password"
                        name="confirm_new_password"
                        type={showPassword.confirm ? "text" : "password"}
                        value={passwordForm.confirm_new_password}
                        onChange={handlePasswordChange}
                        onBlur={() => handleFieldBlur('confirm_new_password')}
                        placeholder="Confirm new password"
                        required
                        className={`pr-10 ${
                          touchedFields.confirm_new_password && passwordFieldErrors.confirm_new_password
                            ? 'border-red-500 focus:ring-red-500'
                            : passwordForm.new_password && passwordForm.confirm_new_password && 
                              passwordForm.new_password !== passwordForm.confirm_new_password
                              ? 'border-red-500 focus:ring-red-500'
                              : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    
                    {/* Confirm password errors */}
                    {touchedFields.confirm_new_password && passwordFieldErrors.confirm_new_password ? (
                      <div className="mt-1">
                        {passwordFieldErrors.confirm_new_password.map((error, idx) => (
                          <p key={idx} className="text-xs text-red-500 flex items-center gap-1">
                            <XCircle size={12} />
                            {error}
                          </p>
                        ))}
                      </div>
                    ) : (
                      passwordForm.new_password && passwordForm.confirm_new_password && 
                      passwordForm.new_password !== passwordForm.confirm_new_password && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <XCircle size={12} />
                          Passwords do not match
                        </p>
                      )
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={passwordLoading}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Changing Password...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        {/* <TabsContent value="billing">
          <Card>
            <CardContent className="p-8">
              <h3 className="text-lg font-semibold mb-6">{t("billing.title")}</h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">{t("table.date")}</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">{t("table.type")}</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">{t("table.amount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumptionHistory.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-3 text-sm">{item.date}</td>
                        <td className="p-3 text-sm">{t(`billing.types.${item.typeKey}`)}</td>
                        <td className={`p-3 text-sm ${item.amount.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                          {item.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button className="mt-6 bg-blue-600 text-white hover:bg-blue-700">
                {t("saveChanges")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  )
}