"use client";

import { useEffect, useState } from "react";
import interviewService from "@/app/api/interviews/endpoints";
import type { InterviewConfig, PackageCoverage } from "@/app/api/interviews/types";
import { getCoverageColor } from "@/app/api/interviews/types";

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

function deriveRoleCoverage(
  configs: InterviewConfig[],
  roleCode: string
): PackageCoverage | null {
  const roleConfigs = configs.filter(c => c.role_code === roleCode);
  if (roleConfigs.length === 0) return null;
  return roleConfigs.some(c => c.evaluation_tier === 'FULL') ? 'Full' : 'Screening';
}

export function JobRoleTabs({ selectedRole, onRoleChange, roleCounts }: JobRoleTabsProps) {
  const [configs, setConfigs] = useState<InterviewConfig[]>([]);

  useEffect(() => {
    interviewService.getConfigs().then(setConfigs).catch(() => {});
  }, []);

  return (
    <div className="border-b border-gray-200 mb-6 overflow-x-auto">
      <nav className="flex gap-2 min-w-max pb-1">
        {JOB_ROLES.map(role => {
          const coverage = deriveRoleCoverage(configs, role.id);
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
              {coverage && (
                <span
                  className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${getCoverageColor(coverage)}`}
                >
                  {coverage}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
