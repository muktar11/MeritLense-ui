// app/api/admin/system/types.ts
export interface SystemStats {
  user_stats: {
    total_users: number;
    total_admins: number;
    total_b2c: number;
    total_b2b: number;
  };
  verification_stats: {
    pending_email: number;
    pending_documents: number;
    approved_documents: number;
    rejected_documents: number;
  };
  recent_users: RecentUser[];
}

export interface RecentUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  created_at: string;
  is_verified: boolean;
  documents_verified: boolean;
}

export interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: string;
  role_type: string;
  status: 'active' | 'inactive' | 'pending';
  last_active?: string;
  created_at: string;
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  threshold?: number;
  current_value?: number;
  enabled: boolean;
}

// System alert configurations
export const SYSTEM_ALERTS = [
  {
    id: 'failed_login_threshold',
    messageKey: 'alerts.failedLoginThreshold',
    type: 'warning' as const,
    defaultEnabled: true
  },
  {
    id: 'new_user_created',
    messageKey: 'alerts.newUserCreated',
    type: 'info' as const,
    defaultEnabled: true
  },
  {
    id: 'db_connection_error',
    messageKey: 'alerts.dbConnectionError',
    type: 'error' as const,
    defaultEnabled: true
  },
  {
    id: 'system_upgrade_completed',
    messageKey: 'alerts.systemUpgradeCompleted',
    type: 'success' as const,
    defaultEnabled: true
  },
  {
    id: 'high_failed_logins',
    messageKey: 'alerts.highFailedLogins',
    type: 'warning' as const,
    defaultEnabled: false
  },
  {
    id: 'document_verification_backlog',
    messageKey: 'alerts.documentVerificationBacklog',
    type: 'warning' as const,
    defaultEnabled: true
  }
];