import { authClient, authFormDataClient } from './client'
import {
  B2CRegistrationData,
  B2CRegistrationResponse,
  EmailVerificationData,
  EmailVerificationResponse,
  ResendVerificationData,
  ResendVerificationResponse,
  LoginData,
  LoginResponse,
  B2BRegistrationData,
  B2BRegistrationResponse,
  ForgotPasswordData,
  ForgotPasswordResponse,
  ResetPasswordData,
  ResetPasswordResponse,
} from '@/app/api/auth/auth'

export const authAPI = {
  registerB2C: async (data: B2CRegistrationData): Promise<B2CRegistrationResponse> => {
    const formData = new FormData()
    
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value)
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
    
    const response = await authFormDataClient.post('/register/b2c', formData)
    return response.data
  },

  registerB2B: async (data: B2BRegistrationData): Promise<B2BRegistrationResponse> => {
    const formData = new FormData()
    
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value)
      } else if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value))
      }
    })
    
    const response = await authFormDataClient.post('/register/b2b', formData)
    return response.data
  },

  verifyEmail: async (data: EmailVerificationData): Promise<EmailVerificationResponse> => {
    const response = await authClient.post('/verify-email', data)
    return response.data
  },

  resendVerification: async (data: ResendVerificationData): Promise<ResendVerificationResponse> => {
    const response = await authClient.post('/resend-verification', data)
    return response.data
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await authClient.post('/login', data)
    return response.data
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const response = await authClient.post('/refresh', { refresh })
    return response.data
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<ForgotPasswordResponse> => {
    const response = await authClient.post('/forgot-password', data)
    return response.data
  },

  resetPassword: async (data: ResetPasswordData): Promise<ResetPasswordResponse> => {
    const response = await authClient.post('/reset-password', data)
    return response.data
  },

  validateResetToken: async (token: string): Promise<{ valid: boolean }> => {
    const response = await authClient.post('/validate-reset-token', { token })
    return response.data
  },
}

export const JOB_ROLES = [
  { key: 'SE', label: 'Software Engineer' },
  { key: 'DS', label: 'Data Scientist' },
  { key: 'PM', label: 'Product Manager' },
  { key: 'MK', label: 'Marketing' },
  { key: 'SL', label: 'Sales' },
  { key: 'HR', label: 'Human Resources' },
  { key: 'FN', label: 'Finance' },
  { key: 'OT', label: 'Other' },
]

export const NATIONALITIES = [
  { key: 'US', label: 'United States' },
  { key: 'GB', label: 'United Kingdom' },
  { key: 'CA', label: 'Canada' },
  { key: 'AU', label: 'Australia' },
  { key: 'DE', label: 'Germany' },
  { key: 'FR', label: 'France' },
  { key: 'ES', label: 'Spain' },
  { key: 'IT', label: 'Italy' },
  { key: 'AE', label: 'UAE' },
  { key: 'SA', label: 'Saudi Arabia' },
  { key: 'EG', label: 'Egypt' },
  { key: 'IN', label: 'India' },
  { key: 'CN', label: 'China' },
  { key: 'JP', label: 'Japan' },
  { key: 'BR', label: 'Brazil' },
  { key: 'MX', label: 'Mexico' },
  { key: 'OT', label: 'Other' },
]

export const LANGUAGES = [
  { key: 'EN', label: 'English' },
  { key: 'ES', label: 'Spanish' },
  { key: 'FR', label: 'French' },
  { key: 'AR', label: 'Arabic' },
  { key: 'DE', label: 'German' },
  { key: 'ZH', label: 'Chinese' },
]

export const COMPANY_SIZES = [
  { key: '1-10', label: '1-10 employees' },
  { key: '11-50', label: '11-50 employees' },
  { key: '51-200', label: '51-200 employees' },
  { key: '201-1000', label: '201-1000 employees' },
  { key: '1000+', label: '1000+ employees' },
]