import { Candidate } from '../candidates/types';
import type { EvaluationTier } from '../interviews/types';

export const EVALUATION_TYPES = [
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'TECHNICAL_TEST', label: 'Technical Test' },
  { value: 'ASSESSMENT', label: 'Assessment' },
  { value: 'LANGUAGE_PROFICIENCY', label: 'Language Proficiency' },
] as const;

export const EVALUATION_STATUS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const CERTIFICATE_STATUS = [
  { value: 'NOT_ISSUED', label: 'Not Issued' },
  { value: "PENDING", label: "Pending" },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'EXPIRED', label: 'Expired' },
] as const;

export type EvaluationType = typeof EVALUATION_TYPES[number]['value'];
export type EvaluationStatus = typeof EVALUATION_STATUS[number]['value'];
export type CertificateStatus = typeof CERTIFICATE_STATUS[number]['value'];

export interface Evaluation {
  id: string;
  candidate: string;
  candidate_details?: Candidate;
  
  candidate_first_name: string;
  candidate_last_name: string;
  candidate_email: string;
  candidate_passport_id: string;
  candidate_job_role: string;
  candidate_preferred_language: string;
  
  evaluation_type: EvaluationType;
  evaluation_type_display: string;
  status: EvaluationStatus;
  status_display: string;
  scheduled_date: string;
  duration_minutes: number;
  
  certificate_status: CertificateStatus;
  certificate_status_display: string;
  certificate_issued_at?: string;
  certificate_url?: string;
  
  last_evaluation_date?: string;
  score?: number;
  feedback?: string;
  
  meeting_link?: string;
  meeting_id?: string;
  meeting_password?: string;
  location?: string;
  
  created_by: string;
  created_by_name: string;
  company?: string;
  
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CreateEvaluationData {
  candidate: string;
  evaluation_type: EvaluationType;
  scheduled_date: string;
  duration_minutes: number;
  meeting_link?: string;
  meeting_id?: string;
  meeting_password?: string;
  location?: string;
}

export interface UpdateEvaluationData {
  evaluation_type?: EvaluationType;
  scheduled_date?: string;
  duration_minutes?: number;
  meeting_link?: string;
  meeting_id?: string;
  meeting_password?: string;
  location?: string;
}

export interface CompleteEvaluationData {
  score?: number;
  feedback?: string;
  certificate_status?: CertificateStatus;
  certificate_url?: string;
}

export interface RescheduleEvaluationData {
  new_date: string;
  reason?: string;
}

export interface CancelEvaluationData {
  reason?: string;
}

export type CompetencyStatus = 'NOT_STARTED' | 'INCOMPLETE' | 'EVALUATED' | 'BELOW_THRESHOLD' | 'MEETS_THRESHOLD';

export type SessionEvaluationStatus =
  | 'PENDING'
  | 'PARTIALLY_EVALUATED'
  | 'EVALUATED'
  | 'EVALUATION_FAILED'
  | 'REQUIRES_HUMAN_REVIEW';

export interface CompetencySummary {
  competency_code: string;
  competency_name: string;
  percentage: number;
  status: CompetencyStatus;
  response_count: number;
  completed_response_count: number;
}

export interface CriticalFailure {
  response_id: string;
  question_id: string;
  competency_code: string;
  explanation: string;
}

export interface BelowThresholdCompetency {
  competency_code: string;
  competency_name: string;
  percentage: number;
  pass_threshold: number;
}

export interface SessionEvaluationSummary {
  id: string;
  total_score: string;
  max_score: string;
  overall_percentage: string;
  evaluated_response_count: number;
  total_response_count: number;
  incomplete_response_count: number;
  competencies_summary: CompetencySummary[];
  critical_failures: CriticalFailure[];
  below_threshold_competencies: BelowThresholdCompetency[];
  status: SessionEvaluationStatus;
  rule_set_version: string;
  generated_at: string;
}

export interface ResponseEvaluationResult {
  id: string;
  response_id: string;
  question_id: string;
  competency_code: string;
  competency_name: string;
  score: string;
  max_score: string;
  percentage: string;
  passed_required_indicators: boolean;
  critical_failure: boolean;
  requires_human_review: boolean;
  observed_indicators: string[];
  matched_indicators: string[];
  missing_indicators: string[];
  risk_flags: string[];
  explanation: string;
  rule_set_version: string;
}

export interface CompetencyEvaluationResult {
  id: string;
  competency_code: string;
  competency_name: string;
  total_score: string;
  max_score: string;
  percentage: string;
  pass_threshold: string;
  status: CompetencyStatus;
  response_count: number;
  completed_response_count: number;
  incomplete_response_count: number;
  rule_set_version: string;
}

export type ScoringMethod =
  | 'ALL_OR_NOTHING'
  | 'WEIGHTED_INDICATOR_MATCH'
  | 'REQUIRED_INDICATOR_GATE'
  | 'CRITICAL_FAILURE_OVERRIDE';

export const SCORING_METHODS: { value: ScoringMethod; label: string }[] = [
  { value: 'WEIGHTED_INDICATOR_MATCH', label: 'Weighted Indicator Match' },
  { value: 'ALL_OR_NOTHING', label: 'All Or Nothing' },
  { value: 'REQUIRED_INDICATOR_GATE', label: 'Required Indicator Gate' },
  { value: 'CRITICAL_FAILURE_OVERRIDE', label: 'Critical Failure Override' },
];

export interface ScoringRule {
  id: string;
  rule_set: string;
  competency_code: string;
  competency_name: string;
  question_template: string | null;
  question_code: string;
  question_type: string;
  expected_indicators: string[];
  required_indicators: string[];
  weighted_indicators: Record<string, string>;
  critical_failure_indicators: string[];
  risk_flags: string[];
  max_score: string;
  pass_threshold: string;
  weight: string;
  scoring_method: ScoringMethod;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScoringRulePayload {
  rule_set?: string;
  competency_code: string;
  competency_name?: string;
  question_template?: string | null;
  question_code?: string;
  question_type?: string;
  expected_indicators: string[];
  required_indicators: string[];
  weighted_indicators: Record<string, number>;
  critical_failure_indicators: string[];
  risk_flags: string[];
  max_score: string;
  pass_threshold: string;
  weight?: string;
  scoring_method: ScoringMethod;
  is_active: boolean;
}

export interface ScoringRuleSet {
  id: string;
  name: string;
  version: string;
  description: string;
  role_code: string;
  role_name: string;
  evaluation_tier: EvaluationTier;
  is_active: boolean;
  has_usage: boolean;
  created_by: string | null;
  rules: ScoringRule[];
  created_at: string;
  updated_at: string;
}

export interface ScoringRuleSetPayload {
  name: string;
  version: string;
  description?: string;
  role_code: string;
  role_name: string;
  evaluation_tier: EvaluationTier;
  is_active: boolean;
  rules: ScoringRulePayload[];
}

export interface EvaluationListItem {
  id: string;
  candidate_name: string;
  evaluation_type: EvaluationType;
  evaluation_type_display: string;
  status: EvaluationStatus;
  status_display: string;
  scheduled_date: string;
  duration_minutes: number;
  score?: number;
  created_by: string;
  created_at: string;
}