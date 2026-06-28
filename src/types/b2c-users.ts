export type UserStatus = 'active' | 'pending' | 'suspended';
export type PackageTier = 'basic' | 'essential' | 'advanced' | 'premium';

export interface B2CUser {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  country: string;
  city: string;
  preferredLanguage: 'en' | 'ar';
  packageTier: PackageTier;
  accountStatus: UserStatus;
  registrationDate: string;
  lastLoginDate?: string;
  pointsBalance: number;
  evaluationsUsed: number;
  evaluationsTotal: number;
  contractAccepted: boolean;
  contractAcceptedDate?: string;
}

export interface B2CUserEvaluation {
  id: string;
  candidateName: string;
  jobRole: string;
  evaluationType: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdDate: string;
  completedDate?: string;
  pointsConsumed: number;
}

export interface B2CUserActivity {
  id: string;
  type: 'login' | 'evaluation_created' | 'package_upgraded' | 'points_added';
  description: string;
  timestamp: string;
}

export interface UsersTableFilters {
  search: string;
  status: UserStatus | 'all';
  package: PackageTier | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export interface PackageDetails {
  tier: PackageTier;
  price: number;
  candidateLimit: number;
  features: string[];
}

export const PACKAGE_CONFIGS: Record<PackageTier, PackageDetails> = {
  basic: {
    tier: 'basic',
    price: 50,
    candidateLimit: 3,
    features: ['Identity Verification', 'Basic Medical Check', 'Basic Q&A', 'Multilingual Certificate']
  },
  essential: {
    tier: 'essential',
    price: 80,
    candidateLimit: 5,
    features: ['All Basic features', 'PDF Summary Report', 'Employer Summary Report']
  },
  advanced: {
    tier: 'advanced',
    price: 150,
    candidateLimit: 10,
    features: ['All Essential features', 'Skills & Behavioral Assessment', 'Job Role Matching', 'Dashboard Analytics']
  },
  premium: {
    tier: 'premium',
    price: 250,
    candidateLimit: 20,
    features: ['All Advanced features', 'Cultural Adaptability', 'Emotional Resilience', 'Video Introduction']
  }
};