
export const SCORE_AREAS = {
  COMMUNICATION: "COMMUNICATION",
  RELIABILITY: "RELIABILITY",
  PUNCTUALITY: "PUNCTUALITY",
  PROFESSIONALISM: "PROFESSIONALISM",
  TEAMWORK: "TEAMWORK",
  
  CLEANING: "CLEANING",
  MAINTENANCE: "MAINTENANCE",
  ORGANIZATION: "ORGANIZATION",
  ATTENTION_TO_DETAIL: "ATTENTION_TO_DETAIL",
  
  COMPANIONSHIP: "COMPANIONSHIP",
  PATIENCE: "PATIENCE",
  MEDICATION_MANAGEMENT: "MEDICATION_MANAGEMENT",
  FIRST_AID: "FIRST_AID",
  ELDERLY_CARE: "ELDERLY_CARE",
  CHILD_CARE: "CHILD_CARE",
  
  SAFE_DRIVING: "SAFE_DRIVING",
  ROUTE_PLANNING: "ROUTE_PLANNING",
  VEHICLE_MAINTENANCE: "VEHICLE_MAINTENANCE",
  NAVIGATION: "NAVIGATION",
  
  FOOD_PREPARATION: "FOOD_PREPARATION",
  KITCHEN_HYGIENE: "KITCHEN_HYGIENE",
  MENU_PLANNING: "MENU_PLANNING",
  BUDGETING: "BUDGETING",
  DIETARY_KNOWLEDGE: "DIETARY_KNOWLEDGE",
  
  TECHNICAL_SKILL: "TECHNICAL_SKILL",
  PROBLEM_SOLVING: "PROBLEM_SOLVING",
} as const;

export const SCORE_AREA_LABELS: Record<string, string> = {
  [SCORE_AREAS.COMMUNICATION]: "Communication",
  [SCORE_AREAS.RELIABILITY]: "Reliability",
  [SCORE_AREAS.PUNCTUALITY]: "Punctuality",
  [SCORE_AREAS.PROFESSIONALISM]: "Professionalism",
  [SCORE_AREAS.TEAMWORK]: "Teamwork",
  
  [SCORE_AREAS.CLEANING]: "Cleaning",
  [SCORE_AREAS.MAINTENANCE]: "Maintenance",
  [SCORE_AREAS.ORGANIZATION]: "Organization",
  [SCORE_AREAS.ATTENTION_TO_DETAIL]: "Attention to Detail",
  
  [SCORE_AREAS.COMPANIONSHIP]: "Companionship",
  [SCORE_AREAS.PATIENCE]: "Patience",
  [SCORE_AREAS.MEDICATION_MANAGEMENT]: "Medication Management",
  [SCORE_AREAS.FIRST_AID]: "First Aid",
  [SCORE_AREAS.ELDERLY_CARE]: "Elderly Care",
  [SCORE_AREAS.CHILD_CARE]: "Child Care",
  
  [SCORE_AREAS.SAFE_DRIVING]: "Safe Driving",
  [SCORE_AREAS.ROUTE_PLANNING]: "Route Planning",
  [SCORE_AREAS.VEHICLE_MAINTENANCE]: "Vehicle Maintenance",
  [SCORE_AREAS.NAVIGATION]: "Navigation",
  
  [SCORE_AREAS.FOOD_PREPARATION]: "Food Preparation",
  [SCORE_AREAS.KITCHEN_HYGIENE]: "Kitchen Hygiene",
  [SCORE_AREAS.MENU_PLANNING]: "Menu Planning",
  [SCORE_AREAS.BUDGETING]: "Budgeting",
  [SCORE_AREAS.DIETARY_KNOWLEDGE]: "Dietary Knowledge",
  
  [SCORE_AREAS.TECHNICAL_SKILL]: "Technical Skill",
  [SCORE_AREAS.PROBLEM_SOLVING]: "Problem Solving",
};

export type ScoreArea = typeof SCORE_AREAS[keyof typeof SCORE_AREAS];

export const JOB_ROLE_DISPLAY_NAMES: Record<string, string> = {
  "HK": "Housekeeper",
  "EC": "Elder Companion",
  "NA": "Nursing Assistant",
  "DR": "Driver",
  "KA": "Kitchen Assistant",
  "MW": "Maintenance Worker",
  "OT": "Other",
};

export const JOB_ROLE_SCORE_AREAS: Record<string, ScoreArea[]> = {
  "HK": [
    SCORE_AREAS.CLEANING,
    SCORE_AREAS.MAINTENANCE,
    SCORE_AREAS.ORGANIZATION,
    SCORE_AREAS.ATTENTION_TO_DETAIL,
    SCORE_AREAS.RELIABILITY,
    SCORE_AREAS.PUNCTUALITY,
    SCORE_AREAS.COMMUNICATION,
  ],
  
  "EC": [
    SCORE_AREAS.COMPANIONSHIP,
    SCORE_AREAS.PATIENCE,
    SCORE_AREAS.MEDICATION_MANAGEMENT,
    SCORE_AREAS.FIRST_AID,
    SCORE_AREAS.ELDERLY_CARE,
    SCORE_AREAS.COMMUNICATION,
    SCORE_AREAS.RELIABILITY,
  ],
  
  "NA": [
    SCORE_AREAS.FIRST_AID,
    SCORE_AREAS.MEDICATION_MANAGEMENT,
    SCORE_AREAS.ELDERLY_CARE,
    SCORE_AREAS.PATIENCE,
    SCORE_AREAS.COMMUNICATION,
    SCORE_AREAS.PROFESSIONALISM,
    SCORE_AREAS.TEAMWORK,
  ],
  
  "DR": [
    SCORE_AREAS.SAFE_DRIVING,
    SCORE_AREAS.ROUTE_PLANNING,
    SCORE_AREAS.VEHICLE_MAINTENANCE,
    SCORE_AREAS.NAVIGATION,
    SCORE_AREAS.PUNCTUALITY,
    SCORE_AREAS.RELIABILITY,
    SCORE_AREAS.PROFESSIONALISM,
  ],
  
  "KA": [
    SCORE_AREAS.FOOD_PREPARATION,
    SCORE_AREAS.KITCHEN_HYGIENE,
    SCORE_AREAS.MENU_PLANNING,
    SCORE_AREAS.CLEANING,
    SCORE_AREAS.BUDGETING,
    SCORE_AREAS.DIETARY_KNOWLEDGE,
    SCORE_AREAS.ORGANIZATION,
    SCORE_AREAS.TEAMWORK,
  ],
  
  "MW": [
    SCORE_AREAS.MAINTENANCE,
    SCORE_AREAS.ORGANIZATION,
    SCORE_AREAS.ATTENTION_TO_DETAIL,
    SCORE_AREAS.RELIABILITY,
    SCORE_AREAS.PUNCTUALITY,
    SCORE_AREAS.COMMUNICATION,
  ],
  
  "OT": [
    SCORE_AREAS.COMMUNICATION,
    SCORE_AREAS.RELIABILITY,
    SCORE_AREAS.PUNCTUALITY,
    SCORE_AREAS.PROFESSIONALISM,
    SCORE_AREAS.TEAMWORK,
  ],
};

export interface ScoreCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  applicable_job_roles: string;
  applicable_roles_list: string[];
  created_at: string;
  updated_at: string;
}

export interface CandidateScore {
  id: string;
  candidate: string;
  candidate_name: string;
  evaluation?: string;
  area: ScoreArea;
  area_display: string;
  score: number;
  notes: string;
  created_by: string;
  created_by_name: string;
  company?: string;
  created_at: string;
  updated_at: string;
}

export interface ScoreSet {
  id: string;
  candidate: string;
  candidate_details?: any;
  evaluation?: string;
  evaluation_details?: any;
  average_score: string | number | null;
  scores: CandidateScore[];
  scores_dict: Record<ScoreArea, number>;
  notes: string;
  created_by: string;
  created_by_name: string;
  company?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScoreSetData {
  candidate_id: string;
  evaluation_id?: string | null;
  scores: Record<ScoreArea, number>;
  notes?: string;
}

export interface UpdateScoreSetData {
  scores?: Record<ScoreArea, number>;
  notes?: string;
}

export interface JobRoleScoreArea {
  job_role: string;
  job_role_display: string;
  areas: Array<{
    code: ScoreArea;
    name: string;
  }>;
}