import { LANGUAGES } from '@/lib/languages';
export { LANGUAGES };

export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  passport_id: string;
  job_role: string;
  core_skills: string;
  skills_list: string[];
  preferred_language: string;
  country_of_residence: string | null;
  target_market: string | null;
  timezone: string | null;
  status: string;
  passport_document: string;
  profile_photo: string | null;
  verification_photo: string | null;
  created_by: string;
  created_by_name: string;
  company: string | null;
  company_name: string;
  shared_with: string[];
  created_at: string;
  updated_at: string;
}

export interface CandidateFormData {
  first_name: string;
  last_name: string;
  email: string;
  passport_id: string;
  job_role: string;
  core_skills: string;
  preferred_language: string;
  // Location & Localization - detected/suggested client-side on create
  // only, never on edit (see candidate-modal.tsx), always optional.
  country_of_residence?: string;
  target_market?: string;
  timezone?: string;
  passport_document: File | null;
  profile_photo: File | null;
  verification_photo: File | null;
}

export type CandidateModalMode = 'view' | 'edit' | 'create';

// Returned (as the error response body, HTTP 409) when the passport_id on
// a create attempt already belongs to a candidate under a DIFFERENT
// account - passport_id is globally unique platform-wide, so a duplicate
// Candidate row can never be created; see api/candidates/certificate_reuse_services.py.
export interface CertificatePreview {
  candidate_name: string;
  job_role: string;
  issued_at: string | null;
  certificate_public_id: string;
}

export interface CandidateCertificateAvailableError {
  detail: string;
  code: 'candidate_certificate_available';
  certificate: CertificatePreview;
}

export interface PassportIdTakenElsewhereError {
  detail: string;
  code: 'passport_id_taken_elsewhere';
}

export interface CertificateReuseResult {
  certificate_id: string | null;
  pdf_url: string | null;
  issued_at: string | null;
  candidate_name: string;
  job_role: string;
  slots_remaining: number | null;
}

export const JOB_ROLES = [
  { key: 'NA', label: 'Nanny' },
  { key: 'DR', label: 'Driver' },
  { key: 'HK', label: 'Housekeeper' },
  { key: 'EC', label: 'Elder Companion' },
  { key: 'KA', label: 'Kitchen Assistant' },
  { key: 'MW', label: 'Maintenance Worker' },
  { key: 'OT', label: 'Other' },
];

export const CANDIDATE_STATUS = [
  { key: 'ACTIVE', label: 'ACTIVE' },
  { key: 'ARCHIVED', label: 'ARCHIVED'},
  { key: 'HIRED', label: 'HIRED' },
  { key: 'REJECTED', label: 'REJECTED' },
] as const;

export type JobRole = typeof JOB_ROLES[number]['key'];
export type Language = typeof LANGUAGES[number]['key'];
export type CandidateStatus = typeof CANDIDATE_STATUS[number]['key'];