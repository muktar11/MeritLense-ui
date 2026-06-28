"use client"

import { Button } from '@/components/ui/button';
import { CheckCircle, Ban, Trash2, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BulkActionsBarProps {
  selectedCount: number;
  onActivate: () => void;
  onSuspend: () => void;
  onDelete: () => void;
  onExport: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onActivate,
  onSuspend,
  onDelete,
  onExport,
}: BulkActionsBarProps) {
  const t = useTranslations('dashboard.admin.user_management_page.bulk');

  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
      <p className="font-medium text-primary-900">
        {t('selected')} {selectedCount}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onActivate}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          {t('activate')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onSuspend}
          className="gap-2"
        >
          <Ban className="h-4 w-4" />
          {t('suspend')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onExport}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {t('export')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="gap-2 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          {t('delete')}
        </Button>
      </div>
    </div>
  );
}