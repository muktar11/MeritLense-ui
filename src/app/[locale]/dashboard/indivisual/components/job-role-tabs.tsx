"use client";

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
    <div className="border-b border-gray-200 mb-6 overflow-x-auto">
      <nav className="flex gap-2 min-w-max pb-1">
        {JOB_ROLES.map(role => {
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => onRoleChange(role.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                isSelected
                  ? "bg-purple-50 text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span aria-hidden="true">{role.icon}</span>
              {role.label}
              {roleCounts[role.id] > 0 && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {roleCounts[role.id]}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
