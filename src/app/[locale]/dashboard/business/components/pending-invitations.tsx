"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TeamInvitation } from "@/app/api/team/types";
import { format } from "date-fns";

interface PendingInvitationsProps {
  invitations: TeamInvitation[];
  onCancel: (invitationId: number) => Promise<void>;
}

export function PendingInvitations({ invitations, onCancel }: PendingInvitationsProps) {
  const t = useTranslations("dashboard.business.company-profile.team");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleCancel = async (invitationId: number) => {
    setCancellingId(invitationId);
    try {
      await onCancel(invitationId);
    } finally {
      setCancellingId(null);
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Mail className="w-4 h-4" />
        {t('pendingInvitations')} ({invitations.length})
      </h4>
      <div className="space-y-2">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {invitation.first_name} {invitation.last_name}
              </p>
              <p className="text-xs text-gray-600">{invitation.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {t('expires')}: {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancel(invitation.id)}
              disabled={cancellingId === invitation.id}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {cancellingId === invitation.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}