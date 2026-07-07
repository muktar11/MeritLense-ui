// app/api/admin/employers/service.ts
import { apiClient, apiFormDataClient } from '@/app/api/auth/client';
import {
  Employer,
  UpdateEmployerStatusData,
  PaginatedResponse
} from './types';
import type { B2CRegistrationData, B2BRegistrationData } from '@/app/api/auth/auth';
import { API_BASE_URL } from '@/lib/config/env';

class EmployerService {
  private baseURL = `${API_BASE_URL}/auth/admin/employers`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }

  // Get all employers with filters and pagination
  async getEmployers(params?: {
    page?: number;
    page_size?: number;
    role?: string;
    verification_status?: string;
    is_verified?: boolean;
    documents_verified?: boolean;
    search?: string;
    date_from?: string;
    date_to?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<Employer>> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}`, { params });
    return response.data;
  }

  // Get single employer details
  async getEmployer(userId: number): Promise<Employer> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}/${userId}`);
    return response.data;
  }

  // Update employer status
  async updateEmployerStatus(userId: number, data: UpdateEmployerStatusData): Promise<{ message: string; user: Employer }> {
    this.ensureAuthToken();
    const response = await apiClient.patch(`${this.baseURL}/${userId}`, data);
    return response.data;
  }

  // Admin: create a new individual (B2C) employer account
  async createEmployerB2C(data: B2CRegistrationData): Promise<{ message: string; employer: Employer }> {
    this.ensureAuthToken();
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await apiFormDataClient.post(`${this.baseURL}/create/b2c`, formData);
    return response.data;
  }

  // Admin: create a new company (B2B) employer account
  async createEmployerB2B(data: B2BRegistrationData): Promise<{ message: string; employer: Employer }> {
    this.ensureAuthToken();
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });

    const response = await apiFormDataClient.post(`${this.baseURL}/create/b2b`, formData);
    return response.data;
  }

  // Format role for display
  formatRole(role: string): string {
    const roles: Record<string, string> = {
      'B2C': 'Individual',
      'B2B': 'Company',
      'B2B_TEAM_MEMBER': 'Team Member'
    };
    return roles[role] || role;
  }

  // Format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

export default new EmployerService();