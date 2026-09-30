// app/api/payments/package-requests/endpoints.ts
import { apiClient } from '@/app/api/auth/client';
import { API_BASE_URL } from '@/lib/config/env';
import { PackageRequest, PackageRequestCreatePayload, PaginatedResponse } from './types';

class PackageRequestService {
  private baseURL = `${API_BASE_URL}/payments/package-requests`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }

  async getMyRequests(): Promise<PaginatedResponse<PackageRequest>> {
    this.ensureAuthToken();
    const response = await apiClient.get(this.baseURL);
    return response.data;
  }

  async submit(data: PackageRequestCreatePayload): Promise<PackageRequest> {
    this.ensureAuthToken();
    const response = await apiClient.post(this.baseURL, data);
    return response.data;
  }
}

export default new PackageRequestService();
