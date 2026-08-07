import { interviewSessionClient } from './client';
import type {
  InterviewSessionPublic,
  CurrentQuestionResult,
  QuestionAudioArtifact,
  SubmitTextResponseData,
  SubmitResponseResult,
  CandidateResponseUpload,
  PrecheckStatus,
  IdentityVerificationResult,
  IntegrityEventResult,
  VerbalConfirmationResult,
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

  // Candidate self-serve start, for a session that hasn't been started yet
  // (status "CREATED") - the only path this happens today is a scheduled
  // interview sitting past its scheduled_start_at with nobody having
  // started it yet, since staff normally create+start a session together.
  // The backend rejects this with a 400 if called before scheduled_start_at,
  // which callers should treat as "not due yet" rather than a hard error.
  async startSession(sessionId: string, token: string): Promise<InterviewSessionPublic> {
    const response = await interviewSessionClient.post(`/${sessionId}/start/`, { token });
    return response.data;
  }

  async getQuestionAudio(sessionId: string, token: string, languageCode?: string): Promise<QuestionAudioArtifact> {
    const response = await interviewSessionClient.post(`/${sessionId}/question-audio/`, {
      token,
      ...(languageCode ? { language_code: languageCode } : {}),
    });
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
    responseId: string,
    languageCode?: string
  ): Promise<CandidateResponseUpload> {
    const response = await interviewSessionClient.post(`/${sessionId}/transcribe-response/`, {
      token,
      response_id: responseId,
      ...(languageCode ? { language_code: languageCode } : {}),
    });
    return response.data;
  }

  async completeSession(sessionId: string, token: string): Promise<InterviewSessionPublic> {
    const response = await interviewSessionClient.post(`/${sessionId}/complete/`, { token });
    return response.data;
  }

  async getPrecheckStatus(sessionId: string, token: string): Promise<PrecheckStatus> {
    const response = await interviewSessionClient.get(`/${sessionId}/prechecks/status/`, { params: { token } });
    return response.data;
  }

  async captureConsent(sessionId: string, token: string, signatoryName: string): Promise<PrecheckStatus> {
    const response = await interviewSessionClient.post(`/${sessionId}/prechecks/consent/`, {
      token,
      signatory_name: signatoryName,
    });
    return response.data;
  }

  async acknowledgePrivacy(sessionId: string, token: string): Promise<PrecheckStatus> {
    const response = await interviewSessionClient.post(`/${sessionId}/prechecks/privacy-acknowledgement/`, {
      token,
      metadata: { source: 'candidate-precheck' },
    });
    return response.data;
  }

  async completeDeviceCheck(
    sessionId: string,
    token: string,
    passedOrMetadata: boolean | Record<string, unknown>,
    metadata: Record<string, unknown> = {}
  ): Promise<PrecheckStatus> {
    const passed = typeof passedOrMetadata === 'boolean' ? passedOrMetadata : true;
    const resolvedMetadata = typeof passedOrMetadata === 'boolean' ? metadata : passedOrMetadata;
    const response = await interviewSessionClient.post(`/${sessionId}/prechecks/device-check/`, {
      token,
      passed,
      ...(Object.keys(resolvedMetadata).length ? { metadata: resolvedMetadata } : {}),
    });
    return response.data;
  }

  async submitVerbalConfirmation(
    sessionId: string,
    token: string,
    recordingBlob: Blob
  ): Promise<VerbalConfirmationResult> {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('recording_file', recordingBlob, 'verbal-confirmation.webm');
    const response = await interviewSessionClient.post(
      `/${sessionId}/prechecks/verbal-confirmation/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  async getReferenceImage(sessionId: string, token: string): Promise<Blob> {
    const response = await interviewSessionClient.get(`/${sessionId}/prechecks/reference-image/`, {
      params: { token },
      responseType: 'blob',
    });
    return response.data;
  }

  async submitIdentityVerification(
    sessionId: string,
    token: string,
    data: {
      selfieBlob: Blob;
      faceMatchScore: number;
      singleFaceDetected: boolean;
      livenessPassed: boolean;
    }
  ): Promise<IdentityVerificationResult> {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('selfie_image_file', data.selfieBlob, 'selfie.jpg');
    formData.append('face_match_score', data.faceMatchScore.toFixed(2));
    formData.append('single_face_detected', String(data.singleFaceDetected));
    formData.append('liveness_passed', String(data.livenessPassed));

    const response = await interviewSessionClient.post(`/${sessionId}/prechecks/identity-verify/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async logIntegrityEvent(
    sessionId: string,
    token: string,
    data: {
      eventType?: string;
      severity?: string;
      singleFaceDetected: boolean;
      faceCount: number;
    }
  ): Promise<IntegrityEventResult> {
    const formData = new FormData();
    formData.append('token', token);
    if (data.eventType) formData.append('event_type', data.eventType);
    formData.append('severity', data.severity ?? 'INFO');
    formData.append('single_face_detected', String(data.singleFaceDetected));
    formData.append('face_count', String(data.faceCount));

    const response = await interviewSessionClient.post(`/${sessionId}/integrity-events/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

export default new InterviewSessionClientService();
