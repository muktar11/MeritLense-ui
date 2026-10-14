"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import auditService from "@/app/api/admin/audit/endpoints"
import type { AuditLogEntry, CandidateTrail, TrailOrigin } from "@/app/api/admin/audit/types"

const PAGE_SIZE = 20

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "-"

interface CandidateTrailModalProps {
  // Exactly one: open by candidate id (from an audit row) or passport ID (typed).
  candidateId?: string | null
  passportId?: string | null
  onClose: () => void
}

export function CandidateTrailModal({ candidateId, passportId, onClose }: CandidateTrailModalProps) {
  const t = useTranslations("dashboard.admin.auditLog.trail")
  const target = candidateId || passportId

  return (
    <Dialog open={Boolean(target)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>
        {/* Keyed so every candidate starts from a fresh state. */}
        {target && <TrailBody key={target} candidateId={candidateId} passportId={passportId} />}
      </DialogContent>
    </Dialog>
  )
}

function TrailBody({ candidateId, passportId }: { candidateId?: string | null; passportId?: string | null }) {
  const t = useTranslations("dashboard.admin.auditLog.trail")
  const [trail, setTrail] = useState<CandidateTrail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<AuditLogEntry[]>([])
  const [eventsTotal, setEventsTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [ip, setIp] = useState("")
  // The events query last answered; loading while it differs from the current one.
  const [loadedQuery, setLoadedQuery] = useState("")
  const eventsQuery = `${ip}|${page}`
  const loading = !trail && !error
  const eventsLoading = loadedQuery !== eventsQuery

  useEffect(() => {
    auditService
      .getCandidateTrail(candidateId ? { candidate_id: candidateId } : { passport_id: passportId ?? "" })
      .then(setTrail)
      .catch((err) => {
        const code = (err as { code?: string })?.code
        setError(code === "candidate_not_found" ? t("notFound") : t("failed"))
      })
  }, [candidateId, passportId, t])

  useEffect(() => {
    if (!trail) return
    auditService
      .getAuditLogs({ candidate_id: trail.candidate.id, ip_address: ip || undefined, page, page_size: PAGE_SIZE })
      .then((response) => {
        setEvents(response.results)
        setEventsTotal(response.count)
      })
      .finally(() => setLoadedQuery(`${ip}|${page}`))
  }, [trail, ip, page])

  // Every IP the summary knows about, for one-click filtering.
  const knownIps = useMemo(() => {
    if (!trail) return []
    const ips = new Set<string>()
    if (trail.registration?.ip_address) ips.add(trail.registration.ip_address)
    trail.assessments.forEach((a) => {
      if (a.created_origin?.ip_address) ips.add(a.created_origin.ip_address)
      a.candidate_ips.forEach((x) => ips.add(x))
    })
    return Array.from(ips)
  }, [trail])

  const totalPages = Math.max(1, Math.ceil(eventsTotal / PAGE_SIZE))

  const filterBy = (value: string) => {
    setIp(value)
    setPage(1)
  }

  const renderIp = (value: string | null | undefined, key?: string) =>
    value ? (
      <button key={key} type="button" onClick={() => filterBy(value)} className="font-mono text-xs text-purple-700 hover:underline">
        {value}
      </button>
    ) : (
      <span key={key} className="text-xs text-gray-400">{t("noIp")}</span>
    )

  const renderOrigin = (origin: TrailOrigin) => (
    <p className="text-sm text-gray-700">
      {t("byFrom", { name: origin.by_name || origin.by_email, email: origin.by_email, at: formatDate(origin.at) })}{" "}
      {renderIp(origin.ip_address)}
    </p>
  )

  return (
    <>
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {trail && (
          <div className="space-y-5">
            {/* Candidate and who registered it */}
            <section className="rounded-lg border border-gray-200 p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-gray-900">{trail.candidate.name}</h4>
                <Badge variant="outline" className="font-mono">{trail.candidate.passport_id}</Badge>
                <Badge variant="outline">{trail.candidate.status}</Badge>
              </div>
              <p className="text-sm text-gray-600">
                {t("owner", { owner: trail.candidate.owner_email ?? "-", company: trail.candidate.company ?? "-" })}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("registered")}</p>
              {trail.registration ? (
                renderOrigin(trail.registration)
              ) : (
                <p className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-sm text-amber-900">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {t("noRegistration", { at: formatDate(trail.candidate.created_at) })}
                </p>
              )}
            </section>

            {/* Assessments */}
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t("assessments")}</p>
              {trail.assessments.length === 0 && <p className="text-sm text-gray-500">{t("noAssessments")}</p>}
              {trail.assessments.map((a) => (
                <div key={a.session_id} className="rounded-lg border border-gray-200 p-3 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900">{a.role_code}</span>
                    <Badge variant="outline">{a.evaluation_tier}</Badge>
                    <Badge variant="outline">{a.status}</Badge>
                    <span className="text-xs text-gray-500">
                      {t("ran", { start: formatDate(a.started_at), end: formatDate(a.ended_at) })}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-500">{t("createdBy")}</p>
                  {a.created_origin ? (
                    renderOrigin(a.created_origin)
                  ) : (
                    <p className="text-sm text-gray-700">
                      {a.created_by_email ?? "-"} · {formatDate(a.created_at)} · <span className="text-xs text-gray-400">{t("noIp")}</span>
                    </p>
                  )}
                  <p className="text-xs font-semibold text-gray-500">{t("candidateIps")}</p>
                  <div className="flex flex-wrap gap-2">
                    {a.candidate_ips.length ? a.candidate_ips.map((x) => renderIp(x, x)) : renderIp(null)}
                  </div>
                </div>
              ))}
            </section>

            {/* Every event, filterable by IP */}
            <section className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("events", { count: trail.event_count })}
                </p>
                <span className="text-xs text-gray-500">{t("filterIp")}</span>
                <Button size="sm" variant={ip ? "outline" : "default"} onClick={() => filterBy("")}>
                  {t("allIps")}
                </Button>
                {knownIps.map((x) => (
                  <Button key={x} size="sm" variant={ip === x ? "default" : "outline"} className="font-mono"
                          onClick={() => filterBy(x)}>
                    {x}
                  </Button>
                ))}
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>{t("col.when")}</TableHead>
                      <TableHead>{t("col.who")}</TableHead>
                      <TableHead>{t("col.action")}</TableHead>
                      <TableHead>{t("col.ip")}</TableHead>
                      <TableHead>{t("col.details")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-center">
                          <Loader2 className="inline w-5 h-5 animate-spin text-purple-600" />
                        </TableCell>
                      </TableRow>
                    ) : events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-center text-sm text-gray-500">{t("noEvents")}</TableCell>
                      </TableRow>
                    ) : (
                      events.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="whitespace-nowrap text-xs text-gray-600">{formatDate(e.created_at)}</TableCell>
                          <TableCell className="text-xs">
                            {e.user_email === "system" ? <span className="text-gray-500">{t("candidateOrSystem")}</span> : e.user_email}
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{e.action_display}</Badge></TableCell>
                          <TableCell>{renderIp(e.ip_address)}</TableCell>
                          <TableCell className="max-w-xs">
                            <p className="truncate text-xs text-gray-600" title={e.description}>{e.description}</p>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {eventsTotal > PAGE_SIZE && (
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                  <span className="text-sm text-gray-600">{t("page", { current: page, total: totalPages })}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                </div>
              )}
            </section>
          </div>
        )}
    </>
  )
}
