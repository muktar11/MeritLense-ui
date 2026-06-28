"use client";

import { useState } from "react";
import { ChevronDown, Download, LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocale, useTranslations } from "next-intl";

interface Candidate {
  id: number;
  name: string;
  avatar: string;
  passport: string;
  role: string;
  certificate: string;
  evaluationDate: string;
  language: string;
}

export function CandidateEvaluation() {
  const t = useTranslations("dashboard.business.candidate-evaluation");
  const locale = useLocale();

  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const candidates: Candidate[] = [
    { id: 1, name: "Evan Flores", avatar: "👤", passport: "432 234 23 4443", role: "housekeeper", certificate: "inProgress", evaluationDate: "Apr 1, 2025", language: "english" },
    { id: 2, name: "Ariana Wilson", avatar: "👤", passport: "432 234 23 4443", role: "nanny", certificate: "complete", evaluationDate: "Apr 1, 2025", language: "arabic" },
    { id: 3, name: "Jamila Cooper", avatar: "👤", passport: "432 234 23 4443", role: "elderCompanion", certificate: "complete", evaluationDate: "Apr 1, 2025", language: "english" },
    { id: 4, name: "David Brown", avatar: "👤", passport: "432 234 23 4443", role: "kitchenAssistant", certificate: "ready", evaluationDate: "Apr 1, 2025", language: "english" },
    { id: 5, name: "Jorge Black", avatar: "👤", passport: "432 234 23 4443", role: "maintenance", certificate: "ready", evaluationDate: "Apr 1, 2025", language: "spanish" },
    { id: 6, name: "Jorge Black", avatar: "👤", passport: "432 234 23 4443", role: "housekeeper", certificate: "needTraining", evaluationDate: "Apr 1, 2025", language: "english" },
  ];

  const getCertificateColor = (status: string) => {
    switch (status) {
      case "inProgress": return "bg-yellow-100 text-yellow-800";
      case "complete": return "bg-green-100 text-green-800";
      case "ready": return "bg-blue-100 text-blue-800";
      case "needTraining": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-4 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">
        <span className="font-semibold text-gray-700">{t("quickActions")}</span>

        {/* Role Filter */}
        <div className="relative flex-shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm w-full sm:w-40"
          >
            <option value="">{t("filters.role")}</option>
            <option value="housekeeper">{t("roles.housekeeper")}</option>
            <option value="nanny">{t("roles.nanny")}</option>
            <option value="elderCompanion">{t("roles.elderCompanion")}</option>
            <option value="kitchenAssistant">{t("roles.kitchenAssistant")}</option>
            <option value="maintenance">{t("roles.maintenance")}</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>

        {/* Status Filter */}
        <div className="relative flex-shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm w-full sm:w-40"
          >
            <option value="">{t("filters.status")}</option>
            <option value="complete">{t("certificates.complete")}</option>
            <option value="inProgress">{t("certificates.inProgress")}</option>
            <option value="ready">{t("certificates.ready")}</option>
            <option value="needTraining">{t("certificates.needTraining")}</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>

        {/* Search */}
        <div className="ml-auto w-full sm:w-auto">
          <Input
            placeholder={t("search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>
      </div>

      {/* Candidate Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
        </div>

        <table className="w-full text-sm min-w-[600px] sm:min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {(Object.values(t.raw("tableHeaders")) as string[]).map((header) => (
                <th key={header} className="px-4 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">{header}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {candidates
              .filter((c) => (roleFilter ? c.role === roleFilter : true))
              .filter((c) => (statusFilter ? c.certificate === statusFilter : true))
              .filter((c) => searchTerm
                ? c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.passport.toLowerCase().includes(searchTerm.toLowerCase())
                : true
              )
              .map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 flex items-center gap-2 sm:gap-3 whitespace-nowrap">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-200 flex items-center justify-center">{c.avatar}</div>
                    {c.name}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{c.passport}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{t(`roles.${c.role}`)}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${getCertificateColor(c.certificate)}`}>
                      {t(`certificates.${c.certificate}`)}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{c.evaluationDate}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{t(`languages.${c.language}`)}</td>
                  <td className="px-4 sm:px-6 py-4 flex gap-2 whitespace-nowrap">
                    <Download className="w-4 h-4 text-blue-600" />
                    <LinkIcon className="w-4 h-4 text-purple-600" />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
