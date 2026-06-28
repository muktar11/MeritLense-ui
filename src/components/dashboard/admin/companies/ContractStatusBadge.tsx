'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { ContractStatus } from '@/types/admin-dashboard';

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const t = useTranslations('admin_companies.contract');

  const variants: Record<ContractStatus, string> = {
    signed: 'bg-green-100 text-green-800 hover:bg-green-100',
    pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    rejected: 'bg-red-100 text-red-800 hover:bg-red-100',
  };

  return (
    <Badge className={variants[status]}>
      {t(status)}
    </Badge>
  );
}