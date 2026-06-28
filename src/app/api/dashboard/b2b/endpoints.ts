import { apiClient } from '@/app/api/auth/client';
import {
  DashboardStats,
  RecentCandidate,
  RecentEvaluation,
  ScoreDistribution,
  EvaluationTrend,
  LanguageDistribution,
  PerformanceMetric,
  EvaluationStatusDistribution,
  MonthlyActivity
} from './types';
import { API_BASE_URL } from '@/lib/config/env';

class B2BDashboardService {
  private baseURL = `${API_BASE_URL}/dashboard/b2b/`;

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

  async getRecentEvaluations(limit: number = 10): Promise<RecentEvaluation[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}evaluations/recent`, {
      params: { limit }
    });
    return response.data;
  }

  async getScoreDistribution(): Promise<ScoreDistribution[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}score-distribution`);
    return response.data;
  }

  async getEvaluationTrend(days: number = 30): Promise<EvaluationTrend[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}evaluation-trend`, {
      params: { days }
    });
    return response.data;
  }

  async getLanguageDistribution(): Promise<LanguageDistribution[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}language-distribution`);
    return response.data;
  }

  async getPerformanceMetrics(months: number = 6): Promise<PerformanceMetric[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}performance-metrics`, {
      params: { months }
    });
    return response.data;
  }

  async getStatusDistribution(): Promise<EvaluationStatusDistribution[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}status-distribution`);
    return response.data;
  }

  async getMonthlyActivity(months: number = 6): Promise<MonthlyActivity[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}monthly-activity`, {
      params: { months }
    });
    return response.data;
  }
}

export default new B2BDashboardService();