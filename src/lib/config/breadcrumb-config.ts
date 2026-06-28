export const ADMIN_BREADCRUMB_CONFIG: Record<string, string[]> = {
  '/dashboard/admin': ['page_type', 'pages_list.overview'],
  '/dashboard/admin/role': ['page_type', 'pages_list.user_management'],
  '/dashboard/admin/candidates': ['page_type', 'pages_list.candidate_management'],
 '/dashboard/admin/users': ['page_type', 'pages_list.business_management'],
  '/dashboard/admin/system-config': ['page_type', 'pages_list.system_configuration'],
  '/dashboard/admin/logs': ['page_type', 'pages_list.audit_logs'],
  '/dashboard/admin/payment': ['page_type', 'pages_list.api_settings'],
  '/dashboard/admin/billing': ['page_type', 'pages_list.multi_agency_panel'],
   '/dashboard/admin/settings': ['page_type', 'pages_list.settings'],
};

export const BUSINESS_BREADCRUMB_CONFIG: Record<string, string[]> = {
  '/dashboard/business': ['page_type', 'pages_list.overview'],
 
  
  '/dashboard/business/candidate-evaluation': ['page_type', 'pages_list.multi_agency_panel'],

  '/dashboard/business/payment': ['page_type', 'pages_list.audit_logs'],
  '/dashboard/business/company-profile': ['page_type', 'pages_list.system_configuration'],
  
  
  '/dashboard/business/score-management': ['page_type', 'pages_list.business_management'],
 
};



export const INDIVISUAL_BREADCRUMB_CONFIG: Record<string, string[]> = {
  '/dashboard/indivisual': ['page_type', 'pages_list.overview'],
  '/dashboard/indivisual/candidates': ['page_type', 'pages_list.candidate_management'],
  '/dashboard/indivisual/evaluations': ['page_type', 'pages_list.evaluation_setup'],
  '/dashboard/indivisual/assessments': ['page_type', 'pages_list.assessments_monitor'],
  '/dashboard/indivisual/reports': ['page_type', 'pages_list.reports_certificates'],
  '/dashboard/indivisual/profile': ['page_type', 'pages_list.profile_management'],
  '/dashboard/indivisual/payment': ['page_type', 'pages_list.packages_subscription'],
  '/dashboard/indivisual/notifications': ['page_type', 'pages_list.notifications'],
};