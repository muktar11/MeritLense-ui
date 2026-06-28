import { apiClient } from '../auth/client';
import { authClient, authFormDataClient, setAuthToken } from './client';
import { Candidate, CandidateFormData } from './types';
import { API_BASE_URL } from '@/lib/config/env';

class CandidateService {
  private baseURL = `${API_BASE_URL}/candidates/candidates`;

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private ensureAuthToken() {
    const token = this.getToken();
    if (token) {
      setAuthToken(token);
    }
    return token;
  }

  async getCandidates(): Promise<Candidate[]> {
    this.ensureAuthToken();
    const response = await authClient.get(this.baseURL);
    return response.data;
  }

  async getCandidate(id: string): Promise<Candidate> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  async createCandidate(data: CandidateFormData): Promise<Candidate> {
    this.ensureAuthToken();
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'passport_document' || key === 'profile_photo') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await authFormDataClient.post(this.baseURL, formData);
    return response.data;
  }

  async updateCandidate(id: string, data: CandidateFormData): Promise<Candidate> {
    this.ensureAuthToken();
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'passport_document' || key === 'profile_photo') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await authFormDataClient.patch(`${this.baseURL}/${id}`, formData);
    return response.data;
  }

  async deleteCandidate(id: string): Promise<void> {
    this.ensureAuthToken();
    await authClient.delete(`${this.baseURL}/${id}`);
  }

  async shareCandidate(id: string, data: { user_ids: number[] }): Promise<any> {
    this.ensureAuthToken();
    try {
      const response = await apiClient.post(`${this.baseURL}/${id}/share`, data);
      return response.data;
    } catch (error: any) {
      console.error('Share candidate error:', error.response?.data || error);
      throw error;
    }
  }

  async unshareCandidate(id: string, user_ids: number[]): Promise<any> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}/${id}/unshare`, { user_ids });
    return response.data;
  }

  async getMyCandidates(): Promise<Candidate[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/my_candidates`);
    return response.data;
  }

  async getSharedWithMe(): Promise<Candidate[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/shared_with_me`);
    return response.data;
  }

  candidateToFormData(candidate: Candidate): CandidateFormData {
    return {
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      passport_id: candidate.passport_id,
      job_role: candidate.job_role,
      core_skills: candidate.core_skills,
      preferred_language: candidate.preferred_language,
      passport_document: null,
      profile_photo: null,
    };
  }
}

export default new CandidateService();