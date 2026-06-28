import { apiClient } from '@/app/api/auth/client';
import {
  TeamMember,
  TeamInvitation,
  InviteTeamMemberData,
  Permission,
  UpdateTeamMemberData,
  AcceptInvitationData
} from './types';
import { API_BASE_URL } from '@/lib/config/env';

class TeamService {
  private baseURL = `${API_BASE_URL}/auth/companies`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}/team`);
    return response.data;
  }

  async getPendingInvitations(): Promise<TeamInvitation[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}/team/invitations`);
    return response.data;
  }

  async inviteTeamMember(data: InviteTeamMemberData): Promise<{ message: string; invitation: TeamInvitation }> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${this.baseURL}/team/invite`, data);
    return response.data;
  }

  async cancelInvitation(invitationId: number): Promise<{ message: string }> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${this.baseURL}/team/invitations/${invitationId}/cancel`);
    return response.data;
  }

  async getTeamMember(memberId: number): Promise<TeamMember> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}/team/members/${memberId}`);
    return response.data;
  }

  async updateTeamMember(memberId: number, data: UpdateTeamMemberData): Promise<TeamMember> {
    this.ensureAuthToken();
    const response = await apiClient.patch(`${this.baseURL}/team/members/${memberId}`, data);
    return response.data;
  }

  async removeTeamMember(memberId: number): Promise<{ message: string }> {
    this.ensureAuthToken();
    const response = await apiClient.delete(`${this.baseURL}/team/members/${memberId}`);
    return response.data;
  }

  async getPermissions(): Promise<Permission[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}/permissions`);
    return response.data.results || response.data;
  }

  async acceptInvitation(data: AcceptInvitationData): Promise<{ message: string; email: string }> {
    const response = await apiClient.post(`${this.baseURL}/team/accept-invitation`, data);
    return response.data;
  }
}

export default new TeamService();