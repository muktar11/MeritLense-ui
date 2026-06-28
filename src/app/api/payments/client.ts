import axios from 'axios'
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

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const apiFormDataClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
})

export const setAuthToken = (token: string | null) => {
  if (token) {
    authClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    authFormDataClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    apiFormDataClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    
    console.log('Auth token set successfully');
  } else {
    delete authClient.defaults.headers.common['Authorization']
    delete authFormDataClient.defaults.headers.common['Authorization']
    
    delete apiClient.defaults.headers.common['Authorization']
    delete apiFormDataClient.defaults.headers.common['Authorization']
    
    console.log('Auth token removed');
  }
}

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await authClient.post('/refresh', { refresh: refreshToken })
        const { access } = response.data

        localStorage.setItem('accessToken', access)
        setAuthToken(access)

        originalRequest.headers['Authorization'] = `Bearer ${access}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setAuthToken(null)
        
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

apiFormDataClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Auth API Error:', error.response.data)
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

authClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Auth API Error:', error.response.data)
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

authFormDataClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Auth API Error:', error.response.data)
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