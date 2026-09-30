"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Loader2, Send, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import packageRequestService from "@/app/api/payments/package-requests/endpoints";
import type { PackageRequestDealType } from "@/app/api/payments/package-requests/types";

interface RequestPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function RequestPackageModal({ isOpen, onClose, onSubmitted }: RequestPackageModalProps) {
  const t = useTranslations("dashboard.indivisual.payment.requestPackage");
  const [dealType, setDealType] = useState<PackageRequestDealType>("STARTER");
  const [requestedSlots, setRequestedSlots] = useState("");
  const [requestedPoints, setRequestedPoints] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const resetAndClose = () => {
    setDealType("STARTER");
    setRequestedSlots("");
    setRequestedPoints("");
    setMessage("");
    setError("");
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await packageRequestService.submit({
        deal_type: dealType,
        requested_slot_grant: requestedSlots.trim() ? Number(requestedSlots) : null,
        requested_points_grant: requestedPoints.trim() ? Number(requestedPoints) : null,
        message,
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setError(t("errors.submitFailed"));
    } finally {
      setLoading(false);
    }
  };

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    {t("title")}
                  </Dialog.Title>
                  <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                {submitted ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-900 font-medium">{t("successTitle")}</p>
                    <p className="text-sm text-gray-600 mt-1">{t("successMessage")}</p>
                    <button
                      onClick={resetAndClose}
                      className="mt-5 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      {t("close")}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">{t("description")}</p>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("dealTypeLabel")}</label>
                      <Select value={dealType} onValueChange={(v) => setDealType(v as PackageRequestDealType)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STARTER">{t("dealType.STARTER")}</SelectItem>
                          <SelectItem value="ENTERPRISE">{t("dealType.ENTERPRISE")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("slotsLabel")}</label>
                        <Input type="number" min={0} value={requestedSlots} onChange={(e) => setRequestedSlots(e.target.value)} placeholder={t("slotsPlaceholder")} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("pointsLabel")}</label>
                        <Input type="number" min={0} value={requestedPoints} onChange={(e) => setRequestedPoints(e.target.value)} placeholder={t("pointsPlaceholder")} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("messageLabel")}</label>
                      <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("messagePlaceholder")} />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2 border-t">
                      <button onClick={resetAndClose} disabled={loading} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                        {t("cancel")}
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading ? <><Loader2 size={16} className="animate-spin" />{t("submitting")}</> : <><Send size={16} />{t("submit")}</>}
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
