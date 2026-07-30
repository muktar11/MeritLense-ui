import axios from 'axios'
import { API_BASE_URL } from '@/lib/config/env'
import { attachAuthInterceptors } from '@/lib/auth-session'

// authClient/authFormDataClient are for the *unauthenticated* auth flows
// (login, register, refresh, forgot/reset password, email verification) -
// a 401 here (e.g. wrong password) is an expected, normal outcome the
// calling form already handles, not a sign the session expired, so these
// deliberately do NOT get the refresh/force-logout treatment.
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

// apiClient/apiFormDataClient are the general-purpose authenticated
// clients used across most of the app.
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
  } else {
    delete authClient.defaults.headers.common['Authorization']
    delete authFormDataClient.defaults.headers.common['Authorization']
    delete apiClient.defaults.headers.common['Authorization']
    delete apiFormDataClient.defaults.headers.common['Authorization']
  }
}

attachAuthInterceptors(apiClient)
attachAuthInterceptors(apiFormDataClient)

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
