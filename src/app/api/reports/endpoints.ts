import { authClient } from '../auth/client';
import type { EvaluationReport, ReportPayload } from './types';
import { API_BASE_URL } from '@/lib/config/env';

class ReportService {
  private evaluationsURL = `${API_BASE_URL}/evaluations/evaluations`;
  private reportsURL = `${API_BASE_URL}/evaluations/reports`;

  async getLatestReport(evaluationId: string): Promise<EvaluationReport | null> {
    try {
      const response = await authClient.get(`${this.evaluationsURL}/${evaluationId}/report`);
      return response.data;
    } catch {
      // authClient's response interceptor unwraps errors to the response
      // body (not a standard AxiosError), so there's no reliable status
      // code to branch on here. The only failure mode this endpoint has
      // is "no report generated yet" (404) — treat any failure as that
      // empty state rather than a hard error.
      return null;
    }
  }

  async generateReport(evaluationId: string): Promise<EvaluationReport> {
    const response = await authClient.post(`${this.evaluationsURL}/${evaluationId}/generate-report`, {});
    return response.data;
  }

  async regenerateReport(reportId: string): Promise<EvaluationReport> {
    const response = await authClient.post(`${this.reportsURL}/${reportId}/regenerate`, {});
    return response.data;
  }

  async exportPayload(reportId: string): Promise<ReportPayload> {
    const response = await authClient.get(`${this.reportsURL}/${reportId}/export-payload`);
    return response.data;
  }
}

export default new ReportService();
