import { apiClient } from '../auth/client';
import {
  Agreement,
  AgreementType,
  AgreementVersions,
  AcceptAgreementRequest,
  SignInitiateRequest,
  SignInitiateResponse,
  SignConfirmRequest,
  ResendRequest,
  AgreementPreview,
  AgreementVerification,
  AuditLogEntry,
} from './types';
import { API_BASE_URL } from '@/lib/config/env';

class AgreementService {
  private baseURL = `${API_BASE_URL}/agreements/`;

  async getVersions(): Promise<AgreementVersions> {
    const response = await apiClient.get(`${this.baseURL}versions`);
    return response.data;
  }

  async getStatus(): Promise<Agreement[]> {
    const response = await apiClient.get(`${this.baseURL}status`);
    return response.data;
  }

  async getPreview(agreementType: AgreementType): Promise<AgreementPreview> {
    const response = await apiClient.get(`${this.baseURL}preview/${agreementType}`);
    return response.data;
  }

  async accept(data: AcceptAgreementRequest): Promise<Agreement> {
    const response = await apiClient.post(`${this.baseURL}accept`, data);
    return response.data;
  }

  async signInitiate(data: SignInitiateRequest): Promise<SignInitiateResponse> {
    const response = await apiClient.post(`${this.baseURL}sign/initiate`, data);
    return response.data;
  }

  async resendCode(data: ResendRequest): Promise<SignInitiateResponse> {
    const response = await apiClient.post(`${this.baseURL}sign/resend`, data);
    return response.data;
  }

  async signConfirm(data: SignConfirmRequest): Promise<Agreement[]> {
    const response = await apiClient.post(`${this.baseURL}sign/confirm`, data);
    return response.data;
  }

  async getDownloadUrl(agreementId: string): Promise<{ url: string }> {
    const response = await apiClient.get(`${this.baseURL}download/${agreementId}`);
    return response.data;
  }

  async verifyAgreement(contractId: string): Promise<AgreementVerification> {
    const response = await apiClient.get(`${this.baseURL}verify/${contractId}`);
    return response.data;
  }

  async getAuditTrail(agreementId: string): Promise<AuditLogEntry[]> {
    const response = await apiClient.get(`${this.baseURL}audit/${agreementId}`);
    return response.data;
  }
}

export default new AgreementService();
