"use client";

import { useState, useEffect, useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from "recharts";
import DashboardHeader from "../components/dashboard-header";
import { Download, FileText, Link2, Loader2, FileSearch } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import {CandidateModal} from "../candidates/components/candidate-modal";
import CandidatesTable from "../candidates/components/candidates-table";
import ShareModal from "../candidates/components/share-modal";
import { ScoreViewModal } from "../components/score-view-modal";
import candidateService from "../../../../api/candidates/endpoints";
import evaluationService from "../../../../api/evaluations/endpoints";
import { Candidate } from "../../../../api/candidates/types";
import type { CandidateScoreSummary } from "../../../../api/evaluations/types";
import { useAuth } from "@/app/hooks/useAuth";
import b2bDashboardService from "@/app/api/dashboard/b2b/endpoints";
import type { ComparisonRole, ComparisonEligibleCandidate, FullComparisonResult } from "@/app/api/dashboard/b2b/types";
import { exportChartAsPng } from "@/lib/chart-export";

// Same order/values used for both the radar chart series and the selection
// buttons, so a candidate's swatch color always matches its actual polygon
// color in the chart - assigned by selection order, capped at 4 since
// that's the max candidates toggleCandidate allows.
const CANDIDATE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];

export default function CandidateComparison() {
  const t = useTranslations("dashboard.indivisual.candidates");
  const tRoles = useTranslations("shared.startSessionModal.roles");
  const locale = useLocale();
  const { userRole, userId, isAuthenticated, loading: authLoading } = useAuth();

  // State for candidates
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Evidence Access (spec item 7): every scored evaluation for every
  // candidate, grouped by candidate - same fetch Score Management already
  // does, reused here so "View Full Report" opens the exact same
  // authoritative report rather than duplicating evidence content inside
  // the Comparison page itself.
  const [candidateScores, setCandidateScores] = useState<Record<string, CandidateScoreSummary[]>>({});
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoreModalCandidate, setScoreModalCandidate] = useState<Candidate | null>(null);

  // Step 1: Select Job Role
  const [roles, setRoles] = useState<ComparisonRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selectedRoleCode, setSelectedRoleCode] = useState<string | null>(null);

  // Step 2: Select 2-4 Eligible Candidates
  const [eligibleCandidates, setEligibleCandidates] = useState<ComparisonEligibleCandidate[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  // Step 3: Compare
  const [comparison, setComparison] = useState<FullComparisonResult | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCandidates();
      fetchRoles();
      fetchScores();
    }
  }, [isAuthenticated]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const data = await candidateService.getCandidates();
      setCandidates(data);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScores = async () => {
    try {
      const summaries = await evaluationService.getCandidateScores();
      const map: Record<string, CandidateScoreSummary[]> = {};
      summaries.forEach((s) => { (map[s.candidate_id] ??= []).push(s); });
      setCandidateScores(map);
    } catch (error) {
      console.error('Failed to fetch candidate scores:', error);
    }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const data = await b2bDashboardService.getComparisonRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch comparison roles:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Step 1 -> Step 2: candidates eligible under the selected role.
  useEffect(() => {
    if (!selectedRoleCode) {
      setEligibleCandidates([]);
      return;
    }
    let active = true;
    setLoadingEligible(true);
    b2bDashboardService
      .getComparisonEligibleCandidates(selectedRoleCode)
      .then((data) => { if (active) setEligibleCandidates(data); })
      .catch((error) => {
        console.error('Failed to fetch eligible candidates:', error);
        if (active) setEligibleCandidates([]);
      })
      .finally(() => { if (active) setLoadingEligible(false); });
    return () => { active = false; };
  }, [selectedRoleCode]);

  // Step 2 -> Step 3: auto-compare once 2-4 candidates are selected.
  useEffect(() => {
    if (!selectedRoleCode || selectedCandidateIds.length < 2) {
      setComparison(null);
      return;
    }
    let active = true;
    setLoadingComparison(true);
    b2bDashboardService
      .getFullComparison(selectedRoleCode, selectedCandidateIds, locale)
      .then((data) => { if (active) setComparison(data); })
      .catch((error) => {
        console.error('Failed to fetch full comparison:', error);
        if (active) setComparison(null);
      })
      .finally(() => { if (active) setLoadingComparison(false); });
    return () => { active = false; };
  }, [selectedRoleCode, selectedCandidateIds, locale]);

  const handleSelectRole = (roleCode: string) => {
    if (roleCode === selectedRoleCode) return;
    setSelectedRoleCode(roleCode);
    setSelectedCandidateIds([]);
    setComparison(null);
  };

  const toggleCandidate = (id: string) => {
    if (selectedCandidateIds.includes(id)) {
      setSelectedCandidateIds(selectedCandidateIds.filter((c) => c !== id));
    } else if (selectedCandidateIds.length < 4) {
      setSelectedCandidateIds([...selectedCandidateIds, id]);
    }
  };

  // Modal handlers
  const handleAddCandidate = () => {
    setSelectedCandidate(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleShareCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsShareModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchCandidates();
    fetchRoles();
    fetchScores();
  };

  const handleViewEvidence = (candidateId: string) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;
    setScoreModalCandidate(candidate);
    setIsScoreModalOpen(true);
  };

  // Radar chart data (spec item 6): one axis per applicable competency,
  // exactly the same data as the Competency Comparison table below - never
  // Candidate Score / coverage / any other non-competency metric, and
  // never a recalculated value.
  const radarData = useMemo(() => {
    if (!comparison) return [];
    const labels: string[] = [];
    const seen = new Set<string>();
    comparison.candidates.forEach((entry) => {
      entry.competencies.forEach((c) => {
        if (!seen.has(c.label)) { seen.add(c.label); labels.push(c.label); }
      });
    });
    return labels.map((label) => {
      const row: Record<string, string | number> = { subject: label };
      comparison.candidates.forEach((entry) => {
        const match = entry.competencies.find((c) => c.label === label);
        row[entry.candidate_name] = match ? match.percentage : 0;
      });
      return row;
    });
  }, [comparison]);

  // Same name/color pairing used for the chart's own <Radar> series, so the
  // PNG export legend can never drift from what's actually plotted.
  const chartLegend = useMemo(
    () => (comparison?.candidates ?? []).map((entry, index) => ({
      name: entry.candidate_name,
      color: CANDIDATE_COLORS[index % CANDIDATE_COLORS.length],
    })),
    [comparison]
  );

  // Union of competency rows across all candidates, in first-seen order -
  // the real Competency Comparison table (spec item 4), same shape the
  // backend PDF export builds.
  const competencyTableRows = useMemo(() => {
    if (!comparison) return [];
    const rows: { label: string; classification: string; values: (number | null)[] }[] = [];
    const rowIndexByLabel = new Map<string, number>();
    comparison.candidates.forEach((entry) => {
      entry.competencies.forEach((c) => {
        if (!rowIndexByLabel.has(c.label)) {
          rowIndexByLabel.set(c.label, rows.length);
          rows.push({ label: c.label, classification: c.classification, values: comparison.candidates.map(() => null) });
        }
      });
    });
    comparison.candidates.forEach((entry, colIndex) => {
      entry.competencies.forEach((c) => {
        const rowIndex = rowIndexByLabel.get(c.label);
        if (rowIndex !== undefined) rows[rowIndex].values[colIndex] = c.percentage;
      });
    });
    return rows;
  }, [comparison]);

  const classificationLabel = (classification: string) => {
    if (classification === "CRITICAL") return t("classificationCritical");
    if (classification === "NON_CRITICAL") return t("classificationNonCritical");
    return t("classificationRequired");
  };

  const classificationClass = (classification: string) => {
    if (classification === "CRITICAL") return "bg-red-100 text-red-700";
    if (classification === "NON_CRITICAL") return "bg-gray-100 text-gray-600";
    return "bg-indigo-100 text-indigo-700";
  };

  const readinessBadgeClass = (status: string) => {
    if (status === "READY") return "bg-green-100 text-green-700";
    if (status === "PARTIALLY_READY") return "bg-amber-100 text-amber-700";
    if (status === "NOT_READY") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-600";
  };

  const handleExportPng = async () => {
    const container = document.getElementById("comparison-radar-chart");
    if (!container) return;
    setExportingPng(true);
    try {
      await exportChartAsPng(container, "candidate-comparison.png", chartLegend);
    } catch (error) {
      console.error("Failed to export chart as PNG:", error);
    } finally {
      setExportingPng(false);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedRoleCode || selectedCandidateIds.length < 2) return;
    setExportingPdf(true);
    try {
      await b2bDashboardService.downloadComparisonPdf(selectedRoleCode, selectedCandidateIds, locale, "candidate-comparison.pdf");
    } catch (error) {
      console.error("Failed to export comparison PDF:", error);
    } finally {
      setExportingPdf(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">{t("loading")}</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        {/* Candidates Table Section */}
        <div className="mb-8">
          <CandidatesTable
            candidates={candidates}
            onView={handleViewCandidate}
            onEdit={handleEditCandidate}
            onShare={handleShareCandidate}
            onAdd={handleAddCandidate}
            loading={loading}
            userRole={userRole || 'B2C'}
          />
        </div>

        {/* Comparison Section: Select Job Role -> Select 2-4 Eligible
            Candidates -> Compare (spec item 1) */}
        <div className="bg-white rounded-lg p-4 sm:p-8 shadow-sm border border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">{t("comparisonTitle")}</h2>
          <p className="text-sm text-gray-500 mb-6">{t("comparisonSubtitle")}</p>

          {/* Step 1: Select Job Role */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("selectRole")}</h3>
            {loadingRoles ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : roles.length === 0 ? (
              <p className="text-sm text-gray-400">{t("noRoles")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role.role_code}
                    onClick={() => handleSelectRole(role.role_code)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                      selectedRoleCode === role.role_code
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
                    }`}
                  >
                    {tRoles.has(role.role_code) ? tRoles(role.role_code) : role.role_name}
                    <span className={`ms-2 text-xs ${selectedRoleCode === role.role_code ? "text-purple-100" : "text-gray-400"}`}>
                      {role.candidate_count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Select 2-4 Eligible Candidates */}
          {selectedRoleCode && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("selectEligibleCandidates")}</h3>
              {loadingEligible ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : eligibleCandidates.length === 0 ? (
                <p className="text-sm text-gray-400">{t("noEligibleCandidates")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {eligibleCandidates.map((candidate) => {
                    const selectionIndex = selectedCandidateIds.indexOf(candidate.candidate_id);
                    const isSelected = selectionIndex !== -1;
                    const color = isSelected ? CANDIDATE_COLORS[selectionIndex % CANDIDATE_COLORS.length] : undefined;
                    return (
                      <button
                        key={candidate.candidate_id}
                        onClick={() => toggleCandidate(candidate.candidate_id)}
                        style={isSelected ? { backgroundColor: color, borderColor: color } : undefined}
                        disabled={!isSelected && selectedCandidateIds.length >= 4}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSelected ? "text-white" : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
                        }`}
                      >
                        {candidate.candidate_name}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedCandidateIds.length > 0 && selectedCandidateIds.length < 2 && (
                <p className="text-xs text-amber-600 mt-2">{t("needMoreCandidates")}</p>
              )}
            </div>
          )}

          {/* Step 3: Compare */}
          {selectedRoleCode && selectedCandidateIds.length >= 2 && (
            <div className="border-t border-gray-100 pt-6">
              {loadingComparison ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> {t("loading")}
                </div>
              ) : comparison ? (
                <>
                  {/* Candidate Summary (spec item 3) */}
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("candidateSummary")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                    {comparison.candidates.map((entry) => (
                      <div key={entry.candidate_id} className="border border-gray-200 rounded-lg p-3">
                        <p className="font-medium text-gray-900 text-sm mb-2 truncate">{entry.candidate_name}</p>
                        <p className="text-xs text-gray-500 mb-1">{t("readinessLevel")}</p>
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${readinessBadgeClass(entry.readiness_status)}`}>
                          {entry.readiness_display}
                        </span>
                        <p className="text-xs text-gray-500">
                          {t("assessmentCoverage")}: <span className="font-medium text-gray-700">{entry.assessment_coverage}%</span>
                        </p>
                        {entry.requires_human_review && (
                          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-2 bg-amber-100 text-amber-700">
                            {t("humanReviewPending")}
                          </span>
                        )}
                        <button
                          onClick={() => handleViewEvidence(entry.candidate_id)}
                          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 mt-3"
                        >
                          <FileSearch size={12} /> {t("viewFullReport")}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Competency Comparison (spec item 4) */}
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("competencyComparison")}</h3>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-200">
                          <th className="py-2 pr-3">{t("competency")}</th>
                          <th className="py-2 pr-3">{t("classification")}</th>
                          {comparison.candidates.map((entry) => (
                            <th key={entry.candidate_id} className="py-2 px-3 text-center">{entry.candidate_name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {competencyTableRows.map((row) => (
                          <tr key={row.label} className="border-b border-gray-100">
                            <td className="py-2 pr-3 text-gray-800">{row.label}</td>
                            <td className="py-2 pr-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${classificationClass(row.classification)}`}>
                                {classificationLabel(row.classification)}
                              </span>
                            </td>
                            {row.values.map((value, index) => (
                              <td key={index} className="py-2 px-3 text-center text-gray-700">
                                {value !== null ? `${Math.round(value)}%` : "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Key Differences (spec item 5) */}
                  {comparison.key_differences.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("keyDifferences")}</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {comparison.key_differences.map((diff, index) => (
                          <li key={index}>{diff.text}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Radar Chart (spec item 6) */}
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("radarChartTitle")}</h3>
                  <div id="comparison-radar-chart" className="w-full h-64 sm:h-96 mb-6 bg-white">
                    {radarData.length < 3 ? (
                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 text-center px-4">
                        {t("notEnoughCompetencies")}
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                          <PolarGrid stroke="#E5E7EB" />
                          <PolarAngleAxis dataKey="subject" stroke="#6B7280" tick={{ fontSize: 11 }} />
                          <PolarRadiusAxis stroke="#D1D5DB" domain={[0, 100]} />
                          {comparison.candidates.map((entry, index) => (
                            <Radar
                              key={entry.candidate_id}
                              name={entry.candidate_name}
                              dataKey={entry.candidate_name}
                              stroke={CANDIDATE_COLORS[index % CANDIDATE_COLORS.length]}
                              fill={CANDIDATE_COLORS[index % CANDIDATE_COLORS.length]}
                              fillOpacity={0.25}
                            />
                          ))}
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row flex-wrap justify-center sm:justify-start gap-3">
                    <button
                      onClick={handleExportPng}
                      disabled={exportingPng || radarData.length < 3}
                      className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {exportingPng ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      {t("exportPNG")}
                    </button>
                    <button
                      onClick={handleExportPdf}
                      disabled={exportingPdf}
                      className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {exportingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                      {exportingPdf ? t("exportingPdf") : t("exportPDF")}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium text-sm sm:text-base">
                      <Link2 size={16} />
                      {t("linkAnalytics")}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CandidateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        candidate={selectedCandidate}
        mode={modalMode}
        onSuccess={handleModalSuccess}
        userRole={userRole || 'B2C'}
        currentUserId={userId || undefined}
      />

      {selectedCandidate && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          candidate={selectedCandidate}
          onSuccess={handleModalSuccess}
          userRole={userRole || 'B2C'}
        />
      )}

      <ScoreViewModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        candidate={scoreModalCandidate}
        evaluations={scoreModalCandidate ? (candidateScores[scoreModalCandidate.id] ?? []) : []}
      />
    </div>
  );
}
