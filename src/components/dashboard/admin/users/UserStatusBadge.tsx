import { Badge } from '@/components/ui/badge';
import { UserStatus } from '@/types/b2c-users';
import { useTranslations } from 'next-intl';

interface UserStatusBadgeProps {
  status: UserStatus;
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const t = useTranslations('dashboard.admin.user_management_page.statuses');

  const getStatusStyles = () => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 hover:bg-green-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
      case 'suspended':
        return 'bg-red-100 text-red-700 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
    }
  };

  return (
    <Badge className={getStatusStyles()}>
      {t(status)}
    </Badge>
  );
}