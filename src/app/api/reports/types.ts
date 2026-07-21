export type ReportStatus = 'PENDING' | 'GENERATED' | 'STALE' | 'ARCHIVED' | 'FAILED';

// The backend rule engine emits readiness_indicator in Arabic regardless of
// UI locale (it's the legal record's own fixed vocabulary) — map to an
// English label for display without altering the underlying value.
const READINESS_INDICATOR_LABELS: Record<string, string> = {
  'جاهز': 'Ready',
  'غير جاهز': 'Not Ready',
  'متوسط': 'Medium',
};

export function readinessIndicatorLabel(indicator: string): string {
  return READINESS_INDICATOR_LABELS[indicator] ?? indicator;
}

export interface HumanReviewFlag {
  flag_type: string;
  severity: 'low' | 'medium' | 'high' | string;
  source: string;
  candidate_response_id: string;
  message: string;
  requires_review: boolean;
}

export interface ReportCriticalFailure {
  response_id: string;
  question_id: string;
  question_code: string;
  competency_code: string;
  topic: string;
  explanation: string;
}

export interface ReportCompetencyBreakdownItem {
  competency_code: string;
  competency_name: string;
  score: number;
  max_score: number;
  percentage: number;
  status: string;
  response_count: number;
  completed_response_count: number;
  incomplete_response_count: number;
  pass_threshold: number;
  explanation: string;
}

export interface ReportResponseEvidenceItem {
  question_id: string;
  candidate_response_id: string;
  question_order: number;
  competency_code: string;
  competency_name: string;
  question_text: string;
  score: number;
  max_score: number;
  percentage: number;
  observed_indicators: string[];
  matched_indicators: string[];
  missing_indicators: string[];
  required_indicators_passed: boolean;
  critical_failure: boolean;
  requires_human_review: boolean;
  explanation: string;
  rule_set_version: string;
  traceability: Record<string, unknown>;
}

export interface ReportPayload {
  report_header: {
    report_number: string;
    report_version: string;
    generated_at: string;
  };
  candidate_summary: {
    candidate_id: string;
    candidate_name: string;
    job_role: string;
    preferred_language: string;
  };
  interview_summary: Record<string, unknown>;
  overall_result: {
    total_score: number;
    max_score: number;
    overall_percentage: number;
    readiness_status: string;
    readiness_indicator: string;
    readiness_reason: string;
    override_triggered: boolean;
    requires_human_review: boolean;
  };
  competency_breakdown: ReportCompetencyBreakdownItem[];
  response_evidence_summary: ReportResponseEvidenceItem[];
  human_review_flags: HumanReviewFlag[];
  traceability: {
    scoring_rule_set_name: string;
    scoring_rule_version: string;
    rule_engine_version: string;
    override_triggered: boolean;
    readiness_indicator: string;
    readiness_reason: string;
    readiness_legal_record_id: string | null;
    audit_reference_type: string;
    evaluation_flow_reference: string;
  };
  legal_disclaimer: string;
  technical_metadata: Record<string, unknown>;
}

export interface EvaluationReport {
  id: string;
  evaluation_id: string;
  session_id: string;
  candidate_id: string;
  report_number: string;
  report_version: string;
  report_status: ReportStatus;
  overall_score: string;
  max_score: string;
  overall_percentage: string;
  readiness_status: string;
  readiness_indicator: string;
  readiness_reason: string;
  override_triggered: boolean;
  rule_engine_version: string;
  requires_human_review: boolean;
  scoring_rule_set_name: string;
  scoring_rule_version: string;
  report_payload: ReportPayload;
  competency_breakdown: ReportCompetencyBreakdownItem[];
  response_evidence_summary: ReportResponseEvidenceItem[];
  human_review_flags: HumanReviewFlag[];
  critical_failures: ReportCriticalFailure[];
  generated_by: string | null;
  generated_by_name: string;
  generated_at: string;
  last_regenerated_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
