// app/api/admin/packages/types.ts

export type BillingType = 'RECURRING' | 'ONE_TIME';
export type EvaluationTier = 'FULL' | 'SCREENING' | 'BOTH';
export type TargetUserType = 'B2C' | 'B2B' | 'BOTH';
export type BillingInterval = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';

export interface PackageFeatureLimits {
  candidate_limit?: number;
  evaluation_limit?: number;
  team_member_limit?: number;
  points_granted?: number;
  question_count_min?: number;
  question_count_max?: number;
  session_duration_min_minutes?: number;
  session_duration_max_minutes?: number;
  [key: string]: number | undefined;
}

export interface PackageFeatures {
  output_report_level?: 'summary' | 'standard' | 'detailed';
  add_ons?: string[];
  [key: string]: unknown;
}

export interface Package {
  id: string;
  name: string;
  stripe_price_id: string;
  stripe_product_id: string;
  target_user_type: TargetUserType;
  min_company_size: CompanySize | null;
  max_company_size: CompanySize | null;
  unit_amount: string;
  currency: string;
  formatted_price: string;
  billing_type: BillingType;
  interval: BillingInterval;
  interval_count: number;
  evaluation_tier: EvaluationTier | null;
  task_observation_enabled: boolean;
  features: PackageFeatures;
  feature_limits: PackageFeatureLimits;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PackagePayload {
  name: string;
  target_user_type: TargetUserType;
  min_company_size?: CompanySize | null;
  max_company_size?: CompanySize | null;
  unit_amount: string | number;
  currency: string;
  billing_type: BillingType;
  interval?: BillingInterval;
  interval_count?: number;
  evaluation_tier?: EvaluationTier | null;
  task_observation_enabled?: boolean;
  features?: PackageFeatures;
  feature_limits?: PackageFeatureLimits;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
