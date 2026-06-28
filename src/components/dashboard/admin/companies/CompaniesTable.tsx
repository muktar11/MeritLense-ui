'use client';

import { useTranslations } from 'next-intl';
import {
  ArrowUpDown,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Power,
  Ban,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Company, SortConfig } from '@/types/admin-dashboard';
import { CompanyStatusBadge } from './CompanyStatusBadge';
import { PackageBadge } from './PackageBadge';
import { ContractStatusBadge } from './ContractStatusBadge';

interface CompaniesTableProps {
  companies: Company[];
  selectedCompanies: string[];
  onSelectCompany: (id: string) => void;
  onSelectAll: () => void;
  onSort: (key: keyof Company) => void;
  sortConfig: SortConfig | null;
  onViewDetails: (company: Company) => void;
  onApprove?: (company: Company) => void;
  onReject?: (company: Company) => void;
  onActivate?: (company: Company) => void;
  onSuspend?: (company: Company) => void;
}

export function CompaniesTable({
  companies,
  selectedCompanies,
  onSelectCompany,
  onSelectAll,
  onSort,
  sortConfig,
  onViewDetails,
  onApprove,
  onReject,
  onActivate,
  onSuspend,
}: CompaniesTableProps) {
  const t = useTranslations('admin_companies');

  const allSelected =
    companies.length > 0 && selectedCompanies.length === companies.length;
  const someSelected = selectedCompanies.length > 0 && !allSelected;

  const getSortIcon = (key: keyof Company) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (companies.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-sm text-muted-foreground">{t('empty.title')}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('empty.description')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label={t('table.select_all')}
                className={someSelected ? 'data-[state=checked]:bg-primary' : ''}
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => onSort('name')}
                className="h-8 p-0 hover:bg-transparent"
              >
                {t('table.company_name')}
                {getSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => onSort('email')}
                className="h-8 p-0 hover:bg-transparent"
              >
                {t('table.email')}
                {getSortIcon('email')}
              </Button>
            </TableHead>
            <TableHead>{t('table.license')}</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => onSort('status')}
                className="h-8 p-0 hover:bg-transparent"
              >
                {t('table.status')}
                {getSortIcon('status')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => onSort('package')}
                className="h-8 p-0 hover:bg-transparent"
              >
                {t('table.package')}
                {getSortIcon('package')}
              </Button>
            </TableHead>
            <TableHead>{t('table.contract')}</TableHead>
            <TableHead className="text-right">{t('table.points')}</TableHead>
            <TableHead className="text-right">{t('table.candidates')}</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => onSort('registrationDate')}
                className="h-8 p-0 hover:bg-transparent"
              >
                {t('table.registered')}
                {getSortIcon('registrationDate')}
              </Button>
            </TableHead>
            <TableHead className="w-12">{t('table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell>
                <Checkbox
                  checked={selectedCompanies.includes(company.id)}
                  onCheckedChange={() => onSelectCompany(company.id)}
                  aria-label={`Select ${company.name}`}
                />
              </TableCell>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {company.email}
              </TableCell>
              <TableCell className="text-sm">{company.licenseNumber}</TableCell>
              <TableCell>
                <CompanyStatusBadge status={company.status} />
              </TableCell>
              <TableCell>
                <PackageBadge package={company.package} />
              </TableCell>
              <TableCell>
                <ContractStatusBadge status={company.contractStatus} />
              </TableCell>
              <TableCell className="text-right font-medium">
                {company.pointsBalance.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {company.activeCandidates}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(company.registrationDate)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(company)}>
                      <Eye className="mr-2 h-4 w-4" />
                      {t('actions.view_details')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {company.contractStatus === 'pending' && onApprove && (
                      <DropdownMenuItem onClick={() => onApprove(company)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t('actions.approve')}
                      </DropdownMenuItem>
                    )}
                    {company.contractStatus === 'pending' && onReject && (
                      <DropdownMenuItem onClick={() => onReject(company)}>
                        <XCircle className="mr-2 h-4 w-4" />
                        {t('actions.reject')}
                      </DropdownMenuItem>
                    )}
                    {company.status === 'suspended' && onActivate && (
                      <DropdownMenuItem onClick={() => onActivate(company)}>
                        <Power className="mr-2 h-4 w-4" />
                        {t('actions.activate')}
                      </DropdownMenuItem>
                    )}
                    {company.status === 'fully_activated' && onSuspend && (
                      <DropdownMenuItem onClick={() => onSuspend(company)}>
                        <Ban className="mr-2 h-4 w-4" />
                        {t('actions.suspend')}
                      </DropdownMenuItem>
                    )}
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