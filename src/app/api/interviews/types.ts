export type EvaluationTier = 'FULL' | 'SCREENING' | 'BOTH';

export type PackageCoverage = 'Full' | 'Screening' | 'Partial';

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionType = 'safety' | 'integrity' | 'behavioral' | 'communication' | 'situational' | 'scenario' | 'knowledge';
export type QuestionFormat = 'TEXT' | 'SCENARIO' | 'TASK';
export type ExpectedAnswerType = 'short' | 'structured' | 'multi_step';
export type QuestionStatus = 'active' | 'draft' | 'deprecated' | 'archived';

export const QUESTION_DIFFICULTIES: { value: QuestionDifficulty; label: string }[] = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'safety', label: 'Safety' },
  { value: 'integrity', label: 'Integrity' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'communication', label: 'Communication' },
  { value: 'situational', label: 'Situational' },
  { value: 'scenario', label: 'Scenario' },
  { value: 'knowledge', label: 'Knowledge' },
];

export const QUESTION_FORMATS: { value: QuestionFormat; label: string }[] = [
  { value: 'TEXT', label: 'Text' },
  { value: 'SCENARIO', label: 'Scenario' },
  { value: 'TASK', label: 'Task' },
];

export const EXPECTED_ANSWER_TYPES: { value: ExpectedAnswerType; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'structured', label: 'Structured' },
  { value: 'multi_step', label: 'Multi Step' },
];

export const QUESTION_STATUSES: { value: QuestionStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'deprecated', label: 'Deprecated' },
  { value: 'archived', label: 'Archived' },
];

export const EVALUATION_TIERS: { value: EvaluationTier; label: string }[] = [
  { value: 'FULL', label: 'Full Evaluation' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'BOTH', label: 'Both' },
];

export interface QuestionTemplate {
  id: string;
  role_name: string;
  role_code: string;
  question_code: string;
  question_version: string;
  question_status: QuestionStatus;
  domain: string;
  skill_tag: string;
  skill_id: string;
  skill: string;
  sequence_number: number | null;
  difficulty: QuestionDifficulty;
  question_text: string;
  question_type: QuestionType;
  question_format: QuestionFormat;
  expected_steps: string[];
  keywords: string[];
  weight: string;
  language: string;
  scoring_type: string;
  difficulty_score: number;
  estimated_time_seconds: number;
  expected_answer_type: ExpectedAnswerType;
  evaluation_tier: EvaluationTier;
  rubric_version: string;
  question_set_version: string;
  is_mandatory: boolean;
  follow_up_allowed: boolean;
  critical_question: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionTemplatePayload {
  role_name: string;
  role_code: string;
  question_code?: string;
  question_version?: string;
  question_status: QuestionStatus;
  domain: string;
  skill_tag: string;
  skill: string;
  sequence_number?: number | null;
  difficulty: QuestionDifficulty;
  question_text: string;
  question_type: QuestionType;
  question_format: QuestionFormat;
  weight?: string;
  language: string;
  scoring_type?: string;
  estimated_time_seconds?: number;
  expected_answer_type: ExpectedAnswerType;
  evaluation_tier: EvaluationTier;
  rubric_version?: string;
  question_set_version?: string;
  is_mandatory: boolean;
  follow_up_allowed: boolean;
  critical_question: boolean;
  is_active: boolean;
}

export interface InterviewConfigPayload {
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
  rubric_version?: string;
  question_set_version?: string;
  is_active: boolean;
}

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
  linked_evaluation_id: string | null;
  latest_scoring_summary: unknown | null;
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
  // null = the employer's current package tier couldn't be resolved, so real
  // coverage for this role is unknown - never guess/default this to a value,
  // since that would misrepresent what the employer's plan actually covers.
  coverage: CoverageLevel | null;
  available: boolean;
}

// The role taxonomy itself now comes from the backend's role-coverage table
// (21 role_codes, matching MeritLense Package Architecture v1.2 Section 4) -
// see buildRolePackages. This icon map is display-only and falls back to a
// generic icon for any role_code not listed here.
export const ROLE_ICONS: Record<string, string> = {
  domestic_worker: '🧹',
  child_caregiver: '🧒',
  elderly_caregiver: '👴',
  special_needs_caregiver: '🤝',
  nursing_assistant: '🩺',
  home_care_assistant: '🏠',
  elderly_medical_support: '💊',
  basic_patient_support: '🏥',
  hotel_housekeeper: '🛏️',
  front_desk_agent: '🛎️',
  restaurant_staff: '🍽️',
  security_guard: '🛡️',
  event_security: '🎫',
  commercial_cleaner: '🧽',
  industrial_cleaner: '🏭',
  warehouse_staff: '📦',
  driver: '🚗',
  general_labor: '👷',
  skilled_trades: '🔧',
  farm_worker: '🌾',
  livestock_support: '🐄',
};

// The 21 role_codes seeded across the platform (matches ROLE_NAMES in
// api/interviews/management/commands/seed_package_architecture.py) - used by
// admin tooling (interview configs, question templates, scoring rule sets)
// that needs a synchronous role picker not tied to a specific employer's
// package/coverage data. Previously a stale 7-role legacy list (HK/EC/NA/DR/
// KA/MW/OT) that didn't match any real role_code in the database, which
// silently broke role selection for every role except the one stray config
// that had been created against it.
export const CANDIDATE_JOB_ROLES: { code: string; name: string; icon: string }[] = [
  { code: 'domestic_worker', name: 'Domestic Worker (Housekeeper)', icon: ROLE_ICONS.domestic_worker },
  { code: 'child_caregiver', name: 'Child Caregiver', icon: ROLE_ICONS.child_caregiver },
  { code: 'elderly_caregiver', name: 'Elderly Caregiver', icon: ROLE_ICONS.elderly_caregiver },
  { code: 'special_needs_caregiver', name: 'Special Needs Caregiver', icon: ROLE_ICONS.special_needs_caregiver },
  { code: 'nursing_assistant', name: 'Nursing Assistant', icon: ROLE_ICONS.nursing_assistant },
  { code: 'home_care_assistant', name: 'Home Care Assistant', icon: ROLE_ICONS.home_care_assistant },
  { code: 'elderly_medical_support', name: 'Elderly Medical Support', icon: ROLE_ICONS.elderly_medical_support },
  { code: 'basic_patient_support', name: 'Basic Patient Support', icon: ROLE_ICONS.basic_patient_support },
  { code: 'hotel_housekeeper', name: 'Hotel Housekeeper', icon: ROLE_ICONS.hotel_housekeeper },
  { code: 'front_desk_agent', name: 'Front Desk & Guest Service', icon: ROLE_ICONS.front_desk_agent },
  { code: 'restaurant_staff', name: 'Restaurant Staff', icon: ROLE_ICONS.restaurant_staff },
  { code: 'security_guard', name: 'Security Guard', icon: ROLE_ICONS.security_guard },
  { code: 'event_security', name: 'Event Security', icon: ROLE_ICONS.event_security },
  { code: 'commercial_cleaner', name: 'Commercial Cleaner', icon: ROLE_ICONS.commercial_cleaner },
  { code: 'industrial_cleaner', name: 'Industrial Cleaner', icon: ROLE_ICONS.industrial_cleaner },
  { code: 'warehouse_staff', name: 'Warehouse Staff', icon: ROLE_ICONS.warehouse_staff },
  { code: 'driver', name: 'Driver', icon: ROLE_ICONS.driver },
  { code: 'general_labor', name: 'General Labor', icon: ROLE_ICONS.general_labor },
  { code: 'skilled_trades', name: 'Skilled Trades & Maintenance', icon: ROLE_ICONS.skilled_trades },
  { code: 'farm_worker', name: 'Farm Worker', icon: ROLE_ICONS.farm_worker },
  { code: 'livestock_support', name: 'Livestock Support', icon: ROLE_ICONS.livestock_support },
];

export function getCoverageFromTier(tier: EvaluationTier): PackageCoverage {
  if (tier === 'FULL') return 'Full';
  return 'Screening';
}

export function getCoverageColor(coverage: CoverageLevel | null): string {
  switch (coverage) {
    case 'FULL': return 'bg-green-100 text-green-700';
    case 'PARTIAL': return 'bg-yellow-100 text-yellow-700';
    case 'SCREENING': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-500';
  }
}

export function getCoverageLabel(coverage: CoverageLevel | null): string {
  switch (coverage) {
    case 'FULL': return 'Full';
    case 'PARTIAL': return 'Partial';
    case 'SCREENING': return 'Screening';
    default: return 'Unknown';
  }
}

// Builds the role list from the real role-coverage table (the authoritative
// 21-role taxonomy) rather than a hardcoded/legacy list, and cross-references
// InterviewConfiguration rows (`configs`) to find what's actually bookable
// for each role. `coverageRows` should already be filtered to the relevant
// audience (B2B/B2C); `packageCode` is the employer's current package_code -
// pass null when it can't be resolved, which yields `coverage: null` per role
// rather than a fabricated guess.
export function buildRolePackages(
  configs: InterviewConfig[],
  coverageRows: RolePackageCoverageEntry[],
  packageCode: string | null
): RolePackage[] {
  const roleNames = new Map<string, string>();
  for (const row of coverageRows) {
    if (!roleNames.has(row.role_code)) roleNames.set(row.role_code, row.role_name);
  }

  return Array.from(roleNames.entries())
    .map(([roleCode, roleName]) => {
      const roleConfigs = configs.filter(c => c.role_code === roleCode);
      const coverageRow = packageCode
        ? coverageRows.find(r => r.role_code === roleCode && r.package_code === packageCode)
        : undefined;
      return {
        role_code: roleCode,
        role_name: roleName,
        icon: ROLE_ICONS[roleCode] ?? '📋',
        configs: roleConfigs,
        coverage: coverageRow ? coverageRow.coverage_level : null,
        available: roleConfigs.length > 0,
      };
    })
    .sort((a, b) => a.role_name.localeCompare(b.role_name));
}

// Given a role and the employer's audience, finds the cheapest package
// (in PACKAGE_ORDER) that would grant Full coverage for that role - used to
// power a concrete "Upgrade to X" recommendation rather than a generic prompt.
export function recommendPackageForFullCoverage(
  roleCode: string,
  coverageRows: RolePackageCoverageEntry[],
  packageOrder: string[]
): RolePackageCoverageEntry | null {
  for (const packageCode of packageOrder) {
    const row = coverageRows.find(r => r.role_code === roleCode && r.package_code === packageCode);
    if (row && row.coverage_level === 'FULL') return row;
  }
  return null;
}

export type CoverageLevel = 'SCREENING' | 'PARTIAL' | 'FULL';

export interface RolePackageCoverageEntry {
  id: string;
  role_name: string;
  role_code: string;
  package_code: string;
  package_name: string;
  audience: 'B2B' | 'B2C';
  coverage_level: CoverageLevel;
  evaluation_tier: EvaluationTier;
  readiness_indicator_enabled: boolean;
  certificate_enabled: boolean;
  video_introduction_enabled: boolean;
  behavioral_indicators_enabled: boolean;
  is_active: boolean;
}

export interface PackageSessionConfigEntry {
  id: string;
  package_code: string;
  package_name: string;
  audience: 'B2B' | 'B2C';
  evaluation_tier: EvaluationTier;
  min_questions: number;
  max_questions: number;
  default_question_count: number;
  duration_minutes: number;
  task_observation_enabled: boolean;
  readiness_indicator_enabled: boolean;
  certificate_enabled: boolean;
  basic_report_enabled: boolean;
  analytics_enabled: boolean;
  api_access_enabled: boolean;
  video_introduction_enabled: boolean;
  behavioral_indicators_enabled: boolean;
  points_balance: number | null;
  monthly_fee_display: string;
  is_active: boolean;
}

// Package tiers ordered cheapest -> most capable, per audience - matches
// PACKAGE_ORDER in api/interviews/management/commands/seed_package_architecture.py.
export const PACKAGE_ORDER_B2B = ['starter', 'growth', 'business', 'enterprise'];
export const PACKAGE_ORDER_B2C = ['basic', 'essential', 'advanced', 'premium'];
