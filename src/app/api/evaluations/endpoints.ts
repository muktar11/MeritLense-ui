import { authClient } from '../auth/client';
import {
  Evaluation,
  EvaluationListItem,
  CreateEvaluationData,
  UpdateEvaluationData,
  CompleteEvaluationData,
  RescheduleEvaluationData,
  CancelEvaluationData,
  SessionEvaluationSummary,
  ResponseEvaluationResult,
  CompetencyEvaluationResult
} from './types';
import { API_BASE_URL } from '@/lib/config/env';

class EvaluationService {
  private baseURL = `${API_BASE_URL}/evaluations/evaluations`;

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private ensureAuthToken() {
    const token = this.getToken();
    if (token) {
    }
    return token;
  }

  async getEvaluations(params?: {
    status?: string;
    evaluation_type?: string;
    candidate_id?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<EvaluationListItem[]> {
    this.ensureAuthToken();
    const response = await authClient.get(this.baseURL, { params });
    return response.data;
  }

  async getEvaluation(id: string): Promise<Evaluation> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  async createEvaluation(data: CreateEvaluationData): Promise<Evaluation> {
    this.ensureAuthToken();
    const response = await authClient.post(this.baseURL, data);
    return response.data;
  }

  async updateEvaluation(id: string, data: UpdateEvaluationData): Promise<Evaluation> {
    this.ensureAuthToken();
    const response = await authClient.patch(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  async deleteEvaluation(id: string): Promise<void> {
    this.ensureAuthToken();
    await authClient.delete(`${this.baseURL}/${id}`);
  }

  async completeEvaluation(id: string, data: CompleteEvaluationData): Promise<Evaluation> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}/${id}/complete`, data);
    return response.data;
  }

  async rescheduleEvaluation(id: string, data: RescheduleEvaluationData): Promise<any> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}/${id}/reschedule`, data);
    return response.data;
  }

  async cancelEvaluation(id: string, data: CancelEvaluationData): Promise<any> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}/${id}/cancel`, data);
    return response.data;
  }

  async getUpcomingEvaluations(): Promise<EvaluationListItem[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/upcoming`);
    return response.data;
  }

  async getPastEvaluations(): Promise<EvaluationListItem[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/past`);
    return response.data;
  }

  async getMyEvaluations(): Promise<EvaluationListItem[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/my_evaluations`);
    return response.data;
  }

  async getEvaluationsForCandidate(candidateId: number): Promise<EvaluationListItem[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/for_candidate`, {
      params: { candidate_id: candidateId }
    });
    return response.data;
  }

  async getScoringSummary(evaluationId: string): Promise<SessionEvaluationSummary | null> {
    this.ensureAuthToken();
    try {
      const response = await authClient.get(`${this.baseURL}/${evaluationId}/scoring-summary`);
      return response.data;
    } catch {
      // authClient's response interceptor unwraps errors to the response
      // body (not a standard AxiosError), so there's no reliable status
      // code to branch on here. The only failure mode this endpoint has
      // is "no summary generated yet" (404) — treat any failure as that
      // empty state rather than a hard error.
      return null;
    }
  }

  async getResponseResults(evaluationId: string): Promise<ResponseEvaluationResult[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/${evaluationId}/response-results`);
    return response.data;
  }

  async getCompetencyResults(evaluationId: string): Promise<CompetencyEvaluationResult[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/${evaluationId}/competency-results`);
    return response.data;
  }

  async runScoring(evaluationId: string, ruleSetId?: string): Promise<SessionEvaluationSummary> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}/${evaluationId}/run-scoring`, {
      rule_set_id: ruleSetId,
    });
    return response.data;
  }
}

export default new EvaluationService();