import { profileClient, profileFormDataClient } from './client'

export interface B2CProfileData {
  first_name: string
  last_name: string
  phone_number: string
  date_of_birth?: string
  address?: string
  passport_id?: string
  job_role?: string
  nationality?: string
  preferred_language?: string
}

export interface B2BProfileData {
  first_name: string
  last_name: string
  company_name: string
  phone_number: string
  country: string
  city: string
  address?: string
  website?: string
  industry?: string
  preferred_language?: string
}

export interface AdminProfileData {
  first_name: string
  last_name: string
  department?: string
  phone_number?: string
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
  confirm_new_password: string
}

export interface ChangePasswordResponse {
  message: string
}

export interface DocumentUploadResponse {
  message: string
  profile: any
}

export const profileAPI = {
  getProfile: async () => {
    const response = await profileClient.get('/me')
    return response.data
  },

  updateProfile: async (data: B2CProfileData | B2BProfileData | AdminProfileData) => {
    const response = await profileClient.patch('/me', data)
    return response.data
  },

  changePassword: async (data: ChangePasswordData): Promise<ChangePasswordResponse> => {
    const response = await profileClient.post('/change-password', data)
    return response.data
  },

  uploadDocument: async (documentType: string, file: File): Promise<DocumentUploadResponse> => {
    const formData = new FormData()
    formData.append('document_type', documentType)
    formData.append('document', file)

    const response = await profileFormDataClient.post('/documents/upload', formData)
    return response.data
  },
}