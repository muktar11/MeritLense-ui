import { Candidate } from '../candidates/types';

export const EVALUATION_TYPES = [
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'TECHNICAL_TEST', label: 'Technical Test' },
  { value: 'ASSESSMENT', label: 'Assessment' },
  { value: 'LANGUAGE_PROFICIENCY', label: 'Language Proficiency' },
] as const;

export const EVALUATION_STATUS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const CERTIFICATE_STATUS = [
  { value: 'NOT_ISSUED', label: 'Not Issued' },
  { value: "PENDING", label: "Pending" },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'EXPIRED', label: 'Expired' },
] as const;

export type EvaluationType = typeof EVALUATION_TYPES[number]['value'];
export type EvaluationStatus = typeof EVALUATION_STATUS[number]['value'];
export type CertificateStatus = typeof CERTIFICATE_STATUS[number]['value'];

export interface Evaluation {
  id: string;
  candidate: string;
  candidate_details?: Candidate;
  
  candidate_first_name: string;
  candidate_last_name: string;
  candidate_email: string;
  candidate_passport_id: string;
  candidate_job_role: string;
  candidate_preferred_language: string;
  
  evaluation_type: EvaluationType;
  evaluation_type_display: string;
  status: EvaluationStatus;
  status_display: string;
  scheduled_date: string;
  duration_minutes: number;
  
  certificate_status: CertificateStatus;
  certificate_status_display: string;
  certificate_issued_at?: string;
  certificate_url?: string;
  
  last_evaluation_date?: string;
  score?: number;
  feedback?: string;
  
  meeting_link?: string;
  meeting_id?: string;
  meeting_password?: string;
  location?: string;
  
  created_by: string;
  created_by_name: string;
  company?: string;
  
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CreateEvaluationData {
  candidate: string;
  evaluation_type: EvaluationType;
  scheduled_date: string;
  duration_minutes: number;
  meeting_link?: string;
  meeting_id?: string;
  meeting_password?: string;
  location?: string;
}

export interface UpdateEvaluationData {
  evaluation_type?: EvaluationType;
  scheduled_date?: string;
  duration_minutes?: number;
  meeting_link?: string;
  meeting_id?: string;
  meeting_password?: string;
  location?: string;
}

export interface CompleteEvaluationData {
  score?: number;
  feedback?: string;
  certificate_status?: CertificateStatus;
  certificate_url?: string;
}

export interface RescheduleEvaluationData {
  new_date: string;
  reason?: string;
}

export interface CancelEvaluationData {
  reason?: string;
}

export interface EvaluationListItem {
  id: string;
  candidate_name: string;
  evaluation_type: EvaluationType;
  evaluation_type_display: string;
  status: EvaluationStatus;
  status_display: string;
  scheduled_date: string;
  duration_minutes: number;
  score?: number;
  created_by: string;
  created_at: string;
}