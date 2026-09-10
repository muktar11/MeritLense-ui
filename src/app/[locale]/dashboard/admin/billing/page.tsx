// app/dashboard/admin/billing/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useLocale, useTranslations } from "next-intl"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvoicesTab } from "./components/invoices-tab"
import {
  Download,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  AlertCircle
} from "lucide-react"
import adminBillingService from "@/app/api/admin/billing/endpoints"
import type { AdminSubscription, AdminSubscriptionStats } from "@/app/api/admin/billing/types"

export default function BillingAndSubscriptions() {
  const t = useTranslations("dashboard.admin.billing")
  const tSubStatus = useTranslations("dashboard.indivisual.settings.billing-tab.subscriptionStatus")
  const locale = useLocale()

  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([])
  const [stats, setStats] = useState<AdminSubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Subscription detail view - reuses the row's already-fetched data
  // (list responses already include price_details/status/etc. in full),
  // no extra API call needed just to view it.
  const [viewingSubscription, setViewingSubscription] = useState<AdminSubscription | null>(null)

  useEffect(() => {
    fetchSubscriptions()
  }, [currentPage, statusFilter, searchTerm])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const data = await adminBillingService.getSubscriptions({
        page: currentPage,
        page_size: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      setSubscriptions(data.results)
      setTotalCount(data.count)
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const data = await adminBillingService.getStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  // Calculate plan distribution from subscriptions (with safety check)
  const planDistribution = subscriptions && subscriptions.length > 0
    ? subscriptions.reduce((acc, sub) => {
        const planName = sub.price_details?.name || 'Unknown'
        if (!acc[planName]) {
          acc[planName] = { count: 0, revenue: 0 }
        }
        acc[planName].count += 1
        acc[planName].revenue += (parseFloat(sub.price_details?.unit_amount || '0') * (sub.quantity || 1))
        return acc
      }, {} as Record<string, { count: number; revenue: number }>)
    : {}

  const totalPages = Math.ceil(totalCount / pageSize)

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'trialing':
        return 'bg-blue-100 text-blue-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
        return 'bg-gray-100 text-gray-800'
      case 'incomplete':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Format currency
  const formatCurrency = (amount: string | number, currency: string = 'EUR') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy', locale === 'ar' ? { locale: ar } : undefined)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("title")}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              {t("export")}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="subscriptions">
          <TabsList>
            <TabsTrigger value="subscriptions">{t("tabs.subscriptions")}</TabsTrigger>
            <TabsTrigger value="invoices">{t("tabs.invoices")}</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-6 mt-6">
        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-32"></div>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-lonear-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">{t("stats.total")}</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total_subscriptions}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </Card>
            
            <Card className="p-6 bg-linear-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">{t("stats.active")}</p>
                  <p className="text-3xl font-bold text-green-900">{stats.active_subscriptions}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </Card>
            
            <Card className="p-6 bg-linear-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">{t("stats.revenue")}</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {formatCurrency(stats.monthly_revenue)}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-purple-500 opacity-50" />
              </div>
            </Card>
            
            <Card className="p-6 bg-linear-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">{t("stats.expiring")}</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.recent_expiring}</p>
                </div>
                <Calendar className="w-10 h-10 text-orange-500 opacity-50" />
              </div>
            </Card>
          </div>
        ) : null}

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t("search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("filters.allStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStatus")}</SelectItem>
                <SelectItem value="active">{tSubStatus("active")}</SelectItem>
                <SelectItem value="trialing">{tSubStatus("trialing")}</SelectItem>
                <SelectItem value="incomplete">{tSubStatus("incomplete")}</SelectItem>
                <SelectItem value="past_due">{tSubStatus("pastDue")}</SelectItem>
                <SelectItem value="canceled">{tSubStatus("canceled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Plan Distribution Summary */}
        {Object.keys(planDistribution).length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{t("planDistribution")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(planDistribution).map(([plan, data]) => (
                <div key={plan} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{plan}</p>
                    <p className="text-xs text-gray-500">{t("subscriberCount", { count: data.count })}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(data.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Subscriptions Table */}
        <Card className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>{t("table.user")}</TableHead>
                    <TableHead>{t("table.plan")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead>{t("table.amount")}</TableHead>
                    <TableHead>{t("table.periodEnd")}</TableHead>
                    <TableHead>{t("table.daysLeft")}</TableHead>
                    <TableHead>{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!subscriptions || subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {t("noSubscriptionsFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((sub) => {
                      const daysLeft = sub.current_period_end 
                        ? Math.ceil((new Date(sub.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : 0
                      
                      return (
                        <TableRow key={sub.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{sub.user_name}</p>
                              <p className="text-sm text-gray-500">{sub.user_email}</p>
                            </div>
                            {sub.company && (
                              <p className="text-xs text-gray-400">{sub.company_name || t("companyIdLabel", { id: sub.company })}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.price_details?.name || t("unknownPlan")}</p>
                              <p className="text-xs text-gray-500">
                                {sub.price_details?.billing_type === 'ONE_TIME'
                                  ? t("oneTime")
                                  : (sub.price_details?.interval?.toLowerCase() || t("monthlyFallback"))}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(sub.status)}>
                              {(() => {
                                const key = sub.status === 'past_due' ? 'pastDue' : sub.status
                                return tSubStatus.has(key) ? tSubStatus(key) : sub.status
                              })()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {formatCurrency(sub.price_details?.unit_amount || '0', sub.price_details?.currency)}
                            </p>
                            {sub.quantity > 1 && (
                              <p className="text-xs text-gray-500">x{sub.quantity}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {sub.current_period_end
                                ? formatDate(sub.current_period_end)
                                : t("notAvailable")}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              daysLeft < 7 && daysLeft > 0 && sub.status !== 'canceled' ? 'border-orange-200 text-orange-700' : ''
                            }>
                              {sub.status === 'canceled' ? t("notAvailable") : daysLeft > 0 ? t("daysLeftLabel", { days: daysLeft }) : t("expiredLabel")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingSubscription(sub)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination - only show if we have pagination */}
              {totalCount > pageSize && (
                <div className="p-4 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {t("pagination.showing", { start: ((currentPage - 1) * pageSize) + 1, end: Math.min(currentPage * pageSize, totalCount), total: totalCount })}
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
                    <span className="text-sm">
                      {t("pagination.page", { current: currentPage, total: totalPages })}
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
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            <InvoicesTab />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={viewingSubscription !== null} onOpenChange={(open) => !open && setViewingSubscription(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialog.title")}</DialogTitle>
          </DialogHeader>
          {viewingSubscription && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t("dialog.customer")}</p>
                <p className="font-medium text-gray-900">{viewingSubscription.user_name}</p>
                <p className="text-gray-500">{viewingSubscription.user_email}</p>
                {viewingSubscription.company && (
                  <p className="text-xs text-gray-400">{viewingSubscription.company_name || t("companyIdLabel", { id: viewingSubscription.company })}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t("dialog.plan")}</p>
                  <p className="font-medium">{viewingSubscription.price_details?.name || t("unknownPlan")}</p>
                  <p className="text-xs text-gray-500">
                    {viewingSubscription.price_details?.billing_type === 'ONE_TIME'
                      ? t("oneTime")
                      : (viewingSubscription.price_details?.interval?.toLowerCase() || t("monthlyFallback"))}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t("dialog.status")}</p>
                  <Badge className={getStatusColor(viewingSubscription.status)}>
                    {(() => {
                      const key = viewingSubscription.status === 'past_due' ? 'pastDue' : viewingSubscription.status
                      return tSubStatus.has(key) ? tSubStatus(key) : viewingSubscription.status
                    })()}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t("dialog.amount")}</p>
                  <p className="font-medium">
                    {formatCurrency(
                      viewingSubscription.price_details?.unit_amount || '0',
                      viewingSubscription.price_details?.currency
                    )}
                    {viewingSubscription.quantity > 1 && ` x${viewingSubscription.quantity}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t("dialog.currentPeriod")}</p>
                  <p>
                    {viewingSubscription.current_period_start ? formatDate(viewingSubscription.current_period_start) : t("notAvailable")}
                    {' - '}
                    {viewingSubscription.current_period_end ? formatDate(viewingSubscription.current_period_end) : t("notAvailable")}
                  </p>
                </div>
                {viewingSubscription.trial_end && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t("dialog.trialEnds")}</p>
                    <p>{formatDate(viewingSubscription.trial_end)}</p>
                  </div>
                )}
                {viewingSubscription.canceled_at && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t("dialog.canceledAt")}</p>
                    <p>{formatDate(viewingSubscription.canceled_at)}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t("dialog.stripeSubscriptionId")}</p>
                <p className="font-mono text-xs text-gray-600 break-all">{viewingSubscription.stripe_subscription_id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}