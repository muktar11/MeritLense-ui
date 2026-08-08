import { apiClient } from "@/app/api/auth/client";
import type { LiveCall, LiveCallJoinResult } from "./types";

// Reuses apiClient (from auth/client.ts) rather than a dedicated client -
// its request interceptor attaches a staff Bearer token automatically when
// one exists in localStorage (the evaluator case) and simply attaches
// nothing when it doesn't (the candidate case, an anonymous browser tab
// opened from the emailed session link) - the backend's join/languages
// endpoints tell the two apart the same way every other candidate-token
// endpoint in this app does: staff auth if present, otherwise the token
// passed explicitly in the request body.
class LiveCallService {
  private baseURL = "/live-calls/sessions";

  async join(sessionId: string, candidateToken?: string): Promise<LiveCallJoinResult> {
    const response = await apiClient.post(`${this.baseURL}/${sessionId}/join`, {
      ...(candidateToken ? { token: candidateToken } : {}),
    });
    return response.data;
  }

  async getCall(sessionId: string, candidateToken?: string): Promise<LiveCall> {
    const response = await apiClient.get(`${this.baseURL}/${sessionId}/languages`, {
      params: candidateToken ? { token: candidateToken } : {},
    });
    return response.data;
  }

  async setLanguages(
    sessionId: string,
    data: { input_language: string; output_language: string },
    candidateToken?: string
  ): Promise<LiveCall> {
    const response = await apiClient.put(`${this.baseURL}/${sessionId}/languages`, {
      ...data,
      ...(candidateToken ? { token: candidateToken } : {}),
    });
    return response.data;
  }
}

const liveCallService = new LiveCallService();

export default liveCallService;
