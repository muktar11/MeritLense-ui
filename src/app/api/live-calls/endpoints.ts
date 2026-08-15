import { apiClient } from "@/app/api/auth/client";
import { liveCallClient } from "./client";
import type { LiveCall, LiveCallJoinResult } from "./types";

// The evaluator joins as a normal authenticated staff user (apiClient,
// carrying whatever staff Bearer token is in localStorage). The candidate
// joins anonymously via their per-session token and must use a client
// with no auth interceptor (liveCallClient) - see client.ts for why:
// apiClient would silently attach a stray staff token if one exists in
// the same browser, and the backend prioritizes staff auth over the
// token, putting the candidate in as the evaluator.
class LiveCallService {
  private baseURL = "/live-calls/sessions";

  async join(sessionId: string, candidateToken?: string): Promise<LiveCallJoinResult> {
    const client = candidateToken ? liveCallClient : apiClient;
    const response = await client.post(`${this.baseURL}/${sessionId}/join`, {
      ...(candidateToken ? { token: candidateToken } : {}),
    });
    return response.data;
  }

  async getCall(sessionId: string, candidateToken?: string): Promise<LiveCall> {
    const client = candidateToken ? liveCallClient : apiClient;
    const response = await client.get(`${this.baseURL}/${sessionId}/languages`, {
      params: candidateToken ? { token: candidateToken } : {},
    });
    return response.data;
  }

  async setLanguages(
    sessionId: string,
    data: { input_language: string; output_language: string },
    candidateToken?: string
  ): Promise<LiveCall> {
    const client = candidateToken ? liveCallClient : apiClient;
    const response = await client.put(`${this.baseURL}/${sessionId}/languages`, {
      ...data,
      ...(candidateToken ? { token: candidateToken } : {}),
    });
    return response.data;
  }
}

const liveCallService = new LiveCallService();

export default liveCallService;
