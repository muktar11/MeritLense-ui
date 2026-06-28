import { apiClient } from '@/app/api/auth/client';
import {
  AdminDashboardStats,
  SystemLoadData,
  UserGrowthData,
  EvaluationTypeDistribution,
  PackageContribution,
  EvaluationStatusDistribution,
  UserTypeDistribution,
  RevenueTrendData,
  TopPerformingCandidate,
  RecentActivity,
  GeographicDistribution
} from './types';
import { API_BASE_URL } from '@/lib/config/env';

class AdminDashboardService {
  private baseURL = `${API_BASE_URL}/dashboard/admin/`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }

  async getStats(): Promise<AdminDashboardStats> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}stats`);
    return response.data;
  }

  async getSystemLoad(days: number = 30): Promise<SystemLoadData[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}system-load`, {
      params: { days }
    });
    return response.data;
  }

  async getUserGrowth(months: number = 12): Promise<UserGrowthData[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}user-growth`, {
      params: { months }
    });
    return response.data;
  }

  async getEvaluationTypes(): Promise<EvaluationTypeDistribution[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}evaluation-types`);
    return response.data;
  }

  async getPackageContribution(): Promise<PackageContribution[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}package-contribution`);
    return response.data;
  }

  async getStatusDistribution(): Promise<EvaluationStatusDistribution[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}status-distribution`);
    return response.data;
  }

  async getUserTypeDistribution(): Promise<UserTypeDistribution[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}user-type-distribution`);
    return response.data;
  }

  async getRevenueTrend(months: number = 12): Promise<RevenueTrendData[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}revenue-trend`, {
      params: { months }
    });
    return response.data;
  }

  async getTopCandidates(limit: number = 10): Promise<TopPerformingCandidate[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}top-candidates`, {
      params: { limit }
    });
    return response.data;
  }

  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}recent-activity`, {
      params: { limit }
    });
    return response.data;
  }

  async getGeographicDistribution(): Promise<GeographicDistribution[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}geographic-distribution`);
    return response.data;
  }

  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}

export default new AdminDashboardService();