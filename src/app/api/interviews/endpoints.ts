import { apiClient } from '../auth/client';
import { API_BASE_URL } from '@/lib/config/env';
import type { InterviewConfig, CreateSessionData, InterviewSession } from './types';

function setToken() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}

class InterviewService {
  private configsURL = `${API_BASE_URL}/interviews/configs`;
  private sessionsURL = `${API_BASE_URL}/interviews`;

  async getConfigs(): Promise<InterviewConfig[]> {
    setToken();
    const response = await apiClient.get(`${this.configsURL}/`);
    return response.data;
  }

  async getConfig(id: string): Promise<InterviewConfig> {
    setToken();
    const response = await apiClient.get(`${this.configsURL}/${id}/`);
    return response.data;
  }

  async createSession(data: CreateSessionData): Promise<InterviewSession> {
    setToken();
    const response = await apiClient.post(`${this.sessionsURL}/`, data);
    return response.data;
  }

  async startSession(id: string): Promise<InterviewSession> {
    setToken();
    const response = await apiClient.post(`${this.sessionsURL}/${id}/start/`, {});
    return response.data;
  }

  async getSession(id: string): Promise<InterviewSession> {
    setToken();
    const response = await apiClient.get(`${this.sessionsURL}/${id}/`);
    return response.data;
  }

  async getSessions(): Promise<InterviewSession[]> {
    setToken();
    const response = await apiClient.get(`${this.sessionsURL}/`);
    return response.data;
  }
}

export default new InterviewService();
