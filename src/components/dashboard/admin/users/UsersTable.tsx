"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Eye, Edit, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { B2CUser } from '@/types/b2c-users';
import { UserStatusBadge } from './UserStatusBadge';
import { PackageBadge } from './PackageBadge';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';

interface UsersTableProps {
  users: B2CUser[];
  selectedUsers: string[];
  onSelectUser: (userId: string) => void;
  onSelectAll: () => void;
  onViewUser: (user: B2CUser) => void;
  onEditUser: (user: B2CUser) => void;
  onSuspendUser: (user: B2CUser) => void;
  onActivateUser: (user: B2CUser) => void;
  onDeleteUser: (user: B2CUser) => void;
}

export function UsersTable({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onViewUser,
  onEditUser,
  onSuspendUser,
  onActivateUser,
  onDeleteUser,
}: UsersTableProps) {
  const t = useTranslations('dashboard.admin.user_management_page');

  const isAllSelected = users.length > 0 && selectedUsers.length === users.length;
  const isSomeSelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('table.noData')}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                aria-label={t('bulk.selectAll')}
                className={isSomeSelected ? 'data-[state=checked]:bg-gray-400' : ''}
              />
            </TableHead>
            <TableHead>{t('table.fullName')}</TableHead>
            <TableHead>{t('table.email')}</TableHead>
            <TableHead>{t('table.package')}</TableHead>
            <TableHead>{t('table.registrationDate')}</TableHead>
            <TableHead>{t('table.status')}</TableHead>
            <TableHead className="text-center">{t('table.evaluations')}</TableHead>
            <TableHead className="text-center">{t('table.pointsBalance')}</TableHead>
            <TableHead className="text-right">{t('table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => onSelectUser(user.id)}
                  aria-label={`Select ${user.fullName}`}
                />
              </TableCell>
              <TableCell className="font-medium">{user.fullName}</TableCell>
              <TableCell className="text-gray-600">{user.email}</TableCell>
              <TableCell>
                <PackageBadge package={user.packageTier} />
              </TableCell>
              <TableCell className="text-gray-600">
                {formatDate(user.registrationDate)}
              </TableCell>
              <TableCell>
                <UserStatusBadge status={user.accountStatus} />
              </TableCell>
              <TableCell className="text-center">
                <span className="text-sm">
                  {user.evaluationsUsed} / {user.evaluationsTotal}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="font-medium text-primary-600">
                  {user.pointsBalance}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{t('table.actions')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewUser(user)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {t('actions.view')}
                    </DropdownMenuItem>
                    {user.accountStatus === 'active' ? (
                      <DropdownMenuItem onClick={() => onSuspendUser(user)}>
                        <Ban className="h-4 w-4 mr-2" />
                        {t('actions.suspend')}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onActivateUser(user)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('actions.activate')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => onDeleteUser(user)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}