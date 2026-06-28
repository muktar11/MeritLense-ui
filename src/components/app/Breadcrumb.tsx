'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  ADMIN_BREADCRUMB_CONFIG,
  BUSINESS_BREADCRUMB_CONFIG,
  INDIVISUAL_BREADCRUMB_CONFIG,
} from '@/lib/config/breadcrumb-config';
import { useTranslations } from 'next-intl';

export function Breadcrumb() {
  const pathname = usePathname();

  // Remove locale from pathname if it exists
  const cleanPathname = pathname.replace(/^\/[a-z]{2}\//, '/');

  // Detect user type from pathname
  const userType = cleanPathname.includes('/dashboard/admin')
    ? 'admin'
    : cleanPathname.includes('/dashboard/business')
    ? 'business'
    : cleanPathname.includes('/dashboard/indivisual')
    ? 'indivisual'
    : 'logout';

  // Select appropriate config based on user type
  const breadcrumbConfig =
    userType === 'admin'
      ? ADMIN_BREADCRUMB_CONFIG
      : userType === 'business'
      ? BUSINESS_BREADCRUMB_CONFIG
      : INDIVISUAL_BREADCRUMB_CONFIG;
      

  const breadcrumbs = breadcrumbConfig[cleanPathname] || ['page_type'];

const t = useTranslations(`dashboard.${userType}`);

  return (
    <div className="flex items-center gap-2 text-sm">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
          <span
            className={
              index === breadcrumbs.length - 1
                ? 'font-semibold text-secondary-800'
                : 'text-gray-500'
            }
          >
            {t(`${item}`)}
          </span>
        </div>
      ))}
    </div>
  );
}