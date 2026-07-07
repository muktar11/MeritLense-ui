export type EvaluationTier = 'FULL' | 'SCREENING' | 'BOTH';

export type PackageCoverage = 'Full' | 'Screening' | 'Partial';

export interface InterviewConfig {
  id: string;
  role_name: string;
  role_code: string;
  language: string;
  evaluation_tier: EvaluationTier;
  duration_minutes: number;
  total_questions: number;
  allow_retries: boolean;
  max_retries: number;
  enable_translation: boolean;
  enable_task_module: boolean;
  enable_integrity_checks: boolean;
  rubric_version: string;
  question_set_version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionData {
  candidate_id: string;
  config_id: string;
}

export interface InterviewSession {
  id: string;
  candidate: string;
  candidate_name: string;
  organization: string | null;
  config: string;
  config_details: InterviewConfig;
  status: string;
  role_name: string;
  role_code: string;
  evaluation_tier: EvaluationTier;
  ui_language: string;
  candidate_language: string;
  current_question_index: number;
  total_questions: number;
  progress_percent: number;
  access_token: string;
  started_at: string | null;
  ended_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface RolePackage {
  role_code: string;
  role_name: string;
  icon: string;
  configs: InterviewConfig[];
  coverage: PackageCoverage;
  available: boolean;
}

export const CANDIDATE_JOB_ROLES = [
  { code: 'HK', name: 'Housekeeper', icon: '🧹' },
  { code: 'EC', name: 'Elder Companion', icon: '👴' },
  { code: 'NA', name: 'Nursing Assistant', icon: '🏥' },
  { code: 'DR', name: 'Driver', icon: '🚗' },
  { code: 'KA', name: 'Kitchen Assistant', icon: '🍳' },
  { code: 'MW', name: 'Maintenance Worker', icon: '🔧' },
  { code: 'OT', name: 'Other', icon: '📋' },
];

export function getCoverageFromTier(tier: EvaluationTier): PackageCoverage {
  if (tier === 'FULL') return 'Full';
  return 'Screening';
}

export function getCoverageColor(coverage: PackageCoverage): string {
  switch (coverage) {
    case 'Full': return 'bg-green-100 text-green-700';
    case 'Partial': return 'bg-yellow-100 text-yellow-700';
    case 'Screening': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export function buildRolePackages(configs: InterviewConfig[]): RolePackage[] {
  return CANDIDATE_JOB_ROLES.map(role => {
    const roleConfigs = configs.filter(c => c.role_code === role.code);
    const hasFull = roleConfigs.some(c => c.evaluation_tier === 'FULL');
    const coverage: PackageCoverage = hasFull ? 'Full' : 'Screening';
    return {
      role_code: role.code,
      role_name: role.name,
      icon: role.icon,
      configs: roleConfigs,
      coverage,
      available: roleConfigs.length > 0,
    };
  });
}
