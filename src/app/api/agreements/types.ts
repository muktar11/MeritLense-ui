export type AgreementType =
  | 'PRIVACY_TERMS'
  | 'AI_DISCLOSURE'
  | 'B2B_AGREEMENT'
  | 'DPA'
  | 'B2C_AGREEMENT'
  | 'CANDIDATE_CONSENT';

export type AgreementMethod = 'CHECKBOX' | 'OTP_SIGNATURE';
export type AgreementStatus = 'PENDING' | 'SIGNED' | 'SUPERSEDED';

export interface Agreement {
  id: string;
  agreement_type: AgreementType;
  agreement_type_display: string;
  version: string;
  method: AgreementMethod;
  status: AgreementStatus;
  status_display: string;
  signatory_name: string;
  accepted_at: string | null;
  contract_id: string;
  signed_pdf_url: string | null;
  pdf_hash: string;
  created_at: string;
}

export type AgreementVersions = Record<AgreementType, string>;

export interface AcceptAgreementRequest {
  agreement_type: 'PRIVACY_TERMS' | 'AI_DISCLOSURE';
  accepted: boolean;
}

export interface SignInitiateRequest {
  agreement_types: AgreementType[];
  signatory_name: string;
  authorized_signatory_confirmed?: boolean;
}

export interface SignInitiateResponse {
  otp_reference: string;
  sent_to: string;
  email_dispatched: boolean;
  expires_at: string;
  resends_remaining?: number;
}

export interface SignConfirmRequest {
  otp_reference: string;
  code: string;
}

export interface SignConfirmError {
  error: string;
  locked?: boolean;
}

export interface ResendRequest {
  otp_reference: string;
}

export interface AgreementPreview {
  html: string;
  version: string;
}

export interface AgreementVerification {
  contract_id: string;
  agreement_type: AgreementType;
  agreement_type_display: string;
  version: string;
  signatory_name: string;
  signed_at: string | null;
  status: 'VALID' | 'SUPERSEDED';
  pdf_hash: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  action_display: string;
  description: string;
  created_at: string;
  ip_address: string | null;
}
