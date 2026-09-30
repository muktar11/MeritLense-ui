"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Inbox, Eye } from "lucide-react";
import { ReviewRequestModal } from "./components/review-request-modal";
import adminPackageRequestService from "@/app/api/admin/package-requests/endpoints";
import type { PackageRequest, PackageRequestApprovePayload } from "@/app/api/admin/package-requests/types";

const STATUS_FILTERS = ["all", "PENDING", "APPROVED", "PAID", "DENIED"] as const;

export default function PackageRequestsPage() {
  const t = useTranslations("dashboard.admin.packageRequests");
  const [requests, setRequests] = useState<PackageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [selected, setSelected] = useState<PackageRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await adminPackageRequestService.getRequests(
        statusFilter === "all" ? undefined : { status: statusFilter }
      );
      setRequests(response.results || []);
    } catch {
      setLoadError(t("errors.loadFailed"));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string, data: PackageRequestApprovePayload) => {
    await adminPackageRequestService.approve(id, data);
    await fetchRequests();
  };

  const handleDeny = async (id: string, reason: string) => {
    await adminPackageRequestService.deny(id, { decision_reason: reason });
    await fetchRequests();
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "DENIED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-amber-100 text-amber-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
          {STATUS_FILTERS.map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === key ? "bg-purple-600 text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t(`filters.${key.toLowerCase()}`)}
            </button>
          ))}
        </div>

        <Card className="bg-white shadow-sm border-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : loadError ? (
            <div className="text-center py-12 text-red-600 text-sm">{loadError}</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">{t("empty")}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>{t("table.company")}</TableHead>
                      <TableHead>{t("table.dealType")}</TableHead>
                      <TableHead>{t("table.requested")}</TableHead>
                      <TableHead>{t("table.requestedBy")}</TableHead>
                      <TableHead>{t("table.submitted")}</TableHead>
                      <TableHead>{t("table.status")}</TableHead>
                      <TableHead>{t("table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => (
                      <TableRow key={req.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">{req.company_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{req.deal_type_display}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {req.requested_slot_grant != null ? t("slotsShort", { count: req.requested_slot_grant }) : t("notSpecified")}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-900">{req.requested_by_name}</p>
                          <p className="text-xs text-gray-500">{req.requested_by_email}</p>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass(req.status)}>{t(`status.${req.status}`)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => { setSelected(req); setIsModalOpen(true); }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {t("table.review")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden divide-y divide-gray-100">
                {requests.map((req) => (
                  <div key={req.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{req.company_name}</p>
                        <p className="text-sm text-gray-500 truncate">{req.requested_by_email}</p>
                      </div>
                      <Badge className={`shrink-0 ${statusBadgeClass(req.status)}`}>{t(`status.${req.status}`)}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                      <Badge variant="outline">{req.deal_type_display}</Badge>
                      <span>{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => { setSelected(req); setIsModalOpen(true); }}
                      className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {t("table.review")}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <ReviewRequestModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelected(null); }}
        request={selected}
        onApprove={handleApprove}
        onDeny={handleDeny}
      />
    </div>
  );
}
