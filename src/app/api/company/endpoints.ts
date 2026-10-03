import { apiClient, apiFormDataClient } from '../auth/client';
import { CompanyProfile } from './types';
import { API_BASE_URL } from '@/lib/config/env';

export interface RequestedCompanyDocument {
  id: number;
  name: string;
  status: 'PENDING' | 'UPLOADED';
  document_url?: string | null;
  requested_at?: string;
  uploaded_at?: string | null;
}

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

  async uploadLogo(file: File): Promise<CompanyProfile> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await apiFormDataClient.patch(`${this.baseURL}profile`, formData);
    return response.data;
  }

  async updateRoles(roles: string[]): Promise<CompanyProfile> {
    const response = await apiClient.patch(`${this.baseURL}profile`, { roles });
    return response.data;
  }

  async getDocumentRequests(): Promise<{ results: RequestedCompanyDocument[] }> {
    const response = await apiClient.get(`${this.baseURL}document-requests`);
    return response.data;
  }

  async uploadRequestedDocument(requestId: number, file: File): Promise<RequestedCompanyDocument> {
    const formData = new FormData();
    formData.append('document', file);
    const response = await apiFormDataClient.post(
      `${this.baseURL}document-requests/${requestId}/upload`,
      formData
    );
    return response.data;
  }
}

export default new CompanyService();
