"use client";

import { useState, useEffect, useRef } from "react";
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
import { Download, FileText, Link2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {CandidateModal} from "../candidates/components/candidate-modal";
import CandidatesTable from "../candidates/components/candidates-table";
import ShareModal from "../candidates/components/share-modal";
import candidateService from "../../../../api/candidates/endpoints";
import { Candidate } from "../../../../api/candidates/types";
import { useAuth } from "@/app/hooks/useAuth";
import b2bDashboardService from "@/app/api/dashboard/b2b/endpoints";
import type { CandidateComparison } from "@/app/api/dashboard/b2b/types";
import { exportChartAsPdf, exportChartAsPng } from "@/lib/chart-export";

// "score" is a fixed pseudo-metric that reads average_score. Every other
// selectable metric is a real competency label, computed at runtime from
// whatever scores_by_area keys the backend actually returns for the
// selected candidates (real per-competency names like "Communication
// Ability" or "Patient Safety Awareness" - see
// EvaluationReportService._friendly_competency_name on the backend) -
// there is no fixed universal metric set to hardcode, since competencies
// are role-specific.
const SCORE_METRIC_ID = "score";

// Same order/values used for both the radar chart series and the sidebar
// selection buttons, so a candidate's swatch color always matches its
// actual polygon color in the chart - assigned by selection order, capped
// at 4 since that's the max candidates toggleCandidate allows.
const CANDIDATE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];

export default function CandidateComparison() {
  const t = useTranslations("dashboard.indivisual.candidates");
  const { userRole, userId, isAuthenticated, loading: authLoading } = useAuth();

  // State for candidates
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // State for comparison
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([SCORE_METRIC_ID]);
  const [comparisonData, setComparisonData] = useState<CandidateComparison[]>([]);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Fetch candidates on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCandidates();
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

  // Fetch real per-area scores for whichever candidates are selected.
  useEffect(() => {
    if (selectedCandidates.length === 0) {
      setComparisonData([]);
      return;
    }
    let active = true;
    setLoadingComparison(true);
    b2bDashboardService
      .getCandidateComparison(selectedCandidates)
      .then((data) => {
        if (!active) return;
        setComparisonData(data);
        // Default to plotting every real competency area that came back,
        // plus the overall score - the set of areas is only known once we
        // have real data, since competencies are role-specific rather than
        // a fixed universal list.
        const areas = Array.from(new Set(data.flatMap((entry) => Object.keys(entry.scores_by_area))));
        setSelectedMetrics([SCORE_METRIC_ID, ...areas]);
      })
      .catch((error) => {
        console.error('Failed to fetch candidate comparison:', error);
        if (active) setComparisonData([]);
      })
      .finally(() => {
        if (active) setLoadingComparison(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCandidates]);

  // Every area currently present across the selected candidates' real
  // scores - the actual set of metric checkboxes to offer.
  const availableAreas = Array.from(
    new Set(comparisonData.flatMap((entry) => Object.keys(entry.scores_by_area)))
  );

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
  };

  // Comparison handlers
  const toggleCandidate = (id: string) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(selectedCandidates.filter((c) => c !== id));
    } else if (selectedCandidates.length < 4) {
      setSelectedCandidates([...selectedCandidates, id]);
    }
  };

  const toggleMetric = (id: string) => {
    if (selectedMetrics.includes(id)) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== id));
    } else {
      setSelectedMetrics([...selectedMetrics, id]);
    }
  };

  // Get selected candidate details for sidebar
  const selectedCandidateDetails = candidates.filter(c =>
    selectedCandidates.includes(c.id)
  ).map(c => ({
    id: c.id,
    name: c.full_name,
    role: c.job_role
  }));

  // Radar chart data: one row per selected metric, one value per selected
  // candidate, read from the real scores_by_area/average_score returned by
  // the backend - never fabricated. Metric ids are either the fixed
  // SCORE_METRIC_ID or a real competency label straight from the API
  // (already human-readable English, not a translation key - competency
  // names are computed server-side, not static UI chrome).
  const getPerformanceData = () => {
    const rows: Array<Record<string, string | number | null>> = selectedMetrics.map((metricId) => ({
      subject: metricId === SCORE_METRIC_ID ? t("metrics.score") : metricId,
      __metricId: metricId,
    }));

    comparisonData.forEach((entry) => {
      const candidate = selectedCandidateDetails.find((c) => c.id === entry.candidate_id);
      if (!candidate) return;
      rows.forEach((row) => {
        const metricId = row.__metricId as string;
        const value = metricId === SCORE_METRIC_ID ? entry.average_score : entry.scores_by_area[metricId];
        row[candidate.name] = value ?? 0;
      });
    });

    return rows;
  };

  const performanceData = getPerformanceData();

  // Same name/color pairing used for the chart's own <Radar> series, so the
  // export legend can never drift from what's actually plotted.
  const chartLegend = selectedCandidateDetails.map((candidate, index) => ({
    name: candidate.name,
    color: CANDIDATE_COLORS[index % CANDIDATE_COLORS.length],
  }));

  const handleExportPng = async () => {
    if (!chartContainerRef.current) return;
    setExporting("png");
    try {
      await exportChartAsPng(chartContainerRef.current, "candidate-comparison.png", chartLegend);
    } catch (error) {
      console.error("Failed to export chart as PNG:", error);
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!chartContainerRef.current) return;
    setExporting("pdf");
    try {
      await exportChartAsPdf(chartContainerRef.current, "candidate-comparison.pdf", t("radarChartTitle"), chartLegend);
    } catch (error) {
      console.error("Failed to export chart as PDF:", error);
    } finally {
      setExporting(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
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
            currentUserId={userId || undefined}
          />
        </div>

        {/* Comparison Section */}
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Sidebar */}
          <div className="sm:w-60 bg-gray-100 rounded-lg p-4 sm:p-6 shrink-0">
            {/* Select Candidates */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {t("selectCandidates")}
              </h2>
              <div className="flex flex-col gap-2">
                {candidates.map((candidate) => {
                  const selectionIndex = selectedCandidates.indexOf(candidate.id);
                  const isSelected = selectionIndex !== -1;
                  const color = isSelected ? CANDIDATE_COLORS[selectionIndex % CANDIDATE_COLORS.length] : undefined;
                  return (
                    <button
                      key={candidate.id}
                      onClick={() => toggleCandidate(candidate.id)}
                      style={isSelected ? { backgroundColor: color, borderColor: color } : undefined}
                      className={`w-full p-2 sm:p-3 rounded-lg text-left transition-all text-sm sm:text-base ${
                        isSelected
                          ? "text-white"
                          : "bg-white text-gray-900 border border-gray-300 hover:border-purple-400"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded border border-current flex items-center justify-center">
                          {isSelected && (
                            <div className="w-2 sm:w-3 h-2 sm:h-3 bg-current rounded-sm" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-medium">{candidate.full_name}</p>
                          <p className="text-xs sm:text-sm opacity-75 truncate">
                            {candidate.job_role}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Metrics */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {t("selectMetrics")}
              </h2>
              <div className="flex flex-col gap-2">
                {selectedCandidates.length === 0 ? (
                  <p className="text-xs text-gray-400">{t("selectCandidates")}</p>
                ) : (
                  [
                    { name: t("metrics.score"), id: SCORE_METRIC_ID },
                    ...availableAreas.map((area) => ({ name: area, id: area })),
                  ].map((metric) => (
                  <label
                    key={metric.id}
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer text-sm sm:text-base"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.id)}
                      onChange={() => toggleMetric(metric.id)}
                      className="w-3 sm:w-4 h-3 sm:h-4 rounded border-gray-300 text-purple-500"
                    />
                    <span className="text-gray-700">{metric.name}</span>
                  </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg p-4 sm:p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {t("radarChartTitle")}
                </h2>
                {loadingComparison && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              </div>

              {/* Radar Chart */}
              <div ref={chartContainerRef} className="w-full h-64 sm:h-96 mb-6 bg-white">
                {selectedCandidateDetails.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                    {t("selectCandidates")}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={performanceData}
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="subject" stroke="#6B7280" />
                      <PolarRadiusAxis stroke="#D1D5DB" />
                      {selectedCandidateDetails.map((candidate, index) => (
                        <Radar
                          key={candidate.id}
                          name={candidate.name}
                          dataKey={candidate.name}
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
                  disabled={selectedCandidateDetails.length === 0 || exporting !== null}
                  className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting === "png" ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {t("exportPNG")}
                </button>
                <button
                  onClick={handleExportPdf}
                  disabled={selectedCandidateDetails.length === 0 || exporting !== null}
                  className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting === "pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  {t("exportPDF")}
                </button>
                <button className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium text-sm sm:text-base">
                  <Link2 size={16} />
                  {t("linkAnalytics")}
                </button>
              </div>
            </div>
          </div>
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
    </div>
  );
}
