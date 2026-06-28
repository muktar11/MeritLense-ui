import { authClient } from './client';
import {
  ScoreSet,
  CandidateScore,
  ScoreCategory,
  CreateScoreSetData,
  UpdateScoreSetData,
  JobRoleScoreArea
} from '@/app/api/scores/types';
import { API_BASE_URL } from '@/lib/config/env';

class ScoreService {
  private baseURL = `${API_BASE_URL}/scores`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      return true;
    }
    return false;
  }

  async getScoreSets(params?: {
    candidate_id?: string;
    evaluation_id?: string;
  }): Promise<ScoreSet[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}sets`, { params });
    return response.data;
  }

  async getLatestScoreSetForCandidate(candidateId: string): Promise<ScoreSet | null> {
    try {
      this.ensureAuthToken();
      const response = await authClient.get(`${this.baseURL}sets`, {
        params: { candidate_id: candidateId }
      });
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Failed to fetch latest score set:', error);
      return null;
    }
  }

  async getScoreSet(id: string): Promise<ScoreSet> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}sets/${id}`);
    return response.data;
  }

  async createScoreSet(data: CreateScoreSetData): Promise<ScoreSet> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}sets`, data);
    return response.data;
  }

  async updateScoreSet(id: string, data: UpdateScoreSetData): Promise<ScoreSet> {
    this.ensureAuthToken();
    const response = await authClient.patch(`${this.baseURL}sets/${id}`, data);
    return response.data;
  }

  async deleteScoreSet(id: string): Promise<void> {
    this.ensureAuthToken();
    await authClient.delete(`${this.baseURL}sets/${id}`);
  }

  async getScoreSetScores(id: string): Promise<CandidateScore[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}sets/${id}/scores`);
    return response.data;
  }

  async recalculateScoreSet(id: string): Promise<{ average_score: number }> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}sets/${id}/recalculate`);
    return response.data;
  }

  async getScores(params?: {
    candidate_id?: string;
    evaluation_id?: string;
    area?: string;
  }): Promise<CandidateScore[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}scores`, { params });
    return response.data;
  }

  async getScore(id: string): Promise<CandidateScore> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}scores/${id}`);
    return response.data;
  }

  async createScore(data: Partial<CandidateScore>): Promise<CandidateScore> {
    this.ensureAuthToken();
    const response = await authClient.post(`${this.baseURL}scores`, data);
    return response.data;
  }

  async updateScore(id: string, data: Partial<CandidateScore>): Promise<CandidateScore> {
    this.ensureAuthToken();
    const response = await authClient.patch(`${this.baseURL}scores/${id}`, data);
    return response.data;
  }

  async deleteScore(id: string): Promise<void> {
    this.ensureAuthToken();
    await authClient.delete(`${this.baseURL}scores/${id}`);
  }

  async getCategories(): Promise<ScoreCategory[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}categories`);
    return response.data;
  }

  async getCategory(code: string): Promise<ScoreCategory> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}categories/${code}`);
    return response.data;
  }

  async getJobRoleScoreAreas(): Promise<JobRoleScoreArea[]> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}job-role-areas`);
    return response.data;
  }

  async getScoreAreasByRole(roleCode: string): Promise<JobRoleScoreArea> {
    this.ensureAuthToken();
    const response = await authClient.get(`${this.baseURL}job-role-areas/by-role/${roleCode}`);
    return response.data;
  }

  async getAllLatestScores(candidates: Array<{ id: string }>): Promise<Record<string, Record<string, number>>> {
    const scoresMap: Record<string, Record<string, number>> = {};
    
    const promises = candidates.map(async (candidate) => {
      const scoreSet = await this.getLatestScoreSetForCandidate(candidate.id);
      if (scoreSet) {
        scoresMap[candidate.id] = scoreSet.scores_dict;
      }
    });

    await Promise.all(promises);
    return scoresMap;
  }
}

export default new ScoreService();