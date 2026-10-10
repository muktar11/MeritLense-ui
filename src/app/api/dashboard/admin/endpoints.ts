import { apiClient, authClient } from '@/app/api/auth/client';
import {
  ComparisonAccount,
  ReadinessDistribution,
  ComparisonRole,
  ComparisonEligibleCandidate,
  FullComparisonResult,
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

  // Platform-wide Overall Readiness Index (same calculation as B2B/B2C).
  async getReadinessDistribution(): Promise<ReadinessDistribution> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}readiness-distribution`);
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

  // Candidate Comparison (Select Account -> Select Job Role -> Select 2-4
  // Eligible Candidates -> Compare). Step 0: accounts with scored candidates.
  async getComparisonAccounts(): Promise<ComparisonAccount[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}candidate-comparison/accounts`);
    return response.data;
  }

  private ownerParams(account: ComparisonAccount) {
    return { owner_type: account.owner_type, owner_id: account.owner_id };
  }

  async getComparisonRoles(account: ComparisonAccount): Promise<ComparisonRole[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}candidate-comparison/roles`, {
      params: this.ownerParams(account),
    });
    return response.data;
  }

  async getComparisonEligibleCandidates(account: ComparisonAccount, roleCode: string): Promise<ComparisonEligibleCandidate[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}candidate-comparison/eligible-candidates`, {
      params: { ...this.ownerParams(account), role_code: roleCode },
    });
    return response.data;
  }

  async getFullComparison(account: ComparisonAccount, roleCode: string, candidateIds: string[], lang?: string): Promise<FullComparisonResult> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}candidate-comparison/full`, {
      params: {
        ...this.ownerParams(account),
        role_code: roleCode,
        candidate_ids: candidateIds.join(','),
        ...(lang ? { lang } : undefined),
      },
    });
    return response.data;
  }

  async downloadComparisonPdf(account: ComparisonAccount, roleCode: string, candidateIds: string[], lang?: string, filename?: string): Promise<void> {
    const response = await authClient.get(`${this.baseURL}candidate-comparison/pdf`, {
      params: {
        ...this.ownerParams(account),
        role_code: roleCode,
        candidate_ids: candidateIds.join(','),
        ...(lang ? { lang } : undefined),
      },
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/pdf',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'candidate-comparison.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export default new AdminDashboardService();