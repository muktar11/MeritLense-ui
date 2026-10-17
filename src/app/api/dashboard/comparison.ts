// Compare Candidates page: the same three calls for B2B (company) and B2C
// (individual) accounts, which differ only in the URL prefix - the backend
// scopes every call to the signed-in account's own candidates.
import { apiClient, authClient } from '@/app/api/auth/client';
import { API_BASE_URL } from '@/lib/config/env';
import type { ComparisonAssessment, ComparisonRole, FullComparisonResult } from './b2b/types';

export type ComparisonScope = 'b2b' | 'b2c';

export interface AssessmentFilters {
  evaluationTier?: 'FULL' | 'SCREENING';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;
}

export function comparisonApi(scope: ComparisonScope) {
  const base = `${API_BASE_URL}/dashboard/${scope}/candidate-comparison`;
  const selection = (roleCode: string, evaluationIds: string[], lang?: string) => ({
    role_code: roleCode,
    evaluation_ids: evaluationIds.join(','),
    ...(lang ? { lang } : undefined),
  });

  return {
    async getRoles(): Promise<ComparisonRole[]> {
      const response = await apiClient.get(`${base}/roles`);
      return response.data;
    },

    // Every comparable assessment for the role - one row per assessment,
    // so a candidate assessed more than once can be compared on a
    // specific attempt.
    async getAssessments(roleCode: string, filters: AssessmentFilters = {}): Promise<ComparisonAssessment[]> {
      const response = await apiClient.get(`${base}/assessments`, {
        params: {
          role_code: roleCode,
          ...(filters.evaluationTier ? { evaluation_tier: filters.evaluationTier } : undefined),
          ...(filters.dateFrom ? { date_from: filters.dateFrom } : undefined),
          ...(filters.dateTo ? { date_to: filters.dateTo } : undefined),
        },
      });
      return response.data;
    },

    async compare(roleCode: string, evaluationIds: string[], lang?: string): Promise<FullComparisonResult> {
      const response = await apiClient.get(`${base}/full`, { params: selection(roleCode, evaluationIds, lang) });
      return response.data;
    },

    async downloadPdf(roleCode: string, evaluationIds: string[], lang?: string): Promise<void> {
      const response = await authClient.get(`${base}/pdf`, {
        params: selection(roleCode, evaluationIds, lang),
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'candidate-comparison.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  };
}
