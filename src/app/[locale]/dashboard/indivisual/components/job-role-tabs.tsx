"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface JobRoleTabsProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
  roleCounts: Record<string, number>;
}

// These are Candidate.job_role categories (a short, 7-value broad
// classification - see api/candidates/models.py, max_length=2), a distinct,
// coarser taxonomy from the 21-role_code system used for interview
// configuration/scoring (api/interviews - domestic_worker, elderly_caregiver,
// etc.). There's no defined mapping from these broad categories to that
// granular system, so no "coverage" badge is shown here - a previous version
// tried to look one up via InterviewConfig.role_code using these same short
// codes, which never matched and always rendered wrong/missing coverage.
const JOB_ROLES = [
  { id: "HK", label: "Housekeepers", icon: "🧹" },
  { id: "EC", label: "Elder Companions", icon: "👴" },
  { id: "NA", label: "Nursing Assistants", icon: "🏥" },
  { id: "DR", label: "Drivers", icon: "🚗" },
  { id: "KA", label: "Kitchen Assistants", icon: "🍳" },
  { id: "MW", label: "Maintenance Workers", icon: "🔧" },
  { id: "OT", label: "Other", icon: "📋" },
];

export function JobRoleTabs({ selectedRole, onRoleChange, roleCounts }: JobRoleTabsProps) {
  return (
    <div className="mb-6">
      <Select value={selectedRole} onValueChange={onRoleChange}>
        <SelectTrigger className="w-full sm:w-72 bg-white">
          <SelectValue placeholder="Select a job role" />
        </SelectTrigger>
        <SelectContent>
          {JOB_ROLES.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              <span aria-hidden="true">{role.icon}</span>
              {role.label}
              {roleCounts[role.id] > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-gray-100 rounded-full text-gray-600">
                  {roleCounts[role.id]}
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
