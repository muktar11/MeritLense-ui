// app/api/admin/billing/types.ts
// app/api/admin/billing/types.ts
export interface AdminSubscription {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  company: number | null;
  customer: number;
  stripe_subscription_id: string;
  stripe_price: number;
  price_details: {
    id: number;
    name: string;
    stripe_price_id: string;
    stripe_product_id: string;
    target_user_type: string;
    target_user_type_display: string;
    min_company_size: string | null;
    max_company_size: string | null;
    unit_amount: string;
    currency: string;
    formatted_price: string;
    billing_type: 'RECURRING' | 'ONE_TIME';
    interval: string;
    interval_count: number;
    evaluation_tier?: 'FULL' | 'SCREENING' | 'BOTH' | null;
    task_observation_enabled: boolean;
    features: Record<string, any>;
    feature_limits: Record<string, number>;
    is_active: boolean;
    metadata: Record<string, any>;
    created_at: string;
  };
  status: string;
  current_period_start: string;
  current_period_end: string;
  trial_start: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  quantity: number;
  is_active_subscription: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AdminSubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  monthly_revenue: number;
  by_plan: Record<string, number>;
  recent_expiring: number;
}

export interface PlanDistribution {
  plan_name: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
}