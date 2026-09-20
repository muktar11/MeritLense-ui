import { apiClient } from '../auth/client';
import { API_BASE_URL } from '@/lib/config/env';
import type { KnowledgeFAQResponse } from './types';

class KnowledgeService {
  private baseURL = `${API_BASE_URL}/knowledge`;

  // Public, unauthenticated - the backend enforces which content is
  // eligible to be returned here (Approved + Public visibility only). This
  // is the controlled source now; the frontend no longer bundles Q&A
  // content of its own.
  async getPublicFAQ(language: 'en' | 'ar'): Promise<KnowledgeFAQResponse> {
    const response = await apiClient.get(`${this.baseURL}/faq`, { params: { language } });
    return response.data;
  }
}

const knowledgeService = new KnowledgeService();

export default knowledgeService;
