// app/api/admin/invoices/endpoints.ts
import { apiClient } from '@/app/api/auth/client';
import { AdminInvoice } from './types';
import { API_BASE_URL } from '@/lib/config/env';

class AdminInvoiceService {
  private baseURL = `${API_BASE_URL}/payments/admin/invoices`;

  async getInvoices(params?: { search?: string; status?: string }): Promise<AdminInvoice[]> {
    const response = await apiClient.get(this.baseURL, { params });
    return response.data;
  }

  async sendInvoice(id: string): Promise<{ message: string }> {
    const response = await apiClient.post(`${this.baseURL}/${id}/send`);
    return response.data;
  }
}

export default new AdminInvoiceService();
