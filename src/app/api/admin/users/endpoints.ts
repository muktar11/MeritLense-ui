// app/api/admin/users/service.ts
import { apiClient } from '@/app/api/auth/client';
import {
  AdminUser,
  CreateAdminUserData,
  UpdateAdminUserData,
  PaginatedResponse
} from './types';
import { API_BASE_URL } from '@/lib/config/env';

class AdminUserService {
  private baseURL = `${API_BASE_URL}/auth/admin/users`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }

  // Get all admin users with pagination and filters
  async getAdminUsers(params?: {
    page?: number;
    page_size?: number;
    role?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<AdminUser>> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}`, { params });
    return response.data;
  }

  // Get single admin user
  async getAdminUser(userId: number): Promise<AdminUser> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}/${userId}`);
    return response.data;
  }

  // Create new admin user
  async createAdminUser(data: CreateAdminUserData): Promise<{ message: string; admin: AdminUser }> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${this.baseURL}/create`, data);
    return response.data;
  }

  // Update admin user
  async updateAdminUser(userId: number, data: UpdateAdminUserData): Promise<AdminUser> {
    this.ensureAuthToken();
    const response = await apiClient.patch(`${this.baseURL}/${userId}`, data);
    return response.data;
  }

  // Delete admin user
  async deleteAdminUser(userId: number): Promise<{ message: string }> {
    this.ensureAuthToken();
    const response = await apiClient.delete(`${this.baseURL}/${userId}`);
    return response.data;
  }
}

export default new AdminUserService();