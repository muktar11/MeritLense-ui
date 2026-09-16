"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Candidate } from "@/app/api/candidates/types";
import { CandidateScoreSummary } from "@/app/api/evaluations/types";
import { DynamicScoreTable } from "../score-management/score-tables/dynamic-score-table";
import { JobRoleTabs, UNASSESSED_ROLE_BUCKET } from "./job-role-tabs";
import { ScoreViewModal } from "./score-view-modal";
import candidateService from "@/app/api/candidates/endpoints";
import evaluationService from "@/app/api/evaluations/endpoints";

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [candidatesData, summaries] = await Promise.all([
        candidateService.getCandidates(),
        evaluationService.getCandidateScores(),
      ]);
      setCandidates(candidatesData);

      const scoresMap: Record<string, CandidateScoreSummary[]> = {};
      summaries.forEach(summary => {
        (scoresMap[summary.candidate_id] ??= []).push(summary);
      });
      setCandidateScores(scoresMap);

      // Bucketed by the role_code of the candidate's most recent evaluation
      // (the granular 21-role taxonomy scoring actually runs on), not the
      // older Candidate.job_role field - a candidate never assessed yet has
      // no evaluation to derive that from, so they land in a dedicated
      // "not yet assessed" bucket instead of a misleading role guess.
      const grouped: Record<string, Candidate[]> = {};
      candidatesData.forEach(candidate => {
        const role = scoresMap[candidate.id]?.[0]?.role_code || UNASSESSED_ROLE_BUCKET;
        if (!grouped[role]) {
          grouped[role] = [];
        }
        grouped[role].push(candidate);
      });
      setCandidatesByRole(grouped);

      const availableRoles = Object.keys(grouped);
      if (availableRoles.length > 0 && !grouped[selectedRole]) {
        setSelectedRole(availableRoles[0]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewScores = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const getFilteredCandidates = () => {
    const roleCandidates = candidatesByRole[selectedRole] || [];

    if (!searchTerm) return roleCandidates;

    const term = searchTerm.toLowerCase();
    return roleCandidates.filter(c =>
      c.first_name.toLowerCase().includes(term) ||
      c.last_name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  };

  const roleCounts = Object.keys(candidatesByRole).reduce((acc, role) => {
    acc[role] = candidatesByRole[role].length;
    return acc;
  }, {} as Record<string, number>);

  const roleHeading = (role: string) => {
    if (role === UNASSESSED_ROLE_BUCKET) return t("jobRoleTabs.unassessed");
    return tRoles.has(role) ? tRoles(role) : role;
  };

  const renderTable = () => {
    const filteredCandidates = getFilteredCandidates();

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

      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-2 max-w-md">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder={t("searchByNameEmail")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <JobRoleTabs
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        roleCounts={roleCounts}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("candidatesHeading", { role: roleHeading(selectedRole) })}
          </h2>
        </div>

        {renderTable()}

        {getFilteredCandidates().length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t("noCandidatesForRole")}</p>
          </div>
        )}
      </div>

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
