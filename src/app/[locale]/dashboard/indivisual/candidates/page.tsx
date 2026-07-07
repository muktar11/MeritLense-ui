// app/dashboard/individual/candidates/page.tsx (or your comparison page)
"use client";

import { useState, useEffect } from "react";
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
import { Download, FileText, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {CandidateModal} from "../candidates/components/candidate-modal";
import CandidatesTable from "../candidates/components/candidates-table";
import ShareModal from "../candidates/components/share-modal";
import candidateService from "../../../../api/candidates/endpoints";
import { Candidate } from "../../../../api/candidates/types";
import { useAuth } from "@/app/hooks/useAuth";

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
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "clearing", 
    "maintenance", 
    "communication"
  ]);

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

  // Prepare radar chart data based on selected candidates
  const getPerformanceData = () => {
    const baseData = [
      { subject: t("subjects.experience") },
      { subject: t("subjects.hardSkill") },
      { subject: t("subjects.softSkill") },
    ];

    // Add data for each selected candidate
    selectedCandidateDetails.forEach((candidate, index) => {
      const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];
      baseData.forEach((item, i) => {
        // Generate random scores for demo (replace with actual data from your backend)
        (item as any)[candidate.name] = Math.floor(Math.random() * 30) + 70;
      });
    });

    return baseData;
  };

  const performanceData = getPerformanceData();

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
                {candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => toggleCandidate(candidate.id)}
                    className={`w-full p-2 sm:p-3 rounded-lg text-left transition-all text-sm sm:text-base ${
                      selectedCandidates.includes(candidate.id)
                        ? "bg-purple-500 text-white"
                        : "bg-white text-gray-900 border border-gray-300 hover:border-purple-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded border border-current flex items-center justify-center">
                        {selectedCandidates.includes(candidate.id) && (
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
                ))}
              </div>
            </div>

            {/* Select Metrics */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {t("selectMetrics")}
              </h2>
              <div className="flex flex-col gap-2">
                {[
                  { name: t("metrics.clearing"), id: "clearing" },
                  { name: t("metrics.maintenance"), id: "maintenance" },
                  { name: t("metrics.communication"), id: "communication" },
                  { name: t("metrics.score"), id: "score" },
                  { name: t("metrics.experience"), id: "experience" },
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
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg p-4 sm:p-8 shadow-sm border border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                {t("radarChartTitle")}
              </h2>

              {/* Radar Chart */}
              <div className="w-full h-64 sm:h-96 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={performanceData}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                  >
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="subject" stroke="#6B7280" />
                    <PolarRadiusAxis stroke="#D1D5DB" />
                    {selectedCandidateDetails.map((candidate, index) => {
                      const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];
                      return (
                        <Radar
                          key={candidate.id}
                          name={candidate.name}
                          dataKey={candidate.name}
                          stroke={colors[index % colors.length]}
                          fill={colors[index % colors.length]}
                          fillOpacity={0.25}
                        />
                      );
                    })}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center sm:justify-start gap-3">
                <button className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition font-medium text-sm sm:text-base">
                  <Download size={16} />
                  {t("exportPNG")}
                </button>
                <button className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm sm:text-base">
                  <FileText size={16} />
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
    </div>
  );
}