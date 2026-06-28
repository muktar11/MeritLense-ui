// app/api/team/types.ts
export interface TeamMember {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  company: number;
  company_name: string;
  job_title: string;
  department: string;
  phone_number: string;
  permissions: string[];
  permissions_display: string[];
  invitation_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamInvitation {
  id: number;
  company: number;
  company_name: string;
  invited_by: {
    id: number;
    email: string;
    full_name: string;
  };
  email: string;
  first_name: string;
  last_name: string;
  job_title: string;
  permissions: string[];
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface InviteTeamMemberData {
  email: string;
  first_name: string;
  last_name: string;
  job_title: string;
  phone_number : string;
  permissions?: string[];
}

export interface AcceptInvitationData {
  token: string;
  password: string;
  confirm_password: string;
}

export interface Permission {
  key: string;
  label: string;
}

export interface UpdateTeamMemberData {
  job_title?: string;
  permissions?: string[];
  is_active?: boolean;
}