// app/dashboard/admin/audit/components/verify-documents-modal.tsx
"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, CheckCircle, XCircle, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import type { PendingVerificationUser } from "@/app/api/admin/audit/types";

interface VerifyDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: PendingVerificationUser | null;
  onVerify: (userId: string, notes: string) => Promise<void>;
  onReject: (userId: string, reason: string, notes: string) => Promise<void>;
}

export function VerifyDocumentsModal({ 
  isOpen, 
  onClose, 
  user, 
  onVerify, 
  onReject 
}: VerifyDocumentsModalProps) {
  const t = useTranslations("dashboard.admin.auditLog");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'verify' | 'reject' | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  if (!user) return null;

  const handleVerify = async () => {
    setLoading(true);
    setAction('verify');
    try {
      await onVerify(user.id, notes);
      onClose();
    } catch (error) {
      console.error('Failed to verify documents:', error);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    
    setLoading(true);
    setAction('reject');
    try {
      await onReject(user.id, rejectionReason, notes);
      onClose();
    } catch (error) {
      console.error('Failed to reject documents:', error);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const isB2C = user.role === 'B2C';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    {t("verifyDocuments.title")}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* User Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Role: {user.role}</p>
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Documents</h4>
                    <div className="space-y-2">
                      {isB2C ? (
                        <>
                          {user.documents.id_document && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">ID Document</span>
                              <a 
                                href={user.documents.id_document} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <Eye size={16} />
                                View
                              </a>
                            </div>
                          )}
                          {user.documents.resume_document && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Resume</span>
                              <a 
                                href={user.documents.resume_document} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <Eye size={16} />
                                View
                              </a>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {user.documents.registration_certificate && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Registration Certificate</span>
                              <a 
                                href={user.documents.registration_certificate} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <Eye size={16} />
                                View
                              </a>
                            </div>
                          )}
                          {user.documents.resachetified_license && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Resachetified License</span>
                              <a 
                                href={user.documents.resachetified_license} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <Eye size={16} />
                                View
                              </a>
                            </div>
                          )}
                          {user.documents.tax_id_document && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Tax ID Document</span>
                              <a 
                                href={user.documents.tax_id_document} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <Eye size={16} />
                                View
                              </a>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Verification Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Notes
                    </label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this verification..."
                      rows={3}
                    />
                  </div>

                  {/* Rejection Reason (shown only when rejecting) */}
                  {action === 'reject' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rejection Reason *
                      </label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why the documents are being rejected..."
                        rows={2}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    
                    {!action && (
                      <>
                        <button
                          onClick={() => setAction('reject')}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                        <button
                          onClick={handleVerify}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Verify
                        </button>
                      </>
                    )}

                    {action === 'reject' && (
                      <>
                        <button
                          onClick={() => setAction(null)}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                          disabled={loading}
                        >
                          Back
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={loading || !rejectionReason.trim()}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Confirm Rejection'
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}