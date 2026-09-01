// app/api/admin/packages/endpoints.ts
import { apiClient } from '@/app/api/auth/client';
import { Package, PackagePayload, PaginatedResponse } from './types';
import { API_BASE_URL } from '@/lib/config/env';

class AdminPackageService {
  private baseURL = `${API_BASE_URL}/payments/admin/prices`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }

  async getPackages(params?: {
    page?: number;
    page_size?: number;
    target_user_type?: string;
    billing_type?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Package>> {
    this.ensureAuthToken();
    const response = await apiClient.get(this.baseURL, { params });
    return response.data;
  }

  async getPackage(id: string): Promise<Package> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  async createPackage(data: PackagePayload): Promise<Package> {
    this.ensureAuthToken();
    const response = await apiClient.post(this.baseURL, data);
    return response.data;
  }

  async updatePackage(id: string, data: Partial<PackagePayload>): Promise<Package> {
    this.ensureAuthToken();
    const response = await apiClient.patch(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  async deactivatePackage(id: string): Promise<Package> {
    this.ensureAuthToken();
    const response = await apiClient.delete(`${this.baseURL}/${id}`);
    return response.data;
  }

  // Only succeeds for a package with zero subscription history - the
  // backend rejects it (400) otherwise and says to deactivate instead.
  async deletePackagePermanently(id: string): Promise<void> {
    this.ensureAuthToken();
    await apiClient.delete(`${this.baseURL}/${id}?permanent=true`);
  }
}

export default new AdminPackageService();
