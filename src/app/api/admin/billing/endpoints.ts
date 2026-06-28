// app/api/admin/billing/service.ts
import { apiClient } from '@/app/api/auth/client';
import { AdminSubscription, AdminSubscriptionStats } from './types';
import { API_BASE_URL } from '@/lib/config/env';

class AdminBillingService {
  private baseURL = `${API_BASE_URL}/payments/admin/subscriptions`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }

  // Get all subscriptions
  async getSubscriptions(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    search?: string;
  }): Promise<AdminSubscription[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(this.baseURL, { params });
    console.log('Subscriptions response:', response.data); // Debug log
    return response.data; // Returns array directly
  }

  // Get subscription details
  async getSubscription(id: number): Promise<AdminSubscription> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  // Get subscription statistics
  async getStats(): Promise<AdminSubscriptionStats> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}/stats`);
    console.log('Stats response:', response.data); // Debug log
    return response.data;
  }
}

export default new AdminBillingService();