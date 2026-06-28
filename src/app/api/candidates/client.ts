import axios from 'axios'
import { authAPI } from '../auth/endpoints'
import { API_BASE_URL } from '@/lib/config/env'

export const authClient = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authFormDataClient = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
})

export const setAuthToken = (token: string | null) => {
  if (token) {
    authClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    authFormDataClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete authClient.defaults.headers.common['Authorization']
    delete authFormDataClient.defaults.headers.common['Authorization']
  }
}

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return authClient(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await authAPI.refreshToken(refreshToken)
        const { access } = response

        localStorage.setItem('accessToken', access)
        setAuthToken(access)

        originalRequest.headers['Authorization'] = `Bearer ${access}`
        processQueue(null, access)
        
        return authClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setAuthToken(null)
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
  }
)

authFormDataClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data)
      return Promise.reject(error.response.data)
    } else if (error.request) {
      console.error('No response received:', error.request)
      return Promise.reject({ error: 'No response from server' })
    } else {
      console.error('Request error:', error.message)
      return Promise.reject({ error: error.message })
    }
  }
)