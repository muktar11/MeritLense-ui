'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CompanyFilters } from '@/types/admin-dashboard';

interface CompanyTableFiltersProps {
  filters: CompanyFilters;
  onFiltersChange: (filters: CompanyFilters) => void;
  onReset: () => void;
}

export function CompanyTableFilters({
  filters,
  onFiltersChange,
  onReset,
}: CompanyTableFiltersProps) {
  const t = useTranslations('admin_companies');

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value as CompanyFilters['status'],
    });
  };

  const handlePackageChange = (value: string) => {
    onFiltersChange({
      ...filters,
      package: value as CompanyFilters['package'],
    });
  };

  const handleContractStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      contractStatus: value as CompanyFilters['contractStatus'],
    });
  };

  const handleDateFromChange = (value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: { ...filters.dateRange, from: value },
    });
  };

  const handleDateToChange = (value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: { ...filters.dateRange, to: value },
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('filters.search_placeholder')}
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status Filter */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all_statuses')}</SelectItem>
            <SelectItem value="pending">{t('status.pending')}</SelectItem>
            <SelectItem value="partially_activated">
              {t('status.partially_activated')}
            </SelectItem>
            <SelectItem value="fully_activated">
              {t('status.fully_activated')}
            </SelectItem>
            <SelectItem value="suspended">{t('status.suspended')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Package Filter */}
        <Select value={filters.package} onValueChange={handlePackageChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('filters.package')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all_packages')}</SelectItem>
            <SelectItem value="starter">{t('package.starter')}</SelectItem>
            <SelectItem value="growth">{t('package.growth')}</SelectItem>
            <SelectItem value="business">{t('package.business')}</SelectItem>
            <SelectItem value="enterprise">{t('package.enterprise')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Contract Status Filter */}
        <Select
          value={filters.contractStatus}
          onValueChange={handleContractStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('filters.contract_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('filters.all_contract_statuses')}
            </SelectItem>
            <SelectItem value="signed">{t('contract.signed')}</SelectItem>
            <SelectItem value="pending">{t('contract.pending')}</SelectItem>
            <SelectItem value="rejected">{t('contract.rejected')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Button */}
        <Button variant="outline" onClick={onReset}>
          {t('filters.reset')}
        </Button>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            {t('filters.date_from')}
          </label>
          <Input
            type="date"
            value={filters.dateRange.from || ''}
            onChange={(e) => handleDateFromChange(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">
            {t('filters.date_to')}
          </label>
          <Input
            type="date"
            value={filters.dateRange.to || ''}
            onChange={(e) => handleDateToChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}