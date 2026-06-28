// app/api/admin/users/types.ts
export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'SUPERADMIN' | 'ADMIN';
  is_active: boolean;
  is_verified: boolean;
  is_staff: boolean;
  admin_permissions: string[];
  profile_type: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface CreateAdminUserData {
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
  confirm_password?: string;
  permissions?: string[];
  department?: string;
  phone_number?: string;
}

export interface UpdateAdminUserData {
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  admin_permissions?: string[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdminPermissions {
  key: string;
  label: string;
}

// Admin permissions from backend
export const ADMIN_PERMISSIONS: AdminPermissions[] = [
  { key: 'can_manage_users', label: 'Manage Users' },
  { key: 'can_verify_companies', label: 'Company Verification' },
  { key: 'can_verify_documents', label: 'Document Verification' },
  { key: 'can_access_financial', label: 'Financial Access' },
  { key: 'can_access_reports', label: 'Reports Access' },
];