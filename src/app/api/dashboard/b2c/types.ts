// app/api/dashboard/b2c/types.ts
export interface DashboardStats {
  total_candidates: number;
  total_evaluations: number;
  completed_evaluations: number;
  certificates_issued: number;
  success_rate: number;
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

export interface CandidateComparison {
  candidate_id: number;
  candidate_name: string;
  job_role: string;
  average_score: number;
  scores_by_area: Record<string, number>;
}

export interface EvaluationTimeRange {
  range: string;
  count: number;
}

export interface EvaluationStatusDistribution {
  status: string;
  status_display: string;
  count: number;
  percentage: number;
}

export interface JobRoleDistribution {
  job_role: string;
  job_role_display: string;
  count: number;
  percentage: number;
}

export interface ScoreTrend {
  date: string;
  avg_score: number;
}