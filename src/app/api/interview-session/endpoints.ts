import { interviewSessionClient } from './client';
import type {
  InterviewSessionPublic,
  CurrentQuestionResult,
  QuestionAudioArtifact,
  SubmitTextResponseData,
  SubmitResponseResult,
  CandidateResponseUpload,
} from './types';

class InterviewSessionClientService {
  async getSession(sessionId: string, token: string): Promise<InterviewSessionPublic> {
    const response = await interviewSessionClient.get(`/${sessionId}/`, { params: { token } });
    return response.data;
  }

  async getCurrentQuestion(sessionId: string, token: string): Promise<CurrentQuestionResult> {
    const response = await interviewSessionClient.get(`/${sessionId}/current-question/`, { params: { token } });
    return response.data;
  }

  async getQuestionAudio(sessionId: string, token: string): Promise<QuestionAudioArtifact> {
    const response = await interviewSessionClient.post(`/${sessionId}/question-audio/`, { token });
    return response.data;
  }

  async submitTextResponse(
    sessionId: string,
    token: string,
    data: SubmitTextResponseData
  ): Promise<SubmitResponseResult> {
    const response = await interviewSessionClient.post(`/${sessionId}/submit-response/`, {
      ...data,
      token,
      response_type: 'TEXT',
    });
    return response.data;
  }

  async uploadResponseAudio(
    sessionId: string,
    token: string,
    questionId: string,
    audioBlob: Blob,
    durationSeconds: number
  ): Promise<CandidateResponseUpload> {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('question_id', questionId);
    formData.append('duration_seconds', String(durationSeconds));
    formData.append('audio_file', audioBlob, 'answer.webm');

    const response = await interviewSessionClient.post(`/${sessionId}/upload-response-audio/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async transcribeResponse(
    sessionId: string,
    token: string,
    responseId: string
  ): Promise<CandidateResponseUpload> {
    const response = await interviewSessionClient.post(`/${sessionId}/transcribe-response/`, {
      token,
      response_id: responseId,
    });
    return response.data;
  }

  async completeSession(sessionId: string, token: string): Promise<InterviewSessionPublic> {
    const response = await interviewSessionClient.post(`/${sessionId}/complete/`, { token });
    return response.data;
  }
}

export default new InterviewSessionClientService();
