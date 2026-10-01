// app/api/admin/package-requests/endpoints.ts
import { apiClient } from '@/app/api/auth/client';
import { API_BASE_URL } from '@/lib/config/env';
import {
  PackageRequest,
  PackageRequestApprovePayload,
  PackageRequestDenyPayload,
  PackageRequestConfirmBankTransferPayload,
  PaginatedResponse,
} from './types';

class AdminPackageRequestService {
  private baseURL = `${API_BASE_URL}/payments/admin/package-requests`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }

  async getRequests(params?: { status?: string }): Promise<PaginatedResponse<PackageRequest>> {
    this.ensureAuthToken();
    const response = await apiClient.get(this.baseURL, { params });
    // AdminPackageRequestViewSet has no pagination class configured, so it
    // returns a bare array, not the {count, next, previous, results} shape
    // this type implies - without this, response.results was always
    // undefined and the page silently showed "No package requests yet."
    // regardless of how many actually existed.
    if (Array.isArray(response.data)) {
      return { count: response.data.length, next: null, previous: null, results: response.data };
    }
    return response.data;
  }

  async approve(id: string, data: PackageRequestApprovePayload): Promise<PackageRequest> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${this.baseURL}/${id}/approve`, data);
    return response.data;
  }

  async deny(id: string, data: PackageRequestDenyPayload): Promise<PackageRequest> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${this.baseURL}/${id}/deny`, data);
    return response.data;
  }

  async confirmBankTransfer(id: string, data: PackageRequestConfirmBankTransferPayload): Promise<PackageRequest> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${this.baseURL}/${id}/confirm-bank-transfer`, data);
    return response.data;
  }
}

export default new AdminPackageRequestService();
