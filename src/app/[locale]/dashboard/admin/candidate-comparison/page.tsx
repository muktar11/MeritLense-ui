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
import { Download, FileText, Loader2, FileSearch, Search } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { ScoreViewModal } from "../../business/components/score-view-modal";
import candidateService from "@/app/api/candidates/endpoints";
import evaluationService from "@/app/api/evaluations/endpoints";
import type { Candidate } from "@/app/api/candidates/types";
import type { CandidateScoreSummary } from "@/app/api/evaluations/types";
import { useAuth } from "@/app/hooks/useAuth";
import adminDashboardService from "@/app/api/dashboard/admin/endpoints";
import type {
  ComparisonAccount,
  ComparisonRole,
  ComparisonEligibleCandidate,
  FullComparisonResult,
} from "@/app/api/dashboard/admin/types";
import { exportChartAsPng } from "@/lib/chart-export";

// Same order/values used for both the radar chart series and the selection
// buttons, so a candidate's swatch color always matches its polygon color.
const CANDIDATE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];

// Admin/Superadmin Candidate Comparison: the same Select Job Role -> Select
// 2-4 Eligible Candidates -> Compare flow as the B2B and B2C Candidates
// pages, preceded by picking the account (B2B company or B2C user) whose
// candidates to compare - comparison never mixes accounts.
export default function AdminCandidateComparisonPage() {
  const t = useTranslations("dashboard.indivisual.candidates");
  const tAdmin = useTranslations("dashboard.admin.candidateComparison");
  const tRoles = useTranslations("shared.startSessionModal.roles");
  const locale = useLocale();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Step 0: Select Account
  const [accounts, setAccounts] = useState<ComparisonAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountSearch, setAccountSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<ComparisonAccount | null>(null);

  // Step 1: Select Job Role
  const [roles, setRoles] = useState<ComparisonRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
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

  // Evidence Access: "View Full Report" opens the same Score View modal the
  // B2B pages use. Loaded on demand - for an admin, candidate-scores covers
  // the whole platform, so it isn't worth fetching up front.
  const [candidateScores, setCandidateScores] = useState<Record<string, CandidateScoreSummary[]> | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoreModalCandidate, setScoreModalCandidate] = useState<Candidate | null>(null);
  const [openingEvidenceId, setOpeningEvidenceId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingAccounts(true);
    adminDashboardService
      .getComparisonAccounts()
      .then(setAccounts)
      .catch((error) => console.error('Failed to fetch comparison accounts:', error))
      .finally(() => setLoadingAccounts(false));
  }, [isAuthenticated]);

  // Step 0 -> Step 1: roles with comparable candidates in the account.
  useEffect(() => {
    if (!selectedAccount) {
      setRoles([]);
      return;
    }
    let active = true;
    setLoadingRoles(true);
    adminDashboardService
      .getComparisonRoles(selectedAccount)
      .then((data) => { if (active) setRoles(data); })
      .catch((error) => {
        console.error('Failed to fetch comparison roles:', error);
        if (active) setRoles([]);
      })
      .finally(() => { if (active) setLoadingRoles(false); });
    return () => { active = false; };
  }, [selectedAccount]);

  // Step 1 -> Step 2: candidates eligible under the selected role.
  useEffect(() => {
    if (!selectedAccount || !selectedRoleCode) {
      setEligibleCandidates([]);
      return;
    }
    let active = true;
    setLoadingEligible(true);
    adminDashboardService
      .getComparisonEligibleCandidates(selectedAccount, selectedRoleCode)
      .then((data) => { if (active) setEligibleCandidates(data); })
      .catch((error) => {
        console.error('Failed to fetch eligible candidates:', error);
        if (active) setEligibleCandidates([]);
      })
      .finally(() => { if (active) setLoadingEligible(false); });
    return () => { active = false; };
  }, [selectedAccount, selectedRoleCode]);

  // Step 2 -> Step 3: auto-compare once 2-4 candidates are selected.
  useEffect(() => {
    if (!selectedAccount || !selectedRoleCode || selectedCandidateIds.length < 2) {
      setComparison(null);
      return;
    }
    let active = true;
    setLoadingComparison(true);
    adminDashboardService
      .getFullComparison(selectedAccount, selectedRoleCode, selectedCandidateIds, locale)
      .then((data) => { if (active) setComparison(data); })
      .catch((error) => {
        console.error('Failed to fetch full comparison:', error);
        if (active) setComparison(null);
      })
      .finally(() => { if (active) setLoadingComparison(false); });
    return () => { active = false; };
  }, [selectedAccount, selectedRoleCode, selectedCandidateIds, locale]);

  const accountKey = (account: ComparisonAccount) => `${account.owner_type}:${account.owner_id}`;

  const filteredAccounts = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((a) =>
      a.name.toLowerCase().includes(query) || a.email.toLowerCase().includes(query)
    );
  }, [accounts, accountSearch]);

  const handleSelectAccount = (key: string) => {
    const account = accounts.find((a) => accountKey(a) === key) ?? null;
    setSelectedAccount(account);
    setSelectedRoleCode(null);
    setSelectedCandidateIds([]);
    setComparison(null);
  };

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

  const handleViewEvidence = async (candidateId: string) => {
    setOpeningEvidenceId(candidateId);
    try {
      let scores = candidateScores;
      if (scores === null) {
        const summaries = await evaluationService.getCandidateScores();
        scores = {};
        summaries.forEach((s) => { (scores![s.candidate_id] ??= []).push(s); });
        setCandidateScores(scores);
      }
      const candidate = await candidateService.getCandidate(candidateId);
      setScoreModalCandidate(candidate);
      setIsScoreModalOpen(true);
    } catch (error) {
      console.error('Failed to open candidate report:', error);
    } finally {
      setOpeningEvidenceId(null);
    }
  };

  // Radar chart data: one axis per applicable competency, exactly the same
  // data as the Competency Comparison table below.
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

  const chartLegend = useMemo(
    () => (comparison?.candidates ?? []).map((entry, index) => ({
      name: entry.candidate_name,
      color: CANDIDATE_COLORS[index % CANDIDATE_COLORS.length],
    })),
    [comparison]
  );

  // Union of competency rows across all candidates, in first-seen order -
  // same shape the backend PDF export builds.
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
    if (!selectedAccount || !selectedRoleCode || selectedCandidateIds.length < 2) return;
    setExportingPdf(true);
    try {
      await adminDashboardService.downloadComparisonPdf(
        selectedAccount, selectedRoleCode, selectedCandidateIds, locale, "candidate-comparison.pdf"
      );
    } catch (error) {
      console.error("Failed to export comparison PDF:", error);
    } finally {
      setExportingPdf(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">{t("loading")}</div>
      </div>
    );
  }

  const companyAccounts = filteredAccounts.filter((a) => a.owner_type === "COMPANY");
  const userAccounts = filteredAccounts.filter((a) => a.owner_type === "USER");

  return (
    <div className="py-6 sm:py-8 max-w-7xl mx-auto">
      <div className="mb-8 text-center sm:text-start">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{tAdmin("title")}</h1>
        <p className="text-gray-600 text-sm sm:text-base">{tAdmin("subtitle")}</p>
      </div>

      <div className="bg-white rounded-lg p-4 sm:p-8 shadow-sm border border-gray-200">
        {/* Step 0: Select Account */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{tAdmin("selectAccount")}</h3>
          {loadingAccounts ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          ) : accounts.length === 0 ? (
            <p className="text-sm text-gray-400">{tAdmin("noAccounts")}</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 max-w-3xl">
              <div className="relative sm:w-64">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder={tAdmin("searchAccounts")}
                  className="w-full ps-9 pe-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                />
              </div>
              <select
                value={selectedAccount ? accountKey(selectedAccount) : ""}
                onChange={(e) => handleSelectAccount(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-purple-400"
              >
                <option value="">{tAdmin("chooseAccount")}</option>
                {companyAccounts.length > 0 && (
                  <optgroup label={tAdmin("businessAccounts")}>
                    {companyAccounts.map((a) => (
                      <option key={accountKey(a)} value={accountKey(a)}>{a.name} · {a.candidate_count}</option>
                    ))}
                  </optgroup>
                )}
                {userAccounts.length > 0 && (
                  <optgroup label={tAdmin("individualAccounts")}>
                    {userAccounts.map((a) => (
                      <option key={accountKey(a)} value={accountKey(a)}>
                        {a.email && a.email !== a.name ? `${a.name} (${a.email})` : a.name} · {a.candidate_count}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Step 1: Select Job Role */}
        {selectedAccount && (
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
        )}

        {/* Step 2: Select 2-4 Eligible Candidates */}
        {selectedAccount && selectedRoleCode && (
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
        {selectedAccount && selectedRoleCode && selectedCandidateIds.length >= 2 && (
          <div className="border-t border-gray-100 pt-6">
            {loadingComparison ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> {t("loading")}
              </div>
            ) : comparison ? (
              <>
                {/* Candidate Summary */}
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
                        disabled={openingEvidenceId !== null}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 mt-3 disabled:opacity-50"
                      >
                        {openingEvidenceId === entry.candidate_id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <FileSearch size={12} />}
                        {t("viewFullReport")}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Competency Comparison */}
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("competencyComparison")}</h3>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-start text-xs uppercase text-gray-400 border-b border-gray-200">
                        <th className="py-2 pe-3 text-start">{t("competency")}</th>
                        <th className="py-2 pe-3 text-start">{t("classification")}</th>
                        {comparison.candidates.map((entry) => (
                          <th key={entry.candidate_id} className="py-2 px-3 text-center">{entry.candidate_name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {competencyTableRows.map((row) => (
                        <tr key={row.label} className="border-b border-gray-100">
                          <td className="py-2 pe-3 text-gray-800">{row.label}</td>
                          <td className="py-2 pe-3">
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

                {/* Key Differences */}
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

                {/* Radar Chart */}
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
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      <ScoreViewModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        candidate={scoreModalCandidate}
        evaluations={scoreModalCandidate ? (candidateScores?.[scoreModalCandidate.id] ?? []) : []}
      />
    </div>
  );
}
