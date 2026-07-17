import { apiClient } from '../auth/client';
import { API_BASE_URL } from '@/lib/config/env';
import type {
  InterviewConfig,
  InterviewConfigPayload,
  CreateSessionData,
  InterviewSession,
  QuestionTemplate,
  QuestionTemplatePayload,
} from './types';

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
  private questionTemplatesURL = `${API_BASE_URL}/interviews/question-templates`;
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

  async createConfig(data: InterviewConfigPayload): Promise<InterviewConfig> {
    setToken();
    const response = await apiClient.post(`${this.configsURL}/`, data);
    return response.data;
  }

  async updateConfig(id: string, data: InterviewConfigPayload): Promise<InterviewConfig> {
    setToken();
    const response = await apiClient.patch(`${this.configsURL}/${id}/`, data);
    return response.data;
  }

  async deleteConfig(id: string): Promise<void> {
    setToken();
    await apiClient.delete(`${this.configsURL}/${id}/`);
  }

  async getQuestionTemplates(): Promise<QuestionTemplate[]> {
    setToken();
    const response = await apiClient.get(`${this.questionTemplatesURL}/`);
    return response.data;
  }

  async getQuestionTemplate(id: string): Promise<QuestionTemplate> {
    setToken();
    const response = await apiClient.get(`${this.questionTemplatesURL}/${id}/`);
    return response.data;
  }

  async createQuestionTemplate(data: QuestionTemplatePayload): Promise<QuestionTemplate> {
    setToken();
    const response = await apiClient.post(`${this.questionTemplatesURL}/`, data);
    return response.data;
  }

  async updateQuestionTemplate(id: string, data: QuestionTemplatePayload): Promise<QuestionTemplate> {
    setToken();
    const response = await apiClient.patch(`${this.questionTemplatesURL}/${id}/`, data);
    return response.data;
  }

  async deleteQuestionTemplate(id: string): Promise<void> {
    setToken();
    await apiClient.delete(`${this.questionTemplatesURL}/${id}/`);
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
