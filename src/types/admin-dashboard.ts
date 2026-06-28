export interface StatCard {
  id: string;
  title: string;
  value: string | number;
  change?: string; 
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
}

export interface BarChartData {
  name: string;
  value: number;
}

export interface LineChartData {
  name: string;
  value: number;
}

export interface PieChartData {
  name: string;
  value: number;
  fill?: string;
}

export interface RecentActivity {
  id: string;
  type: 'evaluation' | 'registration' | 'certificate' | 'subscription';
  description: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'failed';
}

export interface AgencyOverview {
  id: string;
  name: string;
  package: 'Starter' | 'Growth' | 'Business' | 'Enterprise';
  activeEvaluations: number;
  completedEvaluations: number;
  status: 'active' | 'pending' | 'suspended';
}

export interface EvaluationByRole {
  role: string;
  count: number;
  successRate: number;
}

export type CompanyStatus = 'pending' | 'partially_activated' | 'fully_activated' | 'suspended';

export type B2BPackage = 'starter' | 'growth' | 'business' | 'enterprise';

export type ContractStatus = 'signed' | 'pending' | 'rejected';

export type JobRole = 
  | 'housekeeper'
  | 'home_cook'
  | 'childcare_provider'
  | 'elder_companion'
  | 'home_care_assistant'
  | 'room_attendant'
  | 'kitchen_assistant'
  | 'reception_hostess'
  | 'laundry_worker'
  | 'industrial_cleaner'
  | 'maintenance_worker'
  | 'educational_nanny';

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  country: string;
  city: string;
  status: CompanyStatus;
  package: B2BPackage;
  contractStatus: ContractStatus;
  pointsBalance: number;
  monthlyEvaluations: number;
  completedEvaluations: number;
  activeCandidates: number;
  certificatesIssued: number;
  registrationDate: string;
  lastActivity: string;
  logo?: string;
  serviceDescription?: string;
  targetJobRoles: JobRole[];
  website?: string;
  contractDocument?: string;
  licenseDocument?: string;
}

export interface CompanyActivity {
  id: string;
  companyId: string;
  action: string;
  description: string;
  performedBy: string;
  timestamp: string;
}

export interface PackageDetails {
  name: B2BPackage;
  monthlyPrice: number;
  evaluationLimit: number;
  features: string[];
  addOnDiscounts: number; 
}

export interface CompanyFilters {
  search: string;
  status: CompanyStatus | 'all';
  package: B2BPackage | 'all';
  contractStatus: ContractStatus | 'all';
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export interface SortConfig {
  key: keyof Company;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}