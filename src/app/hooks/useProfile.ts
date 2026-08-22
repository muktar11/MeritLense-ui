import { useState, useEffect } from 'react'
import { profileAPI, B2CProfileData, B2BProfileData, AdminProfileData, ChangePasswordData } from './../api/profile/endpoints'

interface UseProfileReturn {
  profile: any
  loading: boolean
  error: string | null
  fetchProfile: () => Promise<void>
  updateProfile: (data: B2CProfileData | B2BProfileData | AdminProfileData) => Promise<boolean>
  changePassword: (data: ChangePasswordData) => Promise<boolean>
  uploadDocument: (documentType: string, file: File) => Promise<boolean>
  uploadProfilePicture: (file: File) => Promise<boolean>
  removeProfilePicture: () => Promise<boolean>
  deleteAccount: (password: string) => Promise<boolean>
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await profileAPI.getProfile()
      setProfile(data)
    } catch (err: any) {
      setError(err.error || 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const updateProfile = async (data: B2CProfileData | B2BProfileData | AdminProfileData): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const updatedProfile = await profileAPI.updateProfile(data)
      setProfile(updatedProfile)
      return true
    } catch (err: any) {
      if (typeof err === 'object') {
        const errorMessages = Object.entries(err)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
        setError(errorMessages || 'Failed to update profile')
      } else {
        setError('Failed to update profile')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (data: ChangePasswordData): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await profileAPI.changePassword(data)
      return true
    } catch (err: any) {
      if (err.current_password) {
        setError(err.current_password[0])
      } else if (err.new_password) {
        setError(err.new_password[0])
      } else if (err.confirm_new_password) {
        setError(err.confirm_new_password[0])
      } else if (err.error) {
        setError(err.error)
      } else {
        setError('Failed to change password')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const uploadDocument = async (documentType: string, file: File): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const response = await profileAPI.uploadDocument(documentType, file)
      setProfile(response.profile)
      return true
    } catch (err: any) {
      setError(err.error || 'Failed to upload document')
      return false
    } finally {
      setLoading(false)
    }
  }

  const uploadProfilePicture = async (file: File): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const response = await profileAPI.uploadProfilePicture(file)
      setProfile((prev: any) => (prev ? { ...prev, profile_picture: response.profile_picture } : prev))
      return true
    } catch (err: any) {
      setError(err.error || 'Failed to upload profile picture')
      return false
    } finally {
      setLoading(false)
    }
  }

  const removeProfilePicture = async (): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await profileAPI.removeProfilePicture()
      setProfile((prev: any) => (prev ? { ...prev, profile_picture: null } : prev))
      return true
    } catch (err: any) {
      setError(err.error || 'Failed to remove profile picture')
      return false
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async (password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await profileAPI.deleteAccount(password)
      return true
    } catch (err: any) {
      setError(err.error || 'Failed to delete account')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
    uploadDocument,
    uploadProfilePicture,
    removeProfilePicture,
    deleteAccount,
  }
}