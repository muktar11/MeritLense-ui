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
