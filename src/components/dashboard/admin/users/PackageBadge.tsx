import { Badge } from '@/components/ui/badge';
import { PackageTier } from '@/types/b2c-users';
import { useTranslations } from 'next-intl';

interface PackageBadgeProps {
  package: PackageTier;
}

export function PackageBadge({ package: packageTier }: PackageBadgeProps) {
  const t = useTranslations('dashboard.admin.user_management_page.packages');

  const getPackageStyles = () => {
    switch (packageTier) {
      case 'basic':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
      case 'essential':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
      case 'advanced':
        return 'bg-primary-100 text-primary-700 hover:bg-primary-100';
      case 'premium':
        return 'bg-secondary-100 text-secondary-700 hover:bg-secondary-100';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
    }
  };

  return (
    <Badge className={getPackageStyles()}>
      {t(packageTier)}
    </Badge>
  );
}