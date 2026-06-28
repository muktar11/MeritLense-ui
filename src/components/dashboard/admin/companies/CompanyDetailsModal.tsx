'use client';

import { useTranslations } from 'next-intl';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Download,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  Power,
  Ban,
  Key,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Company, CompanyActivity } from '@/types/admin-dashboard';
import { CompanyStatusBadge } from './CompanyStatusBadge';
import { PackageBadge } from './PackageBadge';
import { ContractStatusBadge } from './ContractStatusBadge';

interface CompanyDetailsModalProps {
  company: Company | null;
  activityLog: CompanyActivity[];
  open: boolean;
  onClose: () => void;
  onApprove?: (company: Company) => void;
  onReject?: (company: Company) => void;
  onActivate?: (company: Company) => void;
  onSuspend?: (company: Company) => void;
  onModifyPackage?: (company: Company) => void;
  onResetPassword?: (company: Company) => void;
}

export function CompanyDetailsModal({
  company,
  activityLog,
  open,
  onClose,
  onApprove,
  onReject,
  onActivate,
  onSuspend,
  onModifyPackage,
  onResetPassword,
}: CompanyDetailsModalProps) {
  const t = useTranslations('admin_companies.details');
  const tJobRoles = useTranslations('admin_companies.job_roles');

  if (!company) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPackagePrice = (pkg: string) => {
    const prices = {
      starter: '€1,000',
      growth: '€2,000',
      business: '€3,500',
      enterprise: 'Custom',
    };
    return prices[pkg as keyof typeof prices] || 'N/A';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {company.name} - {company.licenseNumber}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Company Logo */}
            {company.logo && (
              <div className="flex justify-center">
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              </div>
            )}

            {/* Company Information */}
            <div>
              <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t('company_info')}
              </h3>
              <div className="grid gap-3 rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('name')}</p>
                    <p className="text-sm font-medium">{company.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('license_number')}
                    </p>
                    <p className="text-sm font-medium">{company.licenseNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {t('email')}
                    </p>
                    <p className="text-sm">{company.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {t('phone')}
                    </p>
                    <p className="text-sm">{company.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {t('country')} / {t('city')}
                    </p>
                    <p className="text-sm">
                      {company.country}, {company.city}
                    </p>
                  </div>
                  {company.website && (
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {t('website')}
                      </p>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                </div>

                {company.serviceDescription && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('service_description')}
                    </p>
                    <p className="text-sm">{company.serviceDescription}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Status */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">{t('account_status')}</h3>
              <div className="flex gap-3">
                <CompanyStatusBadge status={company.status} />
                <ContractStatusBadge status={company.contractStatus} />
              </div>
            </div>

            <Separator />

            {/* Package & Subscription */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">
                {t('package_details')}
              </h3>
              <div className="grid gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('current_package')}
                    </p>
                    <div className="mt-1">
                      <PackageBadge package={company.package} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {t('monthly_price')}
                    </p>
                    <p className="text-sm font-semibold">
                      {getPackagePrice(company.package)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('points_balance')}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {company.pointsBalance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('monthly_evaluations')}
                    </p>
                    <p className="text-sm">
                      {company.completedEvaluations} / {company.monthlyEvaluations}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('active_candidates')}
                    </p>
                    <p className="text-sm font-medium">
                      {company.activeCandidates}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('certificates_issued')}
                    </p>
                    <p className="text-sm font-medium">
                      {company.certificatesIssued}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contract Information */}
            <div>
              <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('contract_info')}
              </h3>
              <div className="grid gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('contract_status')}
                    </p>
                    <div className="mt-1">
                      <ContractStatusBadge status={company.contractStatus} />
                    </div>
                  </div>
                </div>

                {company.contractDocument && (
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{t('view_contract')}</span>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      {t('download')}
                    </Button>
                  </div>
                )}

                {company.licenseDocument && (
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{t('view_license')}</span>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      {t('download')}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Job Roles */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">{t('job_roles')}</h3>
              <div className="flex flex-wrap gap-2">
                {company.targetJobRoles.map((role) => (
                  <Badge key={role} variant="outline">
                    {tJobRoles(role)}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Activity Log */}
            <div>
              <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t('activity_log')}
              </h3>
              <div className="space-y-2 rounded-lg border p-4">
                {activityLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No activity recorded
                  </p>
                ) : (
                  activityLog.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-2 last:pb-0"
                    >
                      <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(activity.timestamp)} • {activity.performedBy}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Separator />

            {/* Registration Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('registration_date')}
                </p>
                <p className="font-medium">{formatDate(company.registrationDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('last_activity')}
                </p>
                <p className="font-medium">{formatDate(company.lastActivity)}</p>
              </div>
            </div>

            {/* Admin Actions */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">{t('admin_actions')}</h3>
              <div className="flex flex-wrap gap-2">
                {company.contractStatus === 'pending' && onApprove && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onApprove(company)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('approve_account')}
                  </Button>
                )}
                {company.contractStatus === 'pending' && onReject && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onReject(company)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {t('reject_account')}
                  </Button>
                )}
                {company.status === 'suspended' && onActivate && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onActivate(company)}
                  >
                    <Power className="mr-2 h-4 w-4" />
                    {t('activate_account')}
                  </Button>
                )}
                {company.status === 'fully_activated' && onSuspend && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onSuspend(company)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {t('suspend_account')}
                  </Button>
                )}
                {onModifyPackage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onModifyPackage(company)}
                  >
                    {t('modify_package')}
                  </Button>
                )}
                {onResetPassword && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResetPassword(company)}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    {t('reset_password')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}