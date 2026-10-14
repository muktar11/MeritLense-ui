"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2, Search, Globe, User as UserIcon, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import auditService from "@/app/api/admin/audit/endpoints"
import type { IpTraceResult } from "@/app/api/admin/audit/types"

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/
const looksLikeIp = (value: string) => IPV4.test(value) || (value.includes(":") && !value.includes("@"))
const DAY_OPTIONS = [7, 30, 90, 365]

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

interface IpTracerProps {
  // Opens the Audit Logs tab filtered to this IP.
  onViewLogs: (ip: string) => void
  // Anything that isn't an email or IP is taken as a candidate passport ID.
  onOpenTrail: (passportId: string) => void
}

export function IpTracer({ onViewLogs, onOpenTrail }: IpTracerProps) {
  const t = useTranslations("dashboard.admin.auditLog.ipTracer")
  const [query, setQuery] = useState("")
  const [days, setDays] = useState(90)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<IpTraceResult | null>(null)

  const trace = async (value: string = query, period: number = days) => {
    const term = value.trim()
    if (!term) {
      setError(t("invalid"))
      return
    }
    if (!looksLikeIp(term) && !term.includes("@")) {
      setError(null)
      onOpenTrail(term)
      return
    }
    setQuery(term)
    setLoading(true)
    setError(null)
    try {
      setResult(await auditService.traceIp(looksLikeIp(term) ? { ip: term, days: period } : { email: term, days: period }))
    } catch (err) {
      // apiClient rejects with the response body: { detail, code }.
      const code = (err as { code?: string })?.code
      setResult(null)
      setError(code === "account_not_found" ? t("notFound") : code === "invalid_query" ? t("invalid") : t("failed"))
    } finally {
      setLoading(false)
    }
  }

  const IpCell = ({ ip }: { ip: string }) => (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => trace(ip)} className="font-mono text-sm text-purple-700 hover:underline">
        {ip}
      </button>
      <button type="button" onClick={() => onViewLogs(ip)} className="text-xs text-gray-500 hover:text-gray-800">
        {t("viewLogs")}
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-white space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t("title")}</h3>
          <p className="text-sm text-gray-600">{t("subtitle")}</p>
        </div>
        <form
          className="flex flex-col sm:flex-row gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            trace()
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              dir="ltr"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("placeholder")}
              className="ps-10"
            />
          </div>
          <Select
            value={String(days)}
            onValueChange={(v) => {
              setDays(Number(v))
              if (result) trace(query, Number(v))
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS.map((d) => (
                <SelectItem key={d} value={String(d)}>{t("days", { days: d })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("trace")}
          </Button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-gray-500">{t("note")}</p>
      </Card>

      {result?.mode === "account" && (
        <>
          <Card className="bg-white shadow-sm border-0">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-purple-600" />
              <h4 className="font-semibold text-gray-900">{t("accountHeading", { email: result.account.email })}</h4>
              <Badge variant="outline">{result.account.role}</Badge>
            </div>
            {result.ips.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">{t("empty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>{t("col.ip")}</TableHead>
                      <TableHead>{t("col.firstSeen")}</TableHead>
                      <TableHead>{t("col.lastSeen")}</TableHead>
                      <TableHead>{t("col.events")}</TableHead>
                      <TableHead>{t("col.logins")}</TableHead>
                      <TableHead>{t("col.failed")}</TableHead>
                      <TableHead>{t("col.shared")}</TableHead>
                      <TableHead>{t("col.browsers")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.ips.map((row) => (
                      <TableRow key={row.ip_address}>
                        <TableCell><IpCell ip={row.ip_address} /></TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{formatDate(row.first_seen)}</TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{formatDate(row.last_seen)}</TableCell>
                        <TableCell>{row.events}</TableCell>
                        <TableCell>{row.logins}</TableCell>
                        <TableCell>
                          {row.failed_logins > 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-700">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {row.failed_logins}
                            </span>
                          ) : 0}
                        </TableCell>
                        <TableCell>
                          {row.other_accounts > 0 ? (
                            <Badge className="bg-amber-100 text-amber-800">{row.other_accounts}</Badge>
                          ) : 0}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {row.user_agents.map((agent) => (
                            <p key={agent} className="text-xs text-gray-500 truncate" title={agent}>{agent}</p>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>

          {result.candidate_ips.length > 0 && (
            <Card className="bg-white shadow-sm border-0">
              <div className="p-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900">{t("candidateHeading")}</h4>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>{t("col.ip")}</TableHead>
                      <TableHead>{t("col.firstSeen")}</TableHead>
                      <TableHead>{t("col.lastSeen")}</TableHead>
                      <TableHead>{t("col.events")}</TableHead>
                      <TableHead>{t("col.sessions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.candidate_ips.map((row) => (
                      <TableRow key={row.ip_address}>
                        <TableCell><IpCell ip={row.ip_address} /></TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{formatDate(row.first_seen)}</TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{formatDate(row.last_seen)}</TableCell>
                        <TableCell>{row.events}</TableCell>
                        <TableCell>{row.sessions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}

      {result?.mode === "ip" && (
        <Card className="bg-white shadow-sm border-0">
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
            <Globe className="w-4 h-4 text-purple-600" />
            <h4 className="font-semibold text-gray-900">{t("ipHeading", { ip: result.ip })}</h4>
            <button type="button" onClick={() => onViewLogs(result.ip)} className="text-xs text-purple-700 hover:underline">
              {t("viewLogs")}
            </button>
          </div>
          {result.accounts.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>{t("col.account")}</TableHead>
                    <TableHead>{t("col.firstSeen")}</TableHead>
                    <TableHead>{t("col.lastSeen")}</TableHead>
                    <TableHead>{t("col.events")}</TableHead>
                    <TableHead>{t("col.logins")}</TableHead>
                    <TableHead>{t("col.failed")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.accounts.map((row) => (
                    <TableRow key={row.user_id}>
                      <TableCell>
                        <button type="button" onClick={() => trace(row.email)} className="text-start">
                          <p className="font-medium text-purple-700 hover:underline">{row.name || row.email}</p>
                          <p className="text-xs text-gray-500">{row.email} · {row.role}</p>
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{formatDate(row.first_seen)}</TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{formatDate(row.last_seen)}</TableCell>
                      <TableCell>{row.events}</TableCell>
                      <TableCell>{row.logins}</TableCell>
                      <TableCell>{row.failed_logins}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {result.unattributed_events > 0 && (
            <p className="p-4 border-t border-gray-100 text-sm text-gray-600">
              {t("unattributed", { count: result.unattributed_events })}
            </p>
          )}
        </Card>
      )}
    </div>
  )
}
