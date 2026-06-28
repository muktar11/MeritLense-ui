// app/api/dashboard/b2c/service.ts
import { apiClient } from '@/app/api/auth/client';
import {
  DashboardStats,
  RecentCandidate,
  RecentEvaluation,
  CandidateComparison,
  EvaluationTimeRange,
  EvaluationStatusDistribution,
  JobRoleDistribution,
  ScoreTrend
} from './types';
import { API_BASE_URL } from '@/lib/config/env';

class B2CDashboardService {
  private baseURL = `${API_BASE_URL}/dashboard/b2c/`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }

  async getStats(): Promise<DashboardStats> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}stats`);
    return response.data;
  }

  async getRecentCandidates(limit: number = 10): Promise<RecentCandidate[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}candidates/recent`, {
      params: { limit }
    });
    return response.data;
  }

  async getRecentEvaluations(limit: number = 10, status?: string): Promise<RecentEvaluation[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}evaluations/recent`, {
      params: { limit, status }
    });
    return response.data;
  }

  async getCandidateComparison(): Promise<CandidateComparison[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}candidate-comparison`);
    return response.data;
  }

  async getEvaluationTimeRange(): Promise<EvaluationTimeRange[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}evaluation-time-range`);
    return response.data;
  }

  async getStatusDistribution(): Promise<EvaluationStatusDistribution[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}status-distribution`);
    return response.data;
  }

  async getJobRoleDistribution(): Promise<JobRoleDistribution[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}job-role-distribution`);
    return response.data;
  }

  async getScoreTrend(days: number = 30): Promise<ScoreTrend[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}score-trend`, {
      params: { days }
    });
    return response.data;
  }
}

export default new B2CDashboardService();