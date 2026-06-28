'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { B2BPackage } from '@/types/admin-dashboard';

interface PackageBadgeProps {
  package: B2BPackage;
}

export function PackageBadge({ package: pkg }: PackageBadgeProps) {
  const t = useTranslations('admin_companies.package');

  const variants: Record<B2BPackage, string> = {
    starter: 'bg-slate-100 text-slate-800 hover:bg-slate-100',
    growth: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    business: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    enterprise: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  };

  return (
    <Badge className={variants[pkg]}>
      {t(pkg)}
    </Badge>
  );
}