'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, Power, Ban, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface BulkActionsBarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onExport: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onApprove,
  onReject,
  onActivate,
  onSuspend,
  onExport,
  onClearSelection,
}: BulkActionsBarProps) {
  const t = useTranslations('admin_companies.bulk_actions');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  if (selectedCount === 0) return null;

  const handleApprove = () => {
    onApprove();
    setShowApproveDialog(false);
  };

  const handleReject = () => {
    onReject();
    setShowRejectDialog(false);
  };

  const handleActivate = () => {
    onActivate();
    setShowActivateDialog(false);
  };

  const handleSuspend = () => {
    onSuspend();
    setShowSuspendDialog(false);
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? 'company' : 'companies'} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowApproveDialog(true)}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {t('approve_selected')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRejectDialog(true)}
          >
            <XCircle className="mr-2 h-4 w-4" />
            {t('reject_selected')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowActivateDialog(true)}
          >
            <Power className="mr-2 h-4 w-4" />
            {t('activate_selected')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSuspendDialog(true)}
          >
            <Ban className="mr-2 h-4 w-4" />
            {t('suspend_selected')}
          </Button>

          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            {t('export_selected')}
          </Button>
        </div>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {selectedCount} companies?</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve the selected companies and activate their accounts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {selectedCount} companies?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reject the selected companies. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Dialog */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate {selectedCount} companies?</AlertDialogTitle>
            <AlertDialogDescription>
              This will activate the selected companies and restore their access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate}>
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {selectedCount} companies?</AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend the selected companies and restrict their access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} className="bg-destructive">
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}