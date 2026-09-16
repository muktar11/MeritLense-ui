"use client";

import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface JobRoleTabsProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
  roleCounts: Record<string, number>;
}

export const UNASSESSED_ROLE_BUCKET = "unassessed";

// The 21 granular role_code values interviews are actually scored against
// (api/interviews - ROLE_NAMES in seed_package_architecture.py), same set
// the "Create Workforce Readiness Assessment" role package picker offers -
// this dropdown used to be hardcoded to a separate, coarser 7-value
// Candidate.job_role classification, so most of a company's real roles (e.g.
// Security Guard, Farm Worker) never appeared as filter options here at all.
const ROLE_CODES = [
  "domestic_worker",
  "child_caregiver",
  "elderly_caregiver",
  "special_needs_caregiver",
  "nursing_assistant",
  "home_care_assistant",
  "elderly_medical_support",
  "basic_patient_support",
  "hotel_housekeeper",
  "front_desk_agent",
  "restaurant_staff",
  "security_guard",
  "event_security",
  "commercial_cleaner",
  "industrial_cleaner",
  "warehouse_staff",
  "driver",
  "general_labor",
  "skilled_trades",
  "farm_worker",
  "livestock_support",
];

export function JobRoleTabs({ selectedRole, onRoleChange, roleCounts }: JobRoleTabsProps) {
  const t = useTranslations("dashboard.business.score-management.jobRoleTabs");
  const tRoles = useTranslations("shared.startSessionModal.roles");

  // Older sessions can still carry a role_code from a previous taxonomy
  // (e.g. a legacy 2-letter code) that isn't one of the current 21 - rather
  // than hide those candidates' scores from every dropdown option, any such
  // code that actually shows up in the data gets its own entry too, labeled
  // with the raw code since there's no translation for it.
  const knownCodes = new Set(ROLE_CODES);
  const extraCodes = Object.keys(roleCounts).filter(
    (code) => code !== UNASSESSED_ROLE_BUCKET && !knownCodes.has(code)
  );

  return (
    <div className="mb-6">
      <Select value={selectedRole} onValueChange={onRoleChange}>
        <SelectTrigger className="w-full sm:w-72 bg-white">
          <SelectValue placeholder={t("selectPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {ROLE_CODES.map((roleCode) => (
            <SelectItem key={roleCode} value={roleCode}>
              {tRoles(roleCode)}
              {roleCounts[roleCode] > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-gray-100 rounded-full text-gray-600">
                  {roleCounts[roleCode]}
                </span>
              )}
            </SelectItem>
          ))}
          {extraCodes.map((roleCode) => (
            <SelectItem key={roleCode} value={roleCode}>
              {roleCode}
              {roleCounts[roleCode] > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-gray-100 rounded-full text-gray-600">
                  {roleCounts[roleCode]}
                </span>
              )}
            </SelectItem>
          ))}
          <SelectItem value={UNASSESSED_ROLE_BUCKET}>
            {t("unassessed")}
            {roleCounts[UNASSESSED_ROLE_BUCKET] > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs bg-gray-100 rounded-full text-gray-600">
                {roleCounts[UNASSESSED_ROLE_BUCKET]}
              </span>
            )}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
