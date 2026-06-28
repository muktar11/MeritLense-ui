export interface Employer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'B2C' | 'B2B' | 'B2B_TEAM_MEMBER';
  is_active: boolean;
  is_verified: boolean;
  documents_verified: boolean;
  documents_verification_status: string;
  profile_details: B2CProfileDetails | B2BProfileDetails;
  documents_status: DocumentStatus;
  created_at: string;
}

export interface B2CProfileDetails {
  passport_id?: string;
  phone_number?: string;
  nationality?: string;
  job_role?: string;
}

export interface B2BProfileDetails {
  company_name?: string;
  company_registration_number?: string;
  company_size?: string;
  country?: string;
  city?: string;
}

export interface DocumentStatus {
  id_document?: boolean;
  resume_document?: boolean;
  registration_certificate?: boolean;
  resachetified_license?: boolean;
  tax_id_document?: boolean;
  verified: boolean;
}

export interface UpdateEmployerStatusData {
  is_active?: boolean;
  is_verified?: boolean;
  rejection_reason?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const VERIFICATION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'info_needed', label: 'Info Needed' },
];

export const USER_ROLES = [
  { value: 'B2C', label: 'Individual' },
  { value: 'B2B', label: 'Company' },
  { value: 'B2B_TEAM_MEMBER', label: 'Team Member' },
];