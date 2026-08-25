// app/api/admin/rbac/service.ts
import { apiClient } from '@/app/api/auth/client';
import { UserPermission } from './types';
import adminUserService from '../users/endpoints';
import employerService from '../employers/endpoints';
import { API_BASE_URL } from '@/lib/config/env';

const PAGE_SIZE = 100;
const MAX_PAGES = 20; // safety cap (2000 records) against a runaway loop

class RBACService {
  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }

  // Both admin-user and employer lists are paginated server-side; this page
  // is meant to show everyone, so it needs every page, not just the first.
  private async fetchAllPages<T>(
    fetchPage: (page: number) => Promise<{ count: number; results: T[] }>
  ): Promise<T[]> {
    const all: T[] = [];
    let page = 1;
    while (page <= MAX_PAGES) {
      const response = await fetchPage(page);
      all.push(...response.results);
      if (all.length >= response.count || response.results.length === 0) break;
      page += 1;
    }
    return all;
  }

  async getAllUsersWithPermissions(): Promise<UserPermission[]> {
    this.ensureAuthToken();

    try {
      const [adminResults, employerResults] = await Promise.all([
        this.fetchAllPages(page => adminUserService.getAdminUsers({ page, page_size: PAGE_SIZE })),
        this.fetchAllPages(page => employerService.getEmployers({ page, page_size: PAGE_SIZE }))
      ]);
      const adminResponse = { results: adminResults };
      const employerResponse = { results: employerResults };

      const allUsers: UserPermission[] = [];

      // Add admin users
      adminResponse.results.forEach(admin => {
        allUsers.push({
          id: admin.id,
          name: admin.full_name,
          email: admin.email,
          type: 'admin',
          role: admin.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin',
          permissions: admin.admin_permissions || [],
          // Platform staff (both roles) are listed under "b2b-enterprise" in
          // the role-filter dropdown (see rolesBySystem in page.tsx) - they
          // aren't part of any B2C segment.
          system: 'b2b-enterprise',
          last_active: admin.last_login || undefined
        });
      });

      // Add employers (B2C, B2B users)
      employerResponse.results.forEach(emp => {
        let system: 'b2b-enterprise' | 'b2b-basic' | 'b2c-admin' = 'b2c-admin';
        let role = 'User';
        
        if (emp.role === 'B2B') {
          system = 'b2b-enterprise';
          role = 'Company Admin';
        } else if (emp.role === 'B2B_TEAM_MEMBER') {
          system = 'b2b-basic';
          role = 'Team Member';
        }

        allUsers.push({
          id: emp.id,
          name: emp.full_name,
          email: emp.email,
          type: 'employer',
          role: role,
          permissions: emp.documents_verified ? ['view_candidates'] : [],
          system: system,
          phone: emp.profile_details && 'phone_number' in emp.profile_details ? (emp.profile_details as any).phone_number : undefined,
          last_active: emp.created_at
        });
      });

      return allUsers;
    } catch (error) {
      console.error('Failed to fetch users with permissions:', error);
      return [];
    }
  }

  async getUserPermissions(userId: number, userType: string): Promise<string[]> {
    this.ensureAuthToken();
    
    try {
      if (userType === 'admin') {
        const user = await adminUserService.getAdminUser(userId);
        return user.admin_permissions || [];
      } else {
        const user = await employerService.getEmployer(userId);
        return user.documents_verified ? ['view_candidates'] : [];
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      return [];
    }
  }

  getSystemLabel(system: string): string {
    const labels: Record<string, string> = {
      'b2b-enterprise': 'B2B Enterprise',
      'b2b-basic': 'B2B Basic',
      'b2c-admin': 'B2C Admin'
    };
    return labels[system] || system;
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'Super Admin': 'Super Admin',
      'Admin': 'Admin',
      'Company Admin': 'Company Admin',
      'Team Member': 'Team Member',
      'User': 'User'
    };
    return labels[role] || role;
  }
}

export default new RBACService();