"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Eye, Search } from "lucide-react";
import type { Candidate } from "@/app/api/candidates/types";
import type { CandidateScoreSummary } from "@/app/api/evaluations/types";
import { Input } from "@/components/ui/input";
import TablePagination from "@/components/ui/table-pagination";

const PAGE_SIZE = 10;

interface AssessedCandidatesTableProps {
  candidates: Candidate[];
  scores: Record<string, CandidateScoreSummary[]>;
  onViewScores: (candidate: Candidate) => void;
}

function isWithinDateRange(date: Date, dateFrom: string, dateTo: string) {
  if (dateFrom) {
    const start = new Date(`${dateFrom}T00:00:00`);
    if (date < start) return false;
  }

  if (dateTo) {
    const end = new Date(`${dateTo}T23:59:59.999`);
    if (date > end) return false;
  }

  return true;
}

export function AssessedCandidatesTable({
  candidates,
  scores,
  onViewScores,
}: AssessedCandidatesTableProps) {
  const t = useTranslations("dashboard.business.score-management.assessedTable");
  const tRoles = useTranslations("shared.startSessionModal.roles");
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase();

    return candidates.flatMap((candidate) => {
      const matchingEvaluations = (scores[candidate.id] ?? [])
        .filter((evaluation) => {
          if (!evaluation.evaluation_id) return false;
          if (!isWithinDateRange(new Date(evaluation.generated_at), dateFrom, dateTo)) return false;
          if (!term) return true;

          const roleName = tRoles.has(evaluation.role_code)
            ? tRoles(evaluation.role_code)
            : evaluation.role_code;
          const searchableText = [
            candidate.first_name,
            candidate.last_name,
            candidate.full_name,
            candidate.email,
            candidate.passport_id,
            roleName,
          ].join(" ").toLocaleLowerCase();
          return searchableText.includes(term);
        })
        .sort((a, b) => Date.parse(b.generated_at) - Date.parse(a.generated_at));

      const latestMatchingEvaluation = matchingEvaluations[0];
      return latestMatchingEvaluation
        ? [{ candidate, evaluation: latestMatchingEvaluation }]
        : [];
    }).sort((a, b) => Date.parse(b.evaluation.generated_at) - Date.parse(a.evaluation.generated_at));
  }, [candidates, scores, searchTerm, dateFrom, dateTo, tRoles]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(date));

  const roleName = (roleCode: string) =>
    tRoles.has(roleCode) ? tRoles(roleCode) : roleCode;

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        <p className="mt-1 text-sm text-gray-600">{t("description")}</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative block xl:col-span-2">
            <span className="sr-only">{t("searchLabel")}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 rtl:left-auto rtl:right-3" />
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder={t("searchPlaceholder")}
              className="pl-9 rtl:pl-3 rtl:pr-9"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{t("dateFrom")}</span>
            <Input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setCurrentPage(1);
              }}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{t("dateTo")}</span>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => {
                setDateTo(event.target.value);
                setCurrentPage(1);
              }}
            />
          </label>
        </div>
        {(searchTerm || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-purple-700 hover:text-purple-900"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      {filteredRows.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-gray-500">{t("empty")}</div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">{t("candidate")}</th>
                  <th scope="col" className="px-6 py-3 font-semibold">{t("role")}</th>
                  <th scope="col" className="px-6 py-3 font-semibold">{t("assessmentDate")}</th>
                  <th scope="col" className="px-6 py-3 font-semibold">{t("score")}</th>
                  <th scope="col" className="px-6 py-3 text-right font-semibold">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRows.map(({ candidate, evaluation }) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{candidate.full_name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{candidate.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{roleName(evaluation.role_code)}</td>
                    <td className="px-6 py-4 text-gray-700">{formatDate(evaluation.generated_at)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-1 font-semibold text-purple-700">
                        {evaluation.overall_percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewScores(candidate)}
                        className="inline-flex items-center gap-2 rounded-md px-3 py-2 font-medium text-purple-700 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                      >
                        <Eye className="h-4 w-4" />
                        {t("viewScores")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-gray-100 md:hidden">
            {pageRows.map(({ candidate, evaluation }) => (
              <article key={candidate.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{candidate.full_name}</p>
                    <p className="truncate text-xs text-gray-500">{candidate.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-sm font-semibold text-purple-700">
                    {evaluation.overall_percentage}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span>{roleName(evaluation.role_code)}</span>
                  <span>{formatDate(evaluation.generated_at)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onViewScores(candidate)}
                  className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                >
                  <Eye className="h-4 w-4" />
                  {t("viewScores")}
                </button>
              </article>
            ))}
          </div>

          <TablePagination
            currentPage={safePage}
            totalItems={filteredRows.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemLabel={t("itemLabel")}
          />
        </>
      )}
    </section>
  );
}
