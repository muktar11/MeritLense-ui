"use client"

import { useCallback, useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { Info, Loader2, MoreVertical, Pencil, Plus, Trash2, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import TablePagination from "@/components/ui/table-pagination"
import teamService from "@/app/api/team/endpoints"
import type { TeamInvitation, TeamMember } from "@/app/api/team/types"
import { InviteTeamModal } from "../invite-team-modal"
import { EditTeamModal } from "../edit-team-modal"
import { PendingInvitations } from "../pending-invitations"
import {
  ACCESS_PRESETS,
  PRESET_PERMISSIONS,
  ROLE_JOB_TITLE,
  ROLE_PRESET,
  TEAM_ROLES,
  accessPresetFor,
  initialsOf,
  roleForJobTitle,
  type AccessPreset,
  type TeamRole,
} from "../team-roles"
import { SectionCard, primaryButtonClass } from "./section-card"

const PAGE_SIZE = 10
const LEGACY = "__legacy__"
const CUSTOM = "__custom__"

function Legend({ label, rows }: { label: string; rows: { name: string; help: string }[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={label} title={label} className="text-gray-400 hover:text-purple-600">
          <Info className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 space-y-2 p-3">
        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{label}</p>
        {rows.map((row) => (
          <div key={row.name} className="text-xs">
            <p className="font-semibold text-purple-700 dark:text-purple-300">{row.name}</p>
            <p className="text-gray-600 dark:text-gray-400">{row.help}</p>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TeamAccessCard({ id, isOwner }: { id: string; isOwner: boolean }) {
  const t = useTranslations("dashboard.business.company-profile")
  const locale = useLocale()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [teamMembers, pending] = await Promise.all([
        teamService.getTeamMembers(),
        teamService.getPendingInvitations(),
      ])
      setMembers(teamMembers)
      setInvitations(pending)
    } catch (fetchError) {
      console.error("Failed to fetch team data:", fetchError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOwner) refresh()
  }, [isOwner, refresh])

  const update = async (member: TeamMember, data: { job_title?: string; permissions?: string[] }) => {
    setUpdating(member.id)
    setError(null)
    try {
      await teamService.updateTeamMember(member.id, data)
      await refresh()
    } catch (updateError) {
      console.error("Failed to update team member:", updateError)
      setError(t("staff.updateFailed"))
    } finally {
      setUpdating(null)
    }
  }

  // Choosing a role gives the member that role's permissions.
  const changeRole = (member: TeamMember, role: TeamRole) =>
    update(member, { job_title: ROLE_JOB_TITLE[role], permissions: PRESET_PERMISSIONS[ROLE_PRESET[role]] })

  const changeAccess = (member: TeamMember, preset: AccessPreset) =>
    update(member, { permissions: PRESET_PERMISSIONS[preset] })

  const removeMember = async (member: TeamMember) => {
    if (!confirm(t("removeMemberConfirm"))) return
    setUpdating(member.id)
    try {
      await teamService.removeTeamMember(member.id)
      await refresh()
    } catch (removeError) {
      console.error("Failed to remove team member:", removeError)
      setError(t("staff.updateFailed"))
    } finally {
      setUpdating(null)
    }
  }

  const cancelInvitation = async (invitationId: number) => {
    try {
      await teamService.cancelInvitation(invitationId)
      await refresh()
    } catch (cancelError) {
      console.error("Failed to cancel invitation:", cancelError)
    }
  }

  if (!isOwner) {
    return (
      <SectionCard id={id} icon={Users} title={t("manageUsers")} subtitle={t("staff.subtitle")}>
        <p className="text-sm text-gray-500">{t("staff.ownerOnly")}</p>
      </SectionCard>
    )
  }

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = members.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const roleLegend = TEAM_ROLES.map((role) => ({ name: t(`staff.roles.${role}`), help: t(`staff.roleHelp.${role}`) }))
  const accessLegend = [...ACCESS_PRESETS, "custom" as const].map((preset) => ({
    name: t(`staff.access.${preset}`),
    help: t(`staff.accessHelp.${preset}`),
  }))

  const roleSelect = (member: TeamMember, className: string) => {
    const role = roleForJobTitle(member.job_title)
    return (
      <Select
        value={role ?? LEGACY}
        onValueChange={(value) => value !== LEGACY && changeRole(member, value as TeamRole)}
        disabled={updating === member.id}
      >
        <SelectTrigger
          className={`${className} h-8 border-purple-200 text-xs text-purple-700`}
          aria-label={t("staff.role")}
          title={role ? undefined : t("staff.legacyRole", { title: member.job_title || "—" })}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {!role && (
            <SelectItem value={LEGACY} disabled>
              {member.job_title || "—"}
            </SelectItem>
          )}
          {TEAM_ROLES.map((r) => (
            <SelectItem key={r} value={r}>{t(`staff.roles.${r}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  const accessSelect = (member: TeamMember, className: string) => {
    const preset = accessPresetFor(member.permissions)
    const value = preset === "custom" || preset === "none" ? CUSTOM : preset
    return (
      <Select
        value={value}
        onValueChange={(next) => next !== CUSTOM && changeAccess(member, next as AccessPreset)}
        disabled={updating === member.id}
      >
        <SelectTrigger className={`${className} h-8 border-purple-200 text-xs text-purple-700`} aria-label={t("staff.permissions")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {value === CUSTOM && (
            <SelectItem value={CUSTOM} disabled>{t(`staff.access.${preset === "none" ? "none" : "custom"}`)}</SelectItem>
          )}
          {ACCESS_PRESETS.map((p) => (
            <SelectItem key={p} value={p}>{t(`staff.access.${p}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  const status = (member: TeamMember) => (
    <span className={`inline-flex items-center gap-2 text-xs font-medium ${member.is_active ? "text-green-700" : "text-gray-500"}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${member.is_active ? "bg-green-500" : "bg-gray-400"}`} />
      {member.is_active ? t("memberActive") : t("memberInactive")}
    </span>
  )

  const actions = (member: TeamMember) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded p-1 text-gray-600 hover:bg-gray-100"
          disabled={updating === member.id}
          aria-label={t("actions.moreActions")}
          title={t("actions.moreActions")}
        >
          {updating === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setEditing(member)}>
          <Pencil className="mr-2 h-4 w-4" /> {t("actions.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => removeMember(member)} variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" /> {t("actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const avatar = (member: TeamMember) => (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
      {initialsOf(member.first_name, member.last_name, member.email)}
    </span>
  )

  const joined = (member: TeamMember) =>
    member.invitation_accepted_at
      ? t("joinedLabel", {
          date: format(new Date(member.invitation_accepted_at), "MMM d, yyyy", locale === "ar" ? { locale: ar } : undefined),
        })
      : null

  return (
    <SectionCard
      id={id}
      icon={Users}
      title={t("manageUsers")}
      subtitle={t("staff.subtitle")}
      action={
        <button type="button" className={primaryButtonClass} onClick={() => setInviteOpen(true)}>
          <Plus className="h-4 w-4" /> {t("addUser")}
        </button>
      }
    >
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading && members.length === 0 ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-start text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <th className="px-3 py-2 text-start">{t("staff.name")}</th>
                  <th className="px-3 py-2 text-start">{t("staff.email")}</th>
                  <th className="px-3 py-2 text-start">
                    <span className="inline-flex items-center gap-1">{t("staff.role")} <Legend label={t("staff.roleInfo")} rows={roleLegend} /></span>
                  </th>
                  <th className="px-3 py-2 text-start">
                    <span className="inline-flex items-center gap-1">{t("staff.permissions")} <Legend label={t("staff.permissionsInfo")} rows={accessLegend} /></span>
                  </th>
                  <th className="px-3 py-2 text-start">{t("staff.status")}</th>
                  <th className="px-3 py-2 text-end">{t("staff.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">{t("noTeamMembers")}</td>
                  </tr>
                ) : (
                  visible.map((member) => (
                    <tr key={member.id}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          {avatar(member)}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{member.first_name} {member.last_name}</p>
                            {joined(member) && <p className="text-xs text-gray-400">{joined(member)}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="max-w-48 truncate px-3 py-2 text-gray-600 dark:text-gray-400">{member.email}</td>
                      <td className="px-3 py-2">{roleSelect(member, "w-36")}</td>
                      <td className="px-3 py-2">{accessSelect(member, "w-36")}</td>
                      <td className="px-3 py-2">{status(member)}</td>
                      <td className="px-3 py-2 text-end">{actions(member)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y md:hidden">
            {members.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">{t("noTeamMembers")}</p>
            ) : (
              visible.map((member) => (
                <div key={member.id} className="py-3">
                  <div className="flex items-start gap-3">
                    {avatar(member)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{member.first_name} {member.last_name}</p>
                      <p className="truncate text-xs text-gray-500">{member.email}</p>
                      <div className="mt-1">{status(member)}</div>
                    </div>
                    {actions(member)}
                  </div>
                  <div className="mt-2 flex gap-2">
                    {roleSelect(member, "flex-1")}
                    {accessSelect(member, "flex-1")}
                  </div>
                </div>
              ))
            )}
            <div className="flex gap-4 pt-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">{t("staff.role")} <Legend label={t("staff.roleInfo")} rows={roleLegend} /></span>
              <span className="inline-flex items-center gap-1">{t("staff.permissions")} <Legend label={t("staff.permissionsInfo")} rows={accessLegend} /></span>
            </div>
          </div>

          {members.length > PAGE_SIZE && (
            <TablePagination
              currentPage={safePage}
              totalItems={members.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel={t("itemLabelPlural")}
            />
          )}

          <PendingInvitations invitations={invitations} onCancel={cancelInvitation} />
        </>
      )}

      <InviteTeamModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} onSuccess={refresh} />
      {editing && (
        <EditTeamModal member={editing} isOpen={!!editing} onClose={() => setEditing(null)} onSuccess={refresh} />
      )}
    </SectionCard>
  )
}
