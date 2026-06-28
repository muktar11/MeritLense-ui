// hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '../api/auth/endpoints'
import { setAuthToken } from '../api/auth/client'
import {
    B2BRegistrationData,
  B2CRegistrationData,
  EmailVerificationData,
  LoginData,
} from '@/app/api/auth/auth'

interface UseAuthReturn {
  loading: boolean
  error: string | null
  userRole: string | null
  userId: string | null
  isAuthenticated: boolean
  registerB2C: (data: B2CRegistrationData) => Promise<boolean>
  registerB2B: (data: B2BRegistrationData) => Promise<boolean>
  verifyEmail: (data: EmailVerificationData) => Promise<boolean>
  resendVerification: (email: string) => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<boolean>
  validateResetToken: (token: string) => Promise<boolean>
  login: (data: LoginData) => Promise<boolean>
  logout: () => void
}

export const useAuth = (): UseAuthReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const router = useRouter()

  // Load user data from localStorage on initial mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const role = localStorage.getItem('userRole')
    const userDataStr = localStorage.getItem('userData')
    
    if (token && role) {
      setUserRole(role)
      setIsAuthenticated(true)
      
      // Try to extract userId from userData if available
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr)
          if (userData.id) {
            setUserId(userData.id)
          }
        } catch (e) {
          console.error('Failed to parse userData', e)
        }
      }
      
      // Set auth token in axios clients
      setAuthToken(token)
    }
  }, [])

  const registerB2C = async (data: B2CRegistrationData): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await authAPI.registerB2C(data)
      
      localStorage.setItem('registrationEmail', response.email)
      localStorage.setItem('registrationType', 'b2c')
      
      return true
    } catch (err: any) {
      if (err.error) {
        setError(err.error)
      } else if (typeof err === 'object') {
        const errorMessages = Object.entries(err)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
        setError(errorMessages || 'Registration failed')
      } else {
        setError('Registration failed. Please try again.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const registerB2B = async (data: B2BRegistrationData): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await authAPI.registerB2B(data)
      
      localStorage.setItem('registrationEmail', response.email)
      localStorage.setItem('registrationType', 'b2b')
      
      return true
    } catch (err: any) {
      if (err.error) {
        setError(err.error)
      } else if (typeof err === 'object') {
        // Handle field errors
        const errorMessages = Object.entries(err)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
        setError(errorMessages || 'Registration failed')
      } else {
        setError('Registration failed. Please try again.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async (data: EmailVerificationData): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await authAPI.verifyEmail(data)
      
      localStorage.setItem('emailVerified', 'true')
      localStorage.setItem('userRole', response.role)
      setUserRole(response.role)
      
      return true
    } catch (err: any) {
      if (err.error) {
        setError(err.error)
      } else {
        setError('Verification failed. Please check your code and try again.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async (email: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await authAPI.resendVerification({ email })
      return true
    } catch (err: any) {
      if (err.error) {
        setError(err.error)
      } else {
        setError('Failed to resend verification code')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async (email: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await authAPI.forgotPassword({ email })
      return true
    } catch (err: any) {
      if (err.error) {
        setError(err.error)
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Failed to send reset email. Please try again.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (
    token: string, 
    password: string, 
    confirmPassword: string
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await authAPI.resetPassword({ token, password, confirm_password: confirmPassword })
      return true
    } catch (err: any) {
      if (err.error) {
        setError(err.error)
      } else if (err.confirm_password) {
        setError(err.confirm_password[0])
      } else if (err.password) {
        setError(err.password[0])
      } else {
        setError('Failed to reset password. Please try again.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const validateResetToken = async (token: string): Promise<boolean> => {
    try {
      const response = await authAPI.validateResetToken(token)
      return response.valid
    } catch (err) {
      return false
    }
  }

  const login = async (data: LoginData): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await authAPI.login(data)
      
      localStorage.setItem('accessToken', response.access)
      localStorage.setItem('refreshToken', response.refresh)
      localStorage.setItem('userRole', response.role)
      localStorage.setItem('userData', JSON.stringify({
        id: response.user_id,
        full_name: response.full_name,
        is_verified: response.is_verified,
        documents_verified: response.documents_verified,
      }))
      
      setUserRole(response.role)
      setUserId(response.user_id)
      setIsAuthenticated(true)
      
      setAuthToken(response.access)
      
      return true
    } catch (err: any) {
      if (err.error) {
        setError(err.error)
      } else if (err.detail) {
        setError(err.detail)
      } else {
        setError('Login failed. Please check your credentials.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userData')
    localStorage.removeItem('registrationEmail')
    localStorage.removeItem('emailVerified')
    
    // Clear state
    setUserRole(null)
    setUserId(null)
    setIsAuthenticated(false)
    
    // Clear auth token from axios
    setAuthToken(null)
    
    // Redirect to login
    router.push('/auth/login')
  }

  return {
    loading,
    error,
    userRole,
    userId,
    isAuthenticated,
    registerB2C,
    registerB2B,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    validateResetToken,
    login,
    logout,
  }
}