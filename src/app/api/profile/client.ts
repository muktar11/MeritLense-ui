import axios from 'axios'
import { API_BASE_URL } from '@/lib/config/env'
import { attachAuthInterceptors } from '@/lib/auth-session'

export const profileClient = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const profileFormDataClient = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
})

attachAuthInterceptors(profileClient)
attachAuthInterceptors(profileFormDataClient)
