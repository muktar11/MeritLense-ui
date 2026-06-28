'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { CompanyStatus } from '@/types/admin-dashboard';

interface CompanyStatusBadgeProps {
  status: CompanyStatus;
}

export function CompanyStatusBadge({ status }: CompanyStatusBadgeProps) {
  const t = useTranslations('admin_companies.status');

  const variants: Record<CompanyStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    partially_activated: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    fully_activated: 'bg-green-100 text-green-800 hover:bg-green-100',
    suspended: 'bg-red-100 text-red-800 hover:bg-red-100',
  };

  return (
    <Badge className={variants[status]}>
      {t(status)}
    </Badge>
  );
}