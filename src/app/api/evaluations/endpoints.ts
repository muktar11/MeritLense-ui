import { apiClient, authClient } from '../auth/client';
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
  CompetencyEvaluationResult,
  ScoringRuleSet,
  ScoringRuleSetPayload,
  CandidateScoreSummary,
  EvaluatorRating,
  EvaluatorRatingPayload,
  ScorecardDraftData,
  CertificateVerification,
  PendingReviewItem,
  HumanReviewPayload,
  HumanReviewResult,
} from './types';
import { API_BASE_URL } from '@/lib/config/env';

export interface AssessmentResultsData {
  certificate_eligibility: { eligible: boolean; reason: string };
  can_finalize: boolean;
  can_manage_exceptions?: boolean;
  evaluation: Evaluation;
  transcript: { question: string; responses: { original: string; language: string; translation: string; translation_language: string }[] }[];
  // Scheduled assessments: the live call's own turns, oldest first.
  conversation?: import('../live-calls/types').LiveCallSavedSegment[];
  reports: import('../reports/types').EvaluationReport[];
  corrections: { created_at: string; reason: string; recorded_by: string | null }[];
}

class EvaluationService {
  private baseURL = `${API_BASE_URL}/evaluations/evaluations`;
  private ruleSetsURL = `${API_BASE_URL}/evaluations/rule-sets`;

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

  async getAssessmentResults(id: string): Promise<AssessmentResultsData> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/${id}/assessment-results`);
    return response.data;
  }

  async finalizeScheduledAssessment(id: string): Promise<Evaluation> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}/${id}/finalize-scheduled`, {});
    return response.data;
  }

  // Admin reviewer queue: results held from employers until reviewed.
  async getPendingReview(): Promise<PendingReviewItem[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/pending-review`);
    return response.data;
  }

  async submitHumanReview(evaluationId: string, data: HumanReviewPayload): Promise<HumanReviewResult> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}/${evaluationId}/human-review`, data);
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

  async rescheduleEvaluation(id: string, data: RescheduleEvaluationData): Promise<Evaluation> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}/${id}/reschedule`, data);
    return response.data;
  }

  async cancelEvaluation(id: string, data: CancelEvaluationData): Promise<Evaluation> {
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
    } catch (error) {
      // authClient's response interceptor unwraps errors to the response
      // body (not a standard AxiosError), so there's no reliable status
      // code to branch on here. A result held for human review says so
      // explicitly - let callers show that instead of "not scored yet".
      if ((error as { code?: string })?.code === 'awaiting_human_review') throw error;
      // Otherwise the only failure mode is "no summary generated yet"
      // (404) - treat it as that empty state rather than a hard error.
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

  async getScheduledOutputs(evaluationId: string): Promise<import("./types").ScheduledOutputs> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/${evaluationId}/scheduled-outputs`);
    return response.data;
  }

  async recordScheduledException(evaluationId: string, operation: string, notes: string): Promise<void> {
    this.ensureAuthToken();
    await authClient.post(`${this.baseURL}/${evaluationId}/scheduled-outputs`, { operation, notes });
  }

  async getEvaluatorRating(evaluationId: string): Promise<EvaluatorRating | null> {
    this.ensureAuthToken();
    try {
      const response = await authClient.get(`${this.baseURL}/${evaluationId}/evaluator-rating`);
      return response.data;
    } catch {
      // Same contract as getScoringSummary above - no reliable status code
      // to branch on, and the only failure mode is "not rated yet".
      return null;
    }
  }

  async submitEvaluatorRating(evaluationId: string, data: EvaluatorRatingPayload): Promise<EvaluatorRating> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}/${evaluationId}/evaluator-rating`, data);
    return response.data;
  }

  async getScorecardDraft(evaluationId: string): Promise<{ data: ScorecardDraftData; updated_at: string | null }> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}/${evaluationId}/evaluator-rating/draft`);
    return response.data;
  }

  async saveScorecardDraft(evaluationId: string, data: ScorecardDraftData): Promise<{ data: ScorecardDraftData; updated_at: string | null }> {
    this.ensureAuthToken();
    const response = await authClient.put(`${this.baseURL}/${evaluationId}/evaluator-rating/draft`, { data });
    return response.data;
  }

  async runScoring(evaluationId: string, ruleSetId?: string): Promise<SessionEvaluationSummary> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}/${evaluationId}/run-scoring`, {
      rule_set_id: ruleSetId,
    });
    return response.data;
  }

  async getRuleSets(): Promise<ScoringRuleSet[]> {
    this.ensureAuthToken();
    const response = await authClient.get(this.ruleSetsURL);
    return response.data;
  }

  async getRuleSet(id: string): Promise<ScoringRuleSet> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.ruleSetsURL}/${id}`);
    return response.data;
  }

  async createRuleSet(data: ScoringRuleSetPayload): Promise<ScoringRuleSet> {
    this.ensureAuthToken();
    const response = await authClient.post(this.ruleSetsURL, data);
    return response.data;
  }

  async updateRuleSet(id: string, data: ScoringRuleSetPayload): Promise<ScoringRuleSet> {
    this.ensureAuthToken();
    const response = await authClient.patch(`${this.ruleSetsURL}/${id}`, data);
    return response.data;
  }

  async deleteRuleSet(id: string): Promise<void> {
    this.ensureAuthToken();
    await authClient.delete(`${this.ruleSetsURL}/${id}`);
  }

  async getCandidateScores(): Promise<CandidateScoreSummary[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${API_BASE_URL}/evaluations/candidate-scores`);
    return response.data;
  }

  async verifyCertificate(certificateId: string): Promise<CertificateVerification> {
    const response = await apiClient.get(`${API_BASE_URL}/evaluations/certificates/verify/${certificateId}`);
    return response.data;
  }
}

const evaluationService = new EvaluationService();

export default evaluationService;
