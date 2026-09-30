// app/api/payments/package-requests/types.ts

export type PackageRequestDealType = 'STARTER' | 'ENTERPRISE';
export type PackageRequestStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'DENIED';
export type PackageRequestBillingType = 'ONE_TIME' | 'RECURRING';

export interface PackageRequest {
  id: string;
  company: string;
  company_name: string;
  requested_by: string;
  requested_by_name: string;
  requested_by_email: string;
  deal_type: PackageRequestDealType;
  deal_type_display: string;
  requested_slot_grant: number | null;
  requested_points_grant: number | null;
  message: string;
  status: PackageRequestStatus;
  status_display: string;
  decision_reason: string;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  billing_type: PackageRequestBillingType | '';
  approved_slot_grant: number | null;
  approved_points_grant: number | null;
  unit_amount: string | number | null;
  currency: string;
  stripe_payment_link_url: string;
  paid_at: string | null;
  deal_record_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface PackageRequestCreatePayload {
  deal_type: PackageRequestDealType;
  requested_slot_grant?: number | null;
  requested_points_grant?: number | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
