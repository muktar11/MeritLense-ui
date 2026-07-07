import { apiClient } from '@/app/api/auth/client';
import { 
  AuditLogEntry, 
  AuditLogSummary, 
  AuditLogFilter,
  PendingVerificationResponse,
  DocumentVerificationRequest
} from './types';
import { API_BASE_URL } from '@/lib/config/env';

class AuditService {
  private baseURL = `${API_BASE_URL}/audit/`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }


async getAuditLogs(filters?: AuditLogFilter): Promise<{
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLogEntry[];
}> {
  this.ensureAuthToken();
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }
  
  try {
    const response = await apiClient.get(`${this.baseURL}logs`, { params });
    console.log('Audit logs response:', response.data);
    
    if (Array.isArray(response.data)) {
      return {
        count: response.data.length,
        next: null,
        previous: null,
        results: response.data
      };
    } else {
      return {
        count: response.data.count || 0,
        next: response.data.next || null,
        previous: response.data.previous || null,
        results: response.data.results || []
      };
    }
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return {
      count: 0,
      next: null,
      previous: null,
      results: []
    };
  }
}

  async getAuditSummary(days: number = 30): Promise<AuditLogSummary> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}logs/summary`, {
      params: { days }
    });
    return response.data;
  }

  async getCategories(): Promise<Array<{ key: string; label: string }>> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}logs/categories`);
    return response.data;
  }

  async getActions(): Promise<Array<{ key: string; label: string }>> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}logs/actions`);
    return response.data;
  }

  async getUserActivity(days: number = 30, limit: number = 10): Promise<any[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}logs/user_activity`, {
      params: { days, limit }
    });
    return response.data;
  }

  async getPendingVerifications(): Promise<PendingVerificationResponse> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${API_BASE_URL}/auth/admin/employers/pending-verification`);
    return response.data;
  }

  async verifyDocuments(data: DocumentVerificationRequest): Promise<any> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${API_BASE_URL}/auth/admin/employers/verify-documents`, data);
    return response.data;
  }

  async rejectDocuments(data: { user_id: string; rejection_reason: string; verification_notes?: string }): Promise<any> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${API_BASE_URL}/auth/admin/employers/reject-documents`, data);
    return response.data;
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}

export default new AuditService();