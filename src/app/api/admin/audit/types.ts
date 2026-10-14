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
  // The candidate this entry belongs to, for opening its activity trail.
  trail_candidate_id: string | null;
}

export interface TrailOrigin {
  at: string;
  by_email: string;
  by_name: string;
  ip_address: string | null;
  user_agent: string;
}

// GET audit/logs/trail - who registered a candidate, who created each
// assessment and from where, and the IPs the candidate used.
export interface CandidateTrail {
  candidate: {
    id: string;
    name: string;
    passport_id: string;
    email: string;
    status: string;
    created_at: string;
    owner_email: string | null;
    owner_name: string | null;
    company: string | null;
  };
  // null: not added through the app (no registration record).
  registration: TrailOrigin | null;
  assessments: Array<{
    session_id: string;
    evaluation_id: string | null;
    role_code: string;
    evaluation_tier: string;
    status: string;
    created_at: string;
    created_by_email: string | null;
    created_origin: TrailOrigin | null;
    started_at: string | null;
    ended_at: string | null;
    candidate_ips: string[];
  }>;
  event_count: number;
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
  ip_address?: string;
  candidate_id?: string;
  page?: number;
  page_size?: number;
}

// GET audit/logs/ip-activity - the admin IP tracer.
export interface IpTraceAccountIp {
  ip_address: string;
  first_seen: string;
  last_seen: string;
  events: number;
  logins: number;
  failed_logins: number;
  user_agents: string[];
  other_accounts: number;
}

export interface IpTraceCandidateIp {
  ip_address: string;
  first_seen: string;
  last_seen: string;
  events: number;
  sessions: number;
}

export interface IpTraceIpAccount {
  user_id: string;
  email: string;
  name: string;
  role: string;
  first_seen: string;
  last_seen: string;
  events: number;
  logins: number;
  failed_logins: number;
}

export type IpTraceResult =
  | {
      mode: 'account';
      days: number;
      account: { user_id: string; email: string; name: string; role: string };
      ips: IpTraceAccountIp[];
      candidate_ips: IpTraceCandidateIp[];
    }
  | {
      mode: 'ip';
      days: number;
      ip: string;
      accounts: IpTraceIpAccount[];
      unattributed_events: number;
    };

export interface PendingVerificationUser {
  id: string;
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
  user_id: string;
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