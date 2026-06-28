"use client"

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { UsersTableFilters as FiltersType, UserStatus, PackageTier } from '@/types/b2c-users';
import { useTranslations } from 'next-intl';

interface UsersTableFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  onReset: () => void;
}

export function UsersTableFilters({ filters, onFiltersChange, onReset }: UsersTableFiltersProps) {
  const t = useTranslations('dashboard.admin.user_management_page');

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value as UserStatus | 'all' });
  };

  const handlePackageChange = (value: string) => {
    onFiltersChange({ ...filters, package: value as PackageTier | 'all' });
  };

  const handleDateFromChange = (value: string) => {
    onFiltersChange({ ...filters, dateFrom: value || undefined });
  };

  const handleDateToChange = (value: string) => {
    onFiltersChange({ ...filters, dateTo: value || undefined });
  };

  const hasActiveFilters = 
    filters.search !== '' || 
    filters.status !== 'all' || 
    filters.package !== 'all' ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t('search')}
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Filter */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('statuses.all')}</SelectItem>
            <SelectItem value="active">{t('statuses.active')}</SelectItem>
            <SelectItem value="pending">{t('statuses.pending')}</SelectItem>
            <SelectItem value="suspended">{t('statuses.suspended')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Package Filter */}
        <Select value={filters.package} onValueChange={handlePackageChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('filters.package')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('packages.all')}</SelectItem>
            <SelectItem value="basic">{t('packages.basic')}</SelectItem>
            <SelectItem value="essential">{t('packages.essential')}</SelectItem>
            <SelectItem value="advanced">{t('packages.advanced')}</SelectItem>
            <SelectItem value="premium">{t('packages.premium')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Date From */}
        <Input
          type="date"
          placeholder={t('filters.dateFrom')}
          value={filters.dateFrom || ''}
          onChange={(e) => handleDateFromChange(e.target.value)}
        />

        {/* Date To */}
        <Input
          type="date"
          placeholder={t('filters.dateTo')}
          value={filters.dateTo || ''}
          onChange={(e) => handleDateToChange(e.target.value)}
        />
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            {t('filters.reset')}
          </Button>
        </div>
      )}
    </div>
  );
}