"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import DashboardHeader from "../components/dashboard-header";
import { Search, Filter } from "lucide-react";
import EvaluationTable from "../components/evaluation-table";
import EvaluationModal from "../components/schedule-evaluation-modal";
import CompleteEvaluationModal from "../components/complete-evaluation-modal";
import StartSessionModal from "../components/start-session-modal";
import evaluationService from "@/app/api/evaluations/endpoints";
import candidateService from "@/app/api/candidates/endpoints";
import type { EvaluationListItem, Evaluation, CreateEvaluationData } from "@/app/api/evaluations/types";
import type { Candidate } from "@/app/api/candidates/types";
import type { InterviewSession } from "@/app/api/interviews/types";
import { EVALUATION_TYPES, EVALUATION_STATUS } from "@/app/api/evaluations/types";

type ModalMode = 'view' | 'create' | 'edit' | 'reschedule';

export default function EvaluationManagement() {
  const { userRole } = useAuth();

  const [evaluations, setEvaluations] = useState<EvaluationListItem[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<EvaluationListItem[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionCandidate, setSessionCandidate] = useState<Candidate | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterEvaluations();
  }, [evaluations, statusFilter, typeFilter, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evaluationsData, candidatesData] = await Promise.all([
        evaluationService.getEvaluations(),
        candidateService.getCandidates()
      ]);
      setEvaluations(evaluationsData);
      setFilteredEvaluations(evaluationsData);
      setCandidates(candidatesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvaluations = () => {
    let filtered = [...evaluations];

    if (statusFilter) {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter(e => e.evaluation_type === typeFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.candidate_name.toLowerCase().includes(term)
      );
    }

    setFilteredEvaluations(filtered);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedEvaluation(null);
    setIsModalOpen(true);
  };

  const handleOpenViewModal = async (item: EvaluationListItem) => {
    try {
      const fullEvaluation = await evaluationService.getEvaluation(item.id);
      setSelectedEvaluation(fullEvaluation);
      setModalMode('view');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch evaluation details:', error);
    }
  };

  const handleOpenEditModal = async (item: EvaluationListItem) => {
    try {
      const fullEvaluation = await evaluationService.getEvaluation(item.id);
      setSelectedEvaluation(fullEvaluation);
      setModalMode('edit');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch evaluation details:', error);
    }
  };

  const handleOpenRescheduleModal = async (item: EvaluationListItem) => {
    try {
      const fullEvaluation = await evaluationService.getEvaluation(item.id);
      setSelectedEvaluation(fullEvaluation);
      setModalMode('reschedule');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch evaluation details:', error);
    }
  };

  const handleOpenCompleteModal = (item: EvaluationListItem) => {
    setSelectedEvaluation(item as any);
    setIsCompleteModalOpen(true);
  };

  const handleOpenSessionModal = (item: EvaluationListItem) => {
    const matched = candidates.find(c => c.full_name === item.candidate_name) ?? null;
    setSessionCandidate(matched);
    setIsSessionModalOpen(true);
  };

  const handleCreateEvaluation = async (data: CreateEvaluationData): Promise<boolean> => {
    try {
      await evaluationService.createEvaluation(data);
      await fetchData();
      return true;
    } catch (error) {
      console.error('Failed to create evaluation:', error);
      return false;
    }
  };

  const handleEditEvaluation = async (data: CreateEvaluationData): Promise<boolean> => {
    if (!selectedEvaluation) return false;
    try {
      await evaluationService.updateEvaluation(selectedEvaluation.id, data);
      await fetchData();
      return true;
    } catch (error) {
      console.error('Failed to update evaluation:', error);
      return false;
    }
  };

  const handleRescheduleEvaluation = async (data: { new_date: string; reason?: string }): Promise<boolean> => {
    if (!selectedEvaluation) return false;
    try {
      await evaluationService.rescheduleEvaluation(selectedEvaluation.id, data);
      await fetchData();
      return true;
    } catch (error) {
      console.error('Failed to reschedule evaluation:', error);
      return false;
    }
  };

  const handleCompleteEvaluation = async (data: any): Promise<boolean> => {
    if (!selectedEvaluation) return false;
    try {
      await evaluationService.completeEvaluation(selectedEvaluation.id, data);
      await fetchData();
      return true;
    } catch (error) {
      console.error('Failed to complete evaluation:', error);
      return false;
    }
  };

  const handleCancelEvaluation = async (item: EvaluationListItem) => {
    if (!confirm('Are you sure you want to cancel this evaluation?')) return;
    try {
      await evaluationService.cancelEvaluation(item.id, { reason: 'Cancelled by user' });
      await fetchData();
    } catch (error) {
      console.error('Failed to cancel evaluation:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Types</option>
              {EVALUATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Status</option>
              {EVALUATION_STATUS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-100 text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Evaluation Management</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSessionCandidate(null); setIsSessionModalOpen(true); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
              >
                + Start AI Interview
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
              >
                + Schedule Evaluation
              </button>
            </div>
          </div>

          <EvaluationTable
            data={filteredEvaluations}
            onViewDetails={handleOpenViewModal}
            onEdit={handleOpenEditModal}
            onComplete={handleOpenCompleteModal}
            onCancel={handleCancelEvaluation}
            onReschedule={handleOpenRescheduleModal}
            onStartSession={handleOpenSessionModal}
            userRole={userRole || undefined}
          />
        </div>
      </div>

      <EvaluationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={modalMode === 'create' ? handleCreateEvaluation : handleEditEvaluation}
        onReschedule={handleRescheduleEvaluation}
        mode={modalMode}
        evaluation={selectedEvaluation || undefined}
        candidates={candidates}
        userRole={userRole || undefined}
      />

      {selectedEvaluation && (
        <CompleteEvaluationModal
          isOpen={isCompleteModalOpen}
          onClose={() => {
            setIsCompleteModalOpen(false);
            setSelectedEvaluation(null);
          }}
          onSubmit={handleCompleteEvaluation}
          candidateName={selectedEvaluation.candidate_first_name + ' ' + selectedEvaluation.candidate_last_name}
        />
      )}

      <StartSessionModal
        isOpen={isSessionModalOpen}
        onClose={() => { setIsSessionModalOpen(false); setSessionCandidate(null); }}
        candidate={sessionCandidate}
        candidates={candidates}
        onSuccess={(_session: InterviewSession) => fetchData()}
      />
    </main>
  );
}
