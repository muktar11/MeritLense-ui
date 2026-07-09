export interface CompanyProfile {
  id: string;
  name: string;
  registration_number: string;
  company_size: string;
  industry: string;
  phone_number: string;
  country: string;
  city: string;
  address: string;
  website: string;
  admin_user: number;
  admin_user_email: string;
  admin_name: string | null;
  is_verified: boolean;
  verified_at: string | null;
  team_member_count: number;
  stamp_image: string | null;
  created_at: string;
  updated_at: string;
}
