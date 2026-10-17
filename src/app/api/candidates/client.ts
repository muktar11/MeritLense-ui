import axios from 'axios'
import { withPageLanguage } from '@/lib/api-language'
import { API_BASE_URL } from '@/lib/config/env'
import { attachAuthInterceptors } from '@/lib/auth-session'

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

attachAuthInterceptors(authClient)
attachAuthInterceptors(authFormDataClient)

// Send the page language (Arabic or English) with every request.
withPageLanguage(authClient)
withPageLanguage(authFormDataClient)
