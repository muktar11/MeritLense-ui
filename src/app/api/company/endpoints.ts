import { apiClient, apiFormDataClient } from '../auth/client';
import { CompanyProfile } from './types';
import { API_BASE_URL } from '@/lib/config/env';

class CompanyService {
  private baseURL = `${API_BASE_URL}/auth/companies/`;

  async getProfile(): Promise<CompanyProfile> {
    const response = await apiClient.get(`${this.baseURL}profile`);
    return response.data;
  }

  async uploadStamp(file: File): Promise<CompanyProfile> {
    const formData = new FormData();
    formData.append('stamp_image', file);
    const response = await apiFormDataClient.patch(`${this.baseURL}profile`, formData);
    return response.data;
  }
}

export default new CompanyService();
