"use client";

import { useTranslations } from "next-intl";
import { SearchSelect } from "@/components/app/searchable-fields";

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
  const tSearch = useTranslations("shared.searchableSelect");
  const count = (code: string) => (roleCounts[code] > 0 ? String(roleCounts[code]) : undefined);

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
      <SearchSelect
        id="job-role-tabs"
        aria-label={t("selectPlaceholder")}
        className="w-full sm:w-72"
        buttonClassName="bg-white"
        value={selectedRole}
        onChange={onRoleChange}
        placeholder={t("selectPlaceholder")}
        searchPlaceholder={tSearch("searchRoles")}
        options={[
          ...ROLE_CODES.map((roleCode) => ({ value: roleCode, label: tRoles(roleCode), hint: count(roleCode) })),
          ...extraCodes.map((roleCode) => ({ value: roleCode, label: roleCode, hint: count(roleCode) })),
          { value: UNASSESSED_ROLE_BUCKET, label: t("unassessed"), hint: count(UNASSESSED_ROLE_BUCKET) },
        ]}
      />
    </div>
  );
}
