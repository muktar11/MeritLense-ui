import { apiClient, authClient } from '../auth/client';
import type { EvaluationReport, ReportPayload, ReportVerification } from './types';
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

  async verifyReport(reportNumber: string): Promise<ReportVerification> {
    const response = await apiClient.get(`${this.reportsURL}/verify/${reportNumber}`);
    return response.data;
  }

  async downloadPdf(reportId: string, filename?: string): Promise<void> {
    const response = await authClient.get(`${this.reportsURL}/${reportId}/export-pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/pdf',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || this.filenameFromDisposition(response.headers['content-disposition']) || `${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  private filenameFromDisposition(contentDisposition?: string): string | null {
    if (!contentDisposition) return null;

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const asciiMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    return asciiMatch?.[1] ?? null;
  }
}

export default new ReportService();
