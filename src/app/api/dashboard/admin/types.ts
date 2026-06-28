export interface AdminDashboardStats {
  active_candidates: number;
  total_users: number;
  b2c_users: number;
  b2b_users: number;
  active_agencies: number;
  total_evaluations: number;
  completed_evaluations: number;
  total_revenue: number;
  monthly_recurring_revenue: number;
  active_subscriptions_count: number;
  average_success_rate: number;
}

export interface SystemLoadData {
  date: string;
  evaluations_created: number;
  evaluations_completed: number;
  candidates_created: number;
  users_registered: number;
  companies_registered: number;
}

export interface UserGrowthData {
  month: string;
  b2c_users: number;
  b2b_users: number;
  team_members: number;
  total_users: number;
}

export interface EvaluationTypeDistribution {
  type: string;
  type_display: string;
  count: number;
  percentage: number;
}

export interface PackageContribution {
  package_name: string;
  subscriber_count: number;
  subscriber_percentage: number;
  revenue: number;
  revenue_percentage: number;
  target_user_type: string;
}

export interface EvaluationStatusDistribution {
  status: string;
  status_display: string;
  count: number;
  percentage: number;
}

export interface UserTypeDistribution {
  role: string;
  role_display: string;
  count: number;
  percentage: number;
}

export interface RevenueTrendData {
  month: string;
  payment_revenue: number;
  subscription_revenue: number;
  total_revenue: number;
  cumulative_revenue: number;
  new_subscriptions: number;
  payment_count: number;
}

export interface TopPerformingCandidate {
  candidate_id: number;
  candidate_name: string;
  email: string;
  job_role: string;
  average_score: number;
  evaluation_count: number;
  company_name: string | null;
}

export interface RecentActivity {
  type: 'new_user' | 'new_company' | 'evaluation_completed' | 'new_subscription';
  description: string;
  user?: string;
  user_email?: string;
  company?: string;
  candidate?: string;
  score?: number;
  plan?: string;
  timestamp: string;
  icon: 'user' | 'building' | 'check-circle' | 'credit-card';
}

export interface GeographicDistribution {
  country: string;
  count: number;
}