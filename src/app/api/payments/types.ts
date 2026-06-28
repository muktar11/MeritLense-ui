
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;

export const PAYMENT_METHOD_TYPES = {
  CARD: 'CARD',
  PAYPAL: 'PAYPAL',
  BANK_TRANSFER: 'BANK_TRANSFER',
} as const;

export const SUBSCRIPTION_STATUS = {
  INCOMPLETE: 'INCOMPLETE',
  INCOMPLETE_EXPIRED: 'INCOMPLETE_EXPIRED',
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
  UNPAID: 'UNPAID',
} as const;

export const BILLING_INTERVAL = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY',
} as const;

export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  PAID: 'PAID',
  UNCOLLECTIBLE: 'UNCOLLECTIBLE',
  VOID: 'VOID',
} as const;

export const COMPANY_SIZE = {
  SIZE_1_10: '1-10',
  SIZE_11_50: '11-50',
  SIZE_51_200: '51-200',
  SIZE_201_1000: '201-1000',
  SIZE_1000_PLUS: '1000+',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
export type PaymentMethodType = typeof PAYMENT_METHOD_TYPES[keyof typeof PAYMENT_METHOD_TYPES];
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];
export type BillingInterval = typeof BILLING_INTERVAL[keyof typeof BILLING_INTERVAL];
export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];
export type CompanySize = typeof COMPANY_SIZE[keyof typeof COMPANY_SIZE];

export interface Price {
  id: number;
  name: string;
  stripe_price_id: string;
  stripe_product_id: string;
  target_user_type: 'B2C' | 'B2B' | 'BOTH';
  target_user_type_display: string;
  min_company_size?: CompanySize;
  max_company_size?: CompanySize;
  unit_amount: number;
  currency: string;
  formatted_price: string;
  interval: BillingInterval;
  interval_count: number;
  features: Record<string, any>;
  feature_limits: {
    candidate_limit?: number;
    evaluation_limit?: number;
    team_member_limit?: number;
    [key: string]: number | undefined;
  };
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Customer {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  stripe_customer_id: string;
  email: string;
  name: string;
  phone: string;
  default_payment_method_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: number;
  customer: number;
  stripe_payment_method_id: string;
  method_type: PaymentMethodType;
  display_name: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  is_active: boolean;
  billing_details: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  company?: number;
  company_name?: string;
  customer: number;
  stripe_subscription_id: string;
  stripe_price: {
    id: number;
    name: string;
    unit_amount: number;
    currency: string;
    interval: BillingInterval;
    interval_count: number;
  };
  price_details?: Price;
  status: SubscriptionStatus;
  status_display: string;
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  canceled_at?: string;
  quantity: number;
  cancel_at_period_end: boolean;
  default_payment_method?: number;
  payment_method?: string;
  latest_invoice?: number;
  current_usage: {
    candidates?: number;
    evaluations?: number;
    team_members?: number;
    [key: string]: number | undefined;
  };
  usage_percentages: Record<string, {
    used: number;
    limit: number;
    percentage: number;
  }>;
  days_remaining: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  check_usage_limit?: (feature: string, increment: number) => boolean;

}

export interface SubscriptionListItem {
  id: number;
  plan_name: string;
  status: SubscriptionStatus;
  status_display: string;
  amount: number;
  currency: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  quantity: number;
}

export interface Payment {
  id: number;
  user: number;
  user_email: string;
  company?: number;
  customer: number;
  subscription?: number;
  stripe_payment_intent_id: string;
  stripe_payment_method?: number;
  payment_method_display?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method_type: PaymentMethodType;
  receipt_url: string;
  receipt_number: string;
  paid_at?: string;
  refunded_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  user: number;
  user_email: string;
  customer: number;
  subscription?: number;
  stripe_invoice_id: string;
  stripe_payment_intent?: number;
  number: string;
  status: InvoiceStatus;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  due_date?: string;
  paid_at?: string;
  voided_at?: string;
  invoice_pdf: string;
  hosted_invoice_url: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentIntentRequest {
  price_id?: number;
  amount?: number;
  currency?: string;
  payment_method_id?: string;
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  payment: Payment;
}

export interface CreateSetupIntentResponse {
  client_secret: string;
  setup_intent_id: string;
}

export interface AttachPaymentMethodRequest {
  payment_method_id: string;
  set_default: boolean;
}

export interface CreateSubscriptionRequest {
  price_id: number;
  payment_method_id?: string;
  trial_period_days?: number;
  quantity?: number;
}

export interface ChangePlanRequest {
  price_id: number;
  prorate?: boolean;
}

export interface UpdateQuantityRequest {
  quantity: number;
}

export interface CancelSubscriptionRequest {
  at_period_end?: boolean;
  cancellation_reason?: string;
}

export interface UpcomingInvoiceResponse {
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  next_payment_attempt: number;
  lines: Array<{
    description: string;
    amount: number;
    period: {
      start: number;
      end: number;
    };
  }>;
}

export interface UsageResponse {
  current_usage: Record<string, number>;
  usage_percentages: Record<string, {
    used: number;
    limit: number;
    percentage: number;
  }>;
  limits: Record<string, number>;
}