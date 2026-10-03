"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, ClipboardCheck, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Candidate } from "@/app/api/candidates/types";
import { CandidateScoreSummary } from "@/app/api/evaluations/types";
import { DynamicScoreTable } from "../score-management/score-tables/dynamic-score-table";
import { JobRoleTabs, UNASSESSED_ROLE_BUCKET } from "./job-role-tabs";
import { ScoreViewModal } from "./score-view-modal";
import candidateService from "@/app/api/candidates/endpoints";
import evaluationService from "@/app/api/evaluations/endpoints";
import { AssessedCandidatesTable } from "@/components/evaluations/assessed-candidates-table";

export function ScoreManagement() {
  const t = useTranslations("dashboard.business.score-management");
  const tRoles = useTranslations("shared.startSessionModal.roles");
  const locale = useLocale();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesByRole, setCandidatesByRole] = useState<Record<string, Candidate[]>>({});
  // Every scored evaluation for a candidate, most-recent first - a candidate
  // re-assessed (retry, or a different role) can have more than one.
  const [candidateScores, setCandidateScores] = useState<Record<string, CandidateScoreSummary[]>>({});
  const [loading, setLoading] = useState(true);

  const [selectedRole, setSelectedRole] = useState<string>(UNASSESSED_ROLE_BUCKET);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [candidatesData, summaries] = await Promise.all([
          candidateService.getCandidates(),
          evaluationService.getCandidateScores(),
        ]);
        if (cancelled) return;

        setCandidates(candidatesData);

        const scoresMap: Record<string, CandidateScoreSummary[]> = {};
        summaries.forEach(summary => {
          (scoresMap[summary.candidate_id] ??= []).push(summary);
        });
        Object.values(scoresMap).forEach(evaluations => {
          evaluations.sort((a, b) => Date.parse(b.generated_at) - Date.parse(a.generated_at));
        });
        setCandidateScores(scoresMap);

        const grouped: Record<string, Candidate[]> = {};
        candidatesData.forEach(candidate => {
          const role = scoresMap[candidate.id]?.[0]?.role_code || UNASSESSED_ROLE_BUCKET;
          if (!grouped[role]) grouped[role] = [];
          grouped[role].push(candidate);
        });
        setCandidatesByRole(grouped);

        const availableRoles = Object.keys(grouped);
        if (availableRoles.length > 0 && !grouped[UNASSESSED_ROLE_BUCKET]) {
          setSelectedRole(availableRoles[0]);
        }
      } catch (error) {
        if (!cancelled) console.error("Failed to fetch candidate scores:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleViewScores = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const getFilteredCandidates = () => {
    const roleCandidates = candidatesByRole[selectedRole] || [];
    const term = searchTerm.trim().toLocaleLowerCase();

    return roleCandidates.filter(candidate => {
      const evaluation = candidateScores[candidate.id]?.[0];
      if ((dateFrom || dateTo) && !evaluation?.evaluation_id) return false;
      if (evaluation?.evaluation_id) {
        const assessedAt = new Date(evaluation.generated_at);
        if (dateFrom && assessedAt < new Date(`${dateFrom}T00:00:00`)) return false;
        if (dateTo && assessedAt > new Date(`${dateTo}T23:59:59.999`)) return false;
      }
      if (!term) return true;

      return [
        candidate.first_name,
        candidate.last_name,
        candidate.full_name,
        candidate.email,
        candidate.passport_id,
      ].some(value => value?.toLocaleLowerCase().includes(term));
    });
  };

  const roleCounts = Object.keys(candidatesByRole).reduce((acc, role) => {
    acc[role] = candidatesByRole[role].length;
    return acc;
  }, {} as Record<string, number>);

  const roleHeading = (role: string) => {
    if (role === UNASSESSED_ROLE_BUCKET) return t("jobRoleTabs.unassessed");
    return tRoles.has(role) ? tRoles(role) : role;
  };

  const filteredCandidates = getFilteredCandidates();
  const assessedCandidateCount = candidates.filter(candidate =>
    candidateScores[candidate.id]?.some(evaluation => evaluation.evaluation_id)
  ).length;

  const renderTable = () => {
    if (filteredCandidates.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {t("noCandidatesForRole")}
        </div>
      );
    }

    return (
      <DynamicScoreTable
        candidates={filteredCandidates}
        scores={candidateScores}
        onViewScores={handleViewScores}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loadingCandidatesAndScores")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("pageHeading")}</h1>
        <p className="text-gray-600">{t("pageSubtitle")}</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
          <div className="rounded-lg bg-purple-50 p-2.5 text-purple-700"><Users className="h-5 w-5" /></div>
          <div>
            <p className="text-sm text-gray-600">{t("summary.totalCandidates")}</p>
            <p className="text-2xl font-semibold text-gray-900">{candidates.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-white p-4 shadow-sm">
          <div className="rounded-lg bg-green-50 p-2.5 text-green-700"><ClipboardCheck className="h-5 w-5" /></div>
          <div>
            <p className="text-sm text-gray-600">{t("summary.assessedCandidates")}</p>
            <p className="text-2xl font-semibold text-gray-900">{assessedCandidateCount}</p>
          </div>
        </div>
      </div>

      <section className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t("roleSection.title")}</h2>
          <p className="mt-1 text-sm text-gray-600">{t("roleSection.description")}</p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative block xl:col-span-2">
            <span className="sr-only">{t("searchByNameEmail")}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 rtl:left-auto rtl:right-3" />
            <Input
              type="search"
              placeholder={t("searchByNameEmail")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9 rtl:pl-3 rtl:pr-9"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{t("filters.dateFrom")}</span>
            <span className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 rtl:left-auto rtl:right-3" />
              <Input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
                className="pl-9 rtl:pl-3 rtl:pr-9"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{t("filters.dateTo")}</span>
            <span className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 rtl:left-auto rtl:right-3" />
              <Input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
                className="pl-9 rtl:pl-3 rtl:pr-9"
              />
            </span>
          </label>
        </div>

        <div className="mb-4">
          <JobRoleTabs
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            roleCounts={roleCounts}
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="font-semibold text-gray-900">
              {t("candidatesHeading", { role: roleHeading(selectedRole) })}
            </h3>
          </div>
          {renderTable()}
        </div>
      </section>

      <AssessedCandidatesTable
        candidates={candidates}
        scores={candidateScores}
        onViewScores={handleViewScores}
      />

      <ScoreViewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCandidate(null);
        }}
        candidate={selectedCandidate}
        evaluations={selectedCandidate ? candidateScores[selectedCandidate.id] ?? [] : []}
      />
    </div>
  );
}
