"use client"

import { useEffect, useState } from "react"
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
import { Download, Loader2, Search, Send } from "lucide-react"
import adminInvoiceService from "@/app/api/admin/invoices/endpoints"
import type { AdminInvoice } from "@/app/api/admin/invoices/types"

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  OPEN: "bg-blue-100 text-blue-800",
  DRAFT: "bg-gray-100 text-gray-800",
  VOID: "bg-gray-100 text-gray-500",
  UNCOLLECTIBLE: "bg-red-100 text-red-800",
}

export function InvoicesTab() {
  const t = useTranslations("dashboard.admin.billing.invoices")
  const locale = useLocale()

  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; kind: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchInvoices()
    }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const data = await adminInvoiceService.getInvoices({
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      })
      setInvoices(data)
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (invoice: AdminInvoice) => {
    setSendingId(invoice.id)
    setFeedback(null)
    try {
      await adminInvoiceService.sendInvoice(invoice.id)
      setFeedback({ id: invoice.id, kind: "success", message: t("sendSuccess", { email: invoice.user_email }) })
    } catch (error) {
      setFeedback({ id: invoice.id, kind: "error", message: t("sendFailed") })
    } finally {
      setSendingId(null)
    }
  }

  const formatCurrency = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency?.toUpperCase() || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return format(new Date(dateString), "MMM d, yyyy", locale === "ar" ? { locale: ar } : undefined)
  }

  return (
    <div className="space-y-6">
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
              <SelectItem value="PAID">{t("statusLabels.PAID")}</SelectItem>
              <SelectItem value="OPEN">{t("statusLabels.OPEN")}</SelectItem>
              <SelectItem value="DRAFT">{t("statusLabels.DRAFT")}</SelectItem>
              <SelectItem value="VOID">{t("statusLabels.VOID")}</SelectItem>
              <SelectItem value="UNCOLLECTIBLE">{t("statusLabels.UNCOLLECTIBLE")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>{t("table.customer")}</TableHead>
                <TableHead>{t("table.invoiceNumber")}</TableHead>
                <TableHead>{t("table.amount")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.date")}</TableHead>
                <TableHead>{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {t("noInvoicesFound")}
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const pdfLink = invoice.invoice_pdf || invoice.hosted_invoice_url
                  return (
                    <TableRow key={invoice.id} className="hover:bg-gray-50 align-top">
                      <TableCell>
                        <p className="font-medium text-gray-900">{invoice.user_full_name}</p>
                        <p className="text-sm text-gray-500">{invoice.user_email}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-mono text-xs text-gray-700">{invoice.number || invoice.stripe_invoice_id}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{formatCurrency(invoice.amount_due, invoice.currency)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[invoice.status] || "bg-gray-100 text-gray-800"}>
                          {t(`statusLabels.${invoice.status}` as any)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDate(invoice.paid_at || invoice.due_date)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {pdfLink ? (
                            <a href={pdfLink} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" title={t("download")}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">{t("noPdfYet")}</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t("send")}
                            disabled={sendingId === invoice.id || !pdfLink}
                            onClick={() => handleSend(invoice)}
                          >
                            {sendingId === invoice.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        {feedback && feedback.id === invoice.id && (
                          <p className={`text-xs mt-1 ${feedback.kind === "success" ? "text-green-600" : "text-red-600"}`}>
                            {feedback.message}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
