"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardHeader from "../components/dashboard-header";
import { ArrowRight, GitCompare } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import {CandidateModal} from "../candidates/components/candidate-modal";
import CandidatesTable from "../candidates/components/candidates-table";
import ShareModal from "../candidates/components/share-modal";
import candidateService from "../../../../api/candidates/endpoints";
import { Candidate } from "../../../../api/candidates/types";
import { useAuth } from "@/app/hooks/useAuth";

export default function Candidates() {
  const t = useTranslations("dashboard.indivisual.candidates");
  const tCompare = useTranslations("dashboard.compareCandidates");
  const locale = useLocale();
  const { userRole, userId, isAuthenticated, loading: authLoading } = useAuth();

  // State for candidates
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
            currentUserId={userId || undefined}
          />
        </div>

        {/* Comparison now has its own page (sidebar: Compare Candidates). */}
        <Link
          href={`/${locale}/dashboard/indivisual/compare-candidates`}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-purple-300 sm:p-6"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
            <GitCompare className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-gray-900">{tCompare("title")}</span>
            <span className="block text-sm text-gray-500">{tCompare("subtitle")}</span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-gray-400 rtl:rotate-180" />
        </Link>
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
