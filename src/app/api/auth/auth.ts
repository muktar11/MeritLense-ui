export interface B2CRegistrationData {
  email: string
  first_name: string
  last_name: string
  password: string
  confirm_password: string
  passport_id: string
  job_role: string
  nationality: string
  preferred_language: string
  phone_number: string
  date_of_birth?: string
  address?: string
  id_document: File
  resume_document: File
}

export interface B2CRegistrationResponse {
  message: string
  email: string
}

export interface EmailVerificationData {
  email: string
  code: string
}

export interface EmailVerificationResponse {
  message: string
  role: string
}

export interface ResendVerificationData {
  email: string
}

export interface ResendVerificationResponse {
  message: string
}

export interface LoginData {
  email: string
  password: string
}

export interface LoginResponse {
  user_id: string
  access: string
  refresh: string
  role: string
  is_superuser: boolean
  is_staff: boolean
  is_verified: boolean
  documents_verified: boolean
  full_name: string
}

export interface ApiError {
  error?: string
  [key: string]: any
}

export interface JobRole {
  key: string
  label: string
}

export interface Nationality {
  key: string
  label: string
}

export interface Language {
  key: string
  label: string
}

export interface B2BRegistrationData {
  email: string
  first_name: string
  last_name: string
  password: string
  confirm_password: string
  company_name: string
  company_registration_number: string
  company_size: string
  country: string
  city: string
  preferred_language: string
  phone_number: string
  website?: string
  industry?: string
  address?: string
  registration_certificate: File
  resachetified_license: File
  tax_id_document?: File | null
}

export interface B2BRegistrationResponse {
  message: string
  email: string
}

export interface CompanySize {
  key: string
  label: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface ResetPasswordData {
  token: string
  password: string
  confirm_password: string
}

export interface ResetPasswordResponse {
  message: string
}