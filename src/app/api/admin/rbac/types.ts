// app/api/admin/rbac/types.ts
import { Employer } from '../employers/types';
import { AdminUser } from '../users/types';

export interface UserPermission {
  id: number;
  name: string;
  email: string;
  type: 'admin' | 'employer' | 'team_member';
  role: string;
  permissions: string[];
  system: 'b2b-enterprise' | 'b2b-basic' | 'b2c-admin';
  national_id?: string;
  phone?: string;
  last_active?: string;
}

export interface SystemRole {
  id: string;
  labelKey: string;
  value: string;
}

export interface PermissionMatrix {
  system: string;
  role: string;
  users: UserPermission[];
}