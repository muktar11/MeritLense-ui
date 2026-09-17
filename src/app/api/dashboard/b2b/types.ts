export interface DashboardStats {
  total_candidates: number;
  total_evaluations: number;
  completed_evaluations: number;
  completed_ai_interviews: number;
  completed_scheduled_assessments: number;
  certificates_issued: number;
  success_rate: number;
  team_members_count: number;
  remaining_slots: number | null;
  slot_limit: number | null;
  slots_unlimited: boolean;
  reserved_slots: number | null;
  consumed_slots: number | null;
  pending_sessions: number | null;
  remaining_points: number | null;
  points_limit: number | null;
  points_unlimited: boolean;
}

export interface RecentCandidate {
  id: number;
  full_name: string;
  email: string;
  job_role: string;
  status: string;
  evaluation_count: number;
  last_evaluation_date: string | null;
  created_at: string;
}

export interface RecentEvaluation {
  id: number;
  candidate_name: string;
  evaluation_type: string;
  evaluation_type_display: string;
  status: string;
  status_display: string;
  scheduled_date: string;
  score: number | null;
  created_at: string;
}

export interface ScoreDistribution {
  job_role: string;
  job_role_display: string;
  average_score: number;
  min_score: number;
  max_score: number;
  evaluation_count: number;
}

export interface EvaluationTrend {
  date: string;
  scheduled_count: number;
  completed_count: number;
  cancelled_count: number;
}

export interface LanguageDistribution {
  language: string;
  language_display: string;
  count: number;
  percentage: number;
}

export interface PerformanceMetric {
  period: string;
  average_score: number;
  evaluation_count: number;
  pass_rate: number;
}

export interface EvaluationStatusDistribution {
  status: string;
  status_display: string;
  count: number;
  percentage: number;
}

export interface MonthlyActivity {
  month: string;
  candidates_added: number;
  evaluations_completed: number;
  certificates_issued: number;
}

export interface CandidateComparison {
  candidate_id: string;
  candidate_name: string;
  job_role: string;
  average_score: number;
  scores_by_area: Record<string, number>;
}

export interface JobRoleDistribution {
  job_role: string;
  job_role_display: string;
  count: number;
  percentage: number;
}

export interface EvaluationTimeRange {
  range: string;
  count: number;
}