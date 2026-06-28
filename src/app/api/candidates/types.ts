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
  status: string;
  passport_document: string;
  profile_photo: string | null;
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
  passport_document: File | null;
  profile_photo: File | null;
}

export type CandidateModalMode = 'view' | 'edit' | 'create';

export const JOB_ROLES = [
  { key: 'NA', label: 'Nanny' },
  { key: 'DR', label: 'Driver' },
  { key: 'HK', label: 'Housekeeper' },
  { key: 'EC', label: 'Elder Companion' },
  { key: 'KA', label: 'Kitchen Assistant' },
  { key: 'MW', label: 'Maintenance Worker' },
  { key: 'OT', label: 'Other' },
];

export const LANGUAGES = [
  { key: 'EN', label: 'English' },
  { key: 'ES', label: 'Spanish' },
  { key: 'FR', label: 'French' },
  { key: 'DE', label: 'German' },
  { key: 'ZH', label: 'Chinese' },
  { key: 'AR', label: 'Arabic' },
  { key: 'RU', label: 'Russian' },
  { key: 'PT', label: 'Portuguese' },
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