// app/api/admin/system/service.ts
import { apiClient } from '@/app/api/auth/client';
import { SystemStats, SystemUser, SYSTEM_ALERTS } from './types';
import adminUserService from '../users/endpoints';
import employerService from '../employers/endpoints';
import { API_BASE_URL } from '@/lib/config/env';

class SystemService {
  private baseURL = `${API_BASE_URL}/auth/admin/dashboard`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }

  async getSystemStats(): Promise<SystemStats> {
    this.ensureAuthToken();
    try {
      const response = await apiClient.get(`${this.baseURL}/stats`);
      console.log('System stats response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      // Return default values if API fails
      return {
        user_stats: {
          total_users: 0,
          total_admins: 0,
          total_b2c: 0,
          total_b2b: 0
        },
        verification_stats: {
          pending_email: 0,
          pending_documents: 0,
          approved_documents: 0,
          rejected_documents: 0
        },
        recent_users: []
      };
    }
  }

  async getAllSystemUsers(): Promise<SystemUser[]> {
    this.ensureAuthToken();
    
    try {
      const [adminResponse, employerResponse] = await Promise.all([
        adminUserService.getAdminUsers({ page_size: 100 }),
        employerService.getEmployers({ page_size: 100 })
      ]);

      const allUsers: SystemUser[] = [];

      // Add admin users
      if (adminResponse?.results) {
        adminResponse.results.forEach(admin => {
          allUsers.push({
            id: admin.id,
            name: admin.full_name || `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'Unknown',
            email: admin.email || '',
            role: admin.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin',
            role_type: admin.role,
            status: admin.is_active ? 'active' : 'inactive',
            last_active: admin.last_login || undefined,
            created_at: admin.created_at || new Date().toISOString()
          });
        });
      }

      // Add employers
      if (employerResponse?.results) {
        employerResponse.results.forEach(emp => {
          let role = 'User';
          if (emp.role === 'B2B') {
            role = 'Company Admin';
          } else if (emp.role === 'B2B_TEAM_MEMBER') {
            role = 'Team Member';
          }

          allUsers.push({
            id: emp.id,
            name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown',
            email: emp.email || '',
            role: role,
            role_type: emp.role,
            status: emp.is_active ? 'active' : 'inactive',
            last_active: emp.created_at,
            created_at: emp.created_at || new Date().toISOString()
          });
        });
      }

      return allUsers;
    } catch (error) {
      console.error('Failed to fetch system users:', error);
      return [];
    }
  }

  // Get alert configurations
  getAlertConfigurations() {
    return SYSTEM_ALERTS;
  }

  // Safe number formatting with null/undefined checks
  formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined) {
      return '0';
    }
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Format date safely
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }
}

export default new SystemService();