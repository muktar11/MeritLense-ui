"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PackageRequest, PackageRequestApprovePayload, PackageRequestBillingType } from "@/app/api/admin/package-requests/types";

interface ReviewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PackageRequest | null;
  onApprove: (id: string, data: PackageRequestApprovePayload) => Promise<void>;
  onDeny: (id: string, reason: string) => Promise<void>;
}

export function ReviewRequestModal({ isOpen, onClose, request, onApprove, onDeny }: ReviewRequestModalProps) {
  const t = useTranslations("dashboard.admin.packageRequests");
  const [action, setAction] = useState<"approve" | "deny" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [slotGrant, setSlotGrant] = useState("");
  const [pointsGrant, setPointsGrant] = useState("");
  const [unitAmount, setUnitAmount] = useState("");
  const [billingType, setBillingType] = useState<PackageRequestBillingType | "">("");
  const [currency, setCurrency] = useState("eur");
  const [rolloverAllowed, setRolloverAllowed] = useState(false);
  const [addendumReference, setAddendumReference] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [denyReason, setDenyReason] = useState("");

  if (!request) return null;

  const resetAndClose = () => {
    setAction(null);
    setError("");
    setSlotGrant("");
    setPointsGrant("");
    setUnitAmount("");
    setBillingType("");
    setCurrency("eur");
    setRolloverAllowed(false);
    setAddendumReference("");
    setApproveNote("");
    setDenyReason("");
    onClose();
  };

  const startApprove = () => {
    setSlotGrant(request.requested_slot_grant != null ? String(request.requested_slot_grant) : "");
    setPointsGrant(request.requested_points_grant != null ? String(request.requested_points_grant) : "");
    setAction("approve");
    setError("");
  };

  const handleApprove = async () => {
    if (!unitAmount.trim()) {
      setError(t("modal.approveSection.unitAmount"));
      return;
    }
    if (!billingType) {
      setError(t("modal.approveSection.billingTypeRequired"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onApprove(request.id, {
        slot_grant: slotGrant.trim() ? Number(slotGrant) : null,
        points_grant: pointsGrant.trim() ? Number(pointsGrant) : null,
        unit_amount: unitAmount,
        billing_type: billingType,
        currency,
        rollover_allowed: rolloverAllowed,
        addendum_reference: addendumReference,
        decision_reason: approveNote,
      });
      resetAndClose();
    } catch {
      setError(t("errors.decisionFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!denyReason.trim()) {
      setError(t("modal.denySection.reasonRequired"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onDeny(request.id, denyReason);
      resetAndClose();
    } catch {
      setError(t("errors.decisionFailed"));
    } finally {
      setLoading(false);
    }
  };

  const isPending = request.status === "PENDING";

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={resetAndClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    {t("modal.title")}
                  </Dialog.Title>
                  <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                    <p className="font-medium text-gray-900">{request.company_name}</p>
                    <p className="text-sm text-gray-600">
                      {t("modal.requestedByLabel")}: {request.requested_by_name} ({request.requested_by_email})
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("modal.dealTypeLabel")}: {request.deal_type_display}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("modal.requestedSlotsLabel")}: {request.requested_slot_grant ?? t("notSpecified")}
                      {"  ·  "}
                      {t("modal.requestedPointsLabel")}: {request.requested_points_grant ?? t("notSpecified")}
                    </p>
                    <div className="pt-2">
                      <p className="text-xs font-medium text-gray-500">{t("modal.messageLabel")}</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.message || t("modal.noMessage")}</p>
                    </div>
                  </div>

                  {!isPending && (
                    <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
                      {t("modal.alreadyDecided", {
                        status: t(`status.${request.status}`),
                        date: request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : "",
                      })}
                      {request.decision_reason && (
                        <p className="mt-1">{t("modal.decisionReasonNote", { reason: request.decision_reason })}</p>
                      )}
                    </div>
                  )}

                  {request.status === "APPROVED" && request.stripe_payment_link_url && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm space-y-2">
                      <p className="font-medium">{t("modal.paymentLink.awaitingPayment")}</p>
                      <div className="flex items-center gap-2">
                        <Input readOnly value={request.stripe_payment_link_url} className="text-xs bg-white" />
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(request.stripe_payment_link_url)}
                          className="shrink-0 px-3 py-2 text-xs font-medium border border-amber-300 rounded-lg hover:bg-amber-100"
                        >
                          {t("modal.paymentLink.copy")}
                        </button>
                      </div>
                    </div>
                  )}

                  {request.status === "PAID" && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
                      {t("modal.paymentLink.paidConfirmed", {
                        date: request.paid_at ? new Date(request.paid_at).toLocaleDateString() : "",
                      })}
                    </div>
                  )}

                  {isPending && !action && (
                    <div className="flex justify-end gap-3 pt-2 border-t">
                      <button onClick={resetAndClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                        {t("modal.cancel")}
                      </button>
                      <button
                        onClick={() => { setAction("deny"); setError(""); }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        {t("modal.deny")}
                      </button>
                      <button
                        onClick={startApprove}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        {t("modal.approve")}
                      </button>
                    </div>
                  )}

                  {action === "approve" && (
                    <div className="space-y-3 pt-2 border-t">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t("modal.approveSection.heading")}</p>
                        <p className="text-xs text-gray-500">{t("modal.approveSection.note")}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t("modal.approveSection.slotGrant")}</label>
                          <Input type="number" min={0} value={slotGrant} onChange={(e) => setSlotGrant(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t("modal.approveSection.pointsGrant")}</label>
                          <Input type="number" min={0} value={pointsGrant} onChange={(e) => setPointsGrant(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t("modal.approveSection.unitAmount")} *</label>
                          <Input type="number" min={0} step="0.01" value={unitAmount} onChange={(e) => setUnitAmount(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t("modal.approveSection.currency")}</label>
                          <Input value={currency} onChange={(e) => setCurrency(e.target.value.toLowerCase())} maxLength={3} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t("modal.approveSection.billingType")} *</label>
                        <Select value={billingType} onValueChange={(v) => setBillingType(v as PackageRequestBillingType)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("modal.approveSection.billingTypePlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ONE_TIME">{t("modal.approveSection.billingTypeOneTime")}</SelectItem>
                            <SelectItem value="RECURRING">{t("modal.approveSection.billingTypeRecurring")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t("modal.approveSection.addendumReference")}</label>
                        <Input value={addendumReference} onChange={(e) => setAddendumReference(e.target.value)} placeholder={t("modal.approveSection.addendumPlaceholder")} />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <Checkbox checked={rolloverAllowed} onCheckedChange={(v) => setRolloverAllowed(Boolean(v))} />
                        {t("modal.approveSection.rolloverAllowed")}
                      </label>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t("modal.approveSection.decisionNote")}</label>
                        <Textarea rows={2} value={approveNote} onChange={(e) => setApproveNote(e.target.value)} placeholder={t("modal.approveSection.decisionNotePlaceholder")} />
                      </div>

                      {error && <p className="text-sm text-red-600">{error}</p>}

                      <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setAction(null)} disabled={loading} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                          {t("modal.back")}
                        </button>
                        <button
                          onClick={handleApprove}
                          disabled={loading}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                        >
                          {loading ? <><Loader2 size={16} className="animate-spin" />{t("modal.processing")}</> : t("modal.confirmApprove")}
                        </button>
                      </div>
                    </div>
                  )}

                  {action === "deny" && (
                    <div className="space-y-3 pt-2 border-t">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("modal.denySection.heading")} *</label>
                        <Textarea rows={3} value={denyReason} onChange={(e) => setDenyReason(e.target.value)} placeholder={t("modal.denySection.reasonPlaceholder")} />
                      </div>

                      {error && <p className="text-sm text-red-600">{error}</p>}

                      <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setAction(null)} disabled={loading} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                          {t("modal.back")}
                        </button>
                        <button
                          onClick={handleDeny}
                          disabled={loading || !denyReason.trim()}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                        >
                          {loading ? <><Loader2 size={16} className="animate-spin" />{t("modal.processing")}</> : t("modal.confirmDeny")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
