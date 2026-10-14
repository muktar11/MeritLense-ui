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
  business_license_verified: boolean;
  verified_at: string | null;
  team_member_count: number;
  stamp_image: string | null;
  logo: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
  legal_name: string;
  company_type: CompanyType | "";
  description: string;
  business_addresses: BusinessAddress[];
}

export const COMPANY_TYPES = [
  "LLC",
  "FREE_ZONE",
  "SOLE_ESTABLISHMENT",
  "CIVIL",
  "BRANCH",
  "PJSC",
  "PRIVATE_JSC",
  "OTHER",
] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export const ADDRESS_TYPES = ["MAIN", "TRADING", "BRANCH"] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];

export interface BusinessAddress {
  id: string;
  label: string;
  address_type: AddressType;
  country: string;
  city: string;
  street: string;
  created_at: string;
  updated_at: string;
}

export type BusinessAddressInput = Pick<BusinessAddress, "label" | "address_type" | "country" | "city" | "street">;

// Fields the owner edits from the Company Information / Contact cards.
export type CompanyProfileUpdate = Partial<
  Pick<CompanyProfile, "name" | "legal_name" | "company_type" | "industry" | "website" | "description" | "phone_number">
>;
