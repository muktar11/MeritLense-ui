// app/api/admin/audit/types.ts
export interface AuditLogEntry {
  id: number;
  user: number | null;
  user_email: string;
  user_name: string;
  user_role: string;
  company: number | null;
  action: string;
  action_display: string;
  category: string;
  category_display: string;
  severity: string;
  severity_display: string;
  resource_type: string | null;
  resource_id: number | null;
  resource_name: string;
  resource_type_name: string;
  description: string;
  data: Record<string, any>;
  ip_address: string | null;
  user_agent: string;
  request_method: string;
  request_path: string;
  created_at: string;
}

export interface AuditLogSummary {
  total_logs: number;
  by_category: Array<{
    category: string;
    category_display: string;
    count: number;
  }>;
  by_severity: Array<{
    severity: string;
    severity_display: string;
    count: number;
  }>;
  daily_activity: Array<{
    date: string;
    count: number;
  }>;
}

export interface AuditLogFilter {
  user_id?: number;
  company_id?: number;
  category?: string;
  action?: string;
  severity?: string;
  resource_type?: string;
  resource_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PendingVerificationUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'B2C' | 'B2B';
  created_at: string;
  documents_verification_status: string;
  documents: {
    id_document?: string | null;
    resume_document?: string | null;
    registration_certificate?: string | null;
    resachetified_license?: string | null;
    tax_id_document?: string | null;
  };
  profile_details: any;
}

export interface PendingVerificationResponse {
  count: number;
  results: PendingVerificationUser[];
}

export interface DocumentVerificationRequest {
  user_id: number;
  status: 'APPROVED' | 'REJECTED';
  verification_notes?: string;
  rejection_reason?: string;
}

export const SEVERITY_COLORS: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-800',
  WARNING: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-purple-100 text-purple-800'
};

export const CATEGORY_COLORS: Record<string, string> = {
  USER: 'bg-green-100 text-green-800',
  CANDIDATE: 'bg-purple-100 text-purple-800',
  EVALUATION: 'bg-blue-100 text-blue-800',
  DOCUMENT: 'bg-orange-100 text-orange-800',
  PAYMENT: 'bg-emerald-100 text-emerald-800',
  SYSTEM: 'bg-gray-100 text-gray-800',
  SECURITY: 'bg-red-100 text-red-800'
};