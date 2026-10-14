// Staff roles on the Company Profile page. The backend enforces only the
// permission codes (CompanyTeamPermissions); a role is a job_title plus the
// permission set it starts with. "Full/Standard/Review Only" are names for
// the usual permission sets, not stored values of their own.

export const ADD_CANDIDATES = "add_candidates"
export const SET_EVALUATION = "set_evaluation"
export const SET_SCORES = "set_scores"
export const SET_PAYMENT = "set_payment"
// Read-only: every assessment, report and certificate in the company.
export const VIEW_RESULTS = "view_results"

export const WRITE_PERMISSIONS = [ADD_CANDIDATES, SET_EVALUATION, SET_SCORES, SET_PAYMENT]

export type TeamRole = "admin" | "evaluator" | "reviewer"
export type AccessPreset = "full" | "standard" | "review"

export const TEAM_ROLES: TeamRole[] = ["admin", "evaluator", "reviewer"]
export const ACCESS_PRESETS: AccessPreset[] = ["full", "standard", "review"]

export const PRESET_PERMISSIONS: Record<AccessPreset, string[]> = {
  full: [...WRITE_PERMISSIONS, VIEW_RESULTS],
  standard: [ADD_CANDIDATES, SET_EVALUATION],
  review: [VIEW_RESULTS],
}

export const ROLE_PRESET: Record<TeamRole, AccessPreset> = {
  admin: "full",
  evaluator: "standard",
  reviewer: "review",
}

// Stored in TeamMemberProfile.job_title.
export const ROLE_JOB_TITLE: Record<TeamRole, string> = {
  admin: "Admin",
  evaluator: "Evaluator",
  reviewer: "Reviewer",
}

export function roleForJobTitle(jobTitle: string | null | undefined): TeamRole | null {
  const value = (jobTitle || "").trim().toLowerCase()
  return (TEAM_ROLES as string[]).includes(value) ? (value as TeamRole) : null
}

// "full" also matches a member given all four write permissions before
// view_results existed; anything else that isn't an exact set is "custom".
export function accessPresetFor(permissions: string[]): AccessPreset | "custom" | "none" {
  const held = new Set(permissions)
  if (WRITE_PERMISSIONS.every((p) => held.has(p))) return "full"
  if (held.size === 0) return "none"
  for (const preset of ["standard", "review"] as const) {
    const wanted = PRESET_PERMISSIONS[preset]
    if (wanted.length === held.size && wanted.every((p) => held.has(p))) return preset
  }
  return "custom"
}

export function initialsOf(firstName?: string, lastName?: string, email?: string): string {
  const letters = `${(firstName || "").trim().charAt(0)}${(lastName || "").trim().charAt(0)}`
  return (letters || (email || "?").charAt(0)).toUpperCase()
}
