"use client";

interface JobRoleTabsProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
  roleCounts: Record<string, number>;
}

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
        {JOB_ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => onRoleChange(role.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              selectedRole === role.id
                ? "bg-purple-50 text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="mr-2">{role.icon}</span>
            {role.label}
            {roleCounts[role.id] > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                {roleCounts[role.id]}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}