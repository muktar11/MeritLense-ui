export type SessionStatus =
  | 'CREATED'
  | 'VERIFICATION_PENDING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface InterviewSessionPublic {
  id: string;
  status: SessionStatus;
  role_name: string;
  role_code: string;
  ui_language: string;
  candidate_language: string;
  current_question_index: number;
  total_questions: number;
  progress_percent: number;
  started_at: string | null;
  ended_at: string | null;
  expires_at: string;
  identity_verified: boolean;
}

export interface SessionQuestion {
  id: string;
  question_text: string;
  domain: string;
  skill: string;
  difficulty: string;
  question_order: number;
  status: 'PENDING' | 'ASKED' | 'ANSWERED' | 'SKIPPED' | 'FAILED';
  is_mandatory: boolean;
  asked_at: string | null;
  answered_at: string | null;
}

export interface CurrentQuestionCompleted {
  status: 'COMPLETED';
}

export type CurrentQuestionResult = SessionQuestion | CurrentQuestionCompleted;

export function isSessionCompleted(result: CurrentQuestionResult): result is CurrentQuestionCompleted {
  return (result as CurrentQuestionCompleted).status === 'COMPLETED';
}

export interface QuestionAudioArtifact {
  id: string;
  question_id: string;
  provider: string;
  voice_name: string;
  language_code: string;
  audio_url: string;
  mime_type: string;
  file_size_bytes: number;
  duration_estimate_seconds: number;
  generated_at: string;
}

export interface SubmitTextResponseData {
  question_id: string;
  transcript: string;
  text_response?: string;
  duration_seconds?: number;
}

export interface SubmitResponseResult {
  status: 'SUCCESS';
  response_id: string;
}

export interface CandidateResponseUpload {
  id: string;
  question: string;
  response_type: 'VOICE' | 'TEXT';
  audio_url: string | null;
  audio_mime_type: string | null;
  transcript: string;
  stt_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface PrecheckStatus {
  session_id: string;
  status: SessionStatus;
  candidate_prechecks_complete: boolean;
  verification_status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  identity_verified: boolean;
  face_match_score: string | null;
  single_face_detected: boolean;
  candidate_consent_completed: boolean;
  privacy_notice_acknowledged: boolean;
  device_check_completed: boolean;
  verbal_confirmation_completed: boolean;
  latest_integrity_event: {
    event_type: string;
    severity: string;
    detected_at: string;
    details: Record<string, unknown>;
  } | null;
}

export interface IdentityVerificationResult {
  precheck_status: PrecheckStatus;
  verification: {
    provider: string;
    verification_status: 'VERIFIED' | 'FAILED' | 'PENDING';
    identity_verified: boolean;
    face_match_score: string | null;
    single_face_detected: boolean;
    liveness_passed: boolean;
    reason: string;
  };
  artifacts: Array<{ id: string; artifact_type: string; file_url: string }>;
}

export interface IntegrityEventResult {
  status: 'RECORDED';
  integrity_event: {
    event_type: string;
    severity: string;
    detected_at: string;
    details: Record<string, unknown>;
  };
  analysis: {
    provider: string;
    event_type: string;
    severity: string;
    single_face_detected: boolean;
    face_count: number | null;
    liveness_passed: boolean;
    reason: string;
  } | null;
  artifact: { id: string; artifact_type: string; file_url: string } | null;
}
