"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Candidate } from "@/app/api/candidates/types";
import { ScoreSet } from "@/app/api/scores/types";
import { DriverTable } from "../score-management/score-tables/driver-table";
import { HousekeeperTable } from "../score-management/score-tables/housekeeper-table";
import { JobRoleTabs } from "./job-role-tabs";
import { ScoreViewModal } from "./score-view-modal";
import candidateService from "@/app/api/candidates/endpoints";
import scoreService from "@/app/api/scores/endpoints";
import { OtherTable } from "../score-management/score-tables/other-table";
import { MaintenanceWorkerTable } from "../score-management/score-tables/maintenance-worker-table";
import { KitchenAssistantTable } from "../score-management/score-tables/kitchen-assistant-table";
import { NursingAssistantTable } from "../score-management/score-tables/nursing-assistant-table";
import { ElderCompanionTable } from "../score-management/score-tables/elder-companion-table";


const JOB_ROLE_DISPLAY: Record<string, string> = {
  "HK": "Housekeeper",
  "EC": "Elder Companion",
  "NA": "Nursing Assistant",
  "DR": "Driver",
  "KA": "Kitchen Assistant",
  "MW": "Maintenance Worker",
  "OT": "Other",
};

export function ScoreManagement() {
  const t = useTranslations("dashboard.business.score-management");
  const locale = useLocale();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesByRole, setCandidatesByRole] = useState<Record<string, Candidate[]>>({});
  const [candidateScores, setCandidateScores] = useState<Record<string, Record<string, number>>>({});
  const [scoreSets, setScoreSets] = useState<Record<string, ScoreSet>>({});
  const [loading, setLoading] = useState(true);
  
  const [selectedRole, setSelectedRole] = useState<string>("HK");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedCandidateScoreSet, setSelectedCandidateScoreSet] = useState<ScoreSet | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const candidatesData = await candidateService.getCandidates();
      setCandidates(candidatesData);

      const grouped: Record<string, Candidate[]> = {};
      candidatesData.forEach(candidate => {
        const role = candidate.job_role || "OT";
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

      const allScoreSets = await scoreService.getScoreSets();
      
      const scoresMap: Record<string, Record<string, number>> = {};
      const setsMap: Record<string, ScoreSet> = {};
      
      allScoreSets.forEach(scoreSet => {
        const candidateId = scoreSet.candidate;
        setsMap[candidateId] = scoreSet;
        scoresMap[candidateId] = scoreSet.scores_dict;
      });
      
      setCandidateScores(scoresMap);
      setScoreSets(setsMap);

    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewScores = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setSelectedCandidateScoreSet(scoreSets[candidate.id] || null);
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

  const renderTable = () => {
    const filteredCandidates = getFilteredCandidates();

    switch (selectedRole) {
      case "HK":
        return (
          <HousekeeperTable
            candidates={filteredCandidates}
            scores={candidateScores}
            onViewScores={handleViewScores}
          />
        );
      case "DR":
        return (
          <DriverTable
            candidates={filteredCandidates}
            scores={candidateScores}
            onViewScores={handleViewScores}
          />
        );
      case "EC":
        return (
          <ElderCompanionTable
            candidates={filteredCandidates}
            scores={candidateScores}
            onViewScores={handleViewScores}
          />
        );
      case "NA":
        return (
          <NursingAssistantTable
            candidates={filteredCandidates}
            scores={candidateScores}
            onViewScores={handleViewScores}
          />
        );
      case "KA":
        return (
          <KitchenAssistantTable
            candidates={filteredCandidates}
            scores={candidateScores}
            onViewScores={handleViewScores}
          />
        );
      case "MW":
        return (
          <MaintenanceWorkerTable
            candidates={filteredCandidates}
            scores={candidateScores}
            onViewScores={handleViewScores}
          />
        );
      case "OT":
        return (
          <OtherTable
            candidates={filteredCandidates}
            scores={candidateScores}
            onViewScores={handleViewScores}
          />
        );
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            No candidates found for this role
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidates and scores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Candidate Score Management</h1>
        <p className="text-gray-600">View candidate scores categorized by job role</p>
      </div>

      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-2 max-w-md">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search candidates by name or email..."
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
            {JOB_ROLE_DISPLAY[selectedRole] || selectedRole} Candidates
          </h2>
        </div>

        {renderTable()}

        {getFilteredCandidates().length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No candidates found for this role</p>
          </div>
        )}
      </div>

      <ScoreViewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCandidate(null);
          setSelectedCandidateScoreSet(null);
        }}
        candidate={selectedCandidate}
        scores={selectedCandidate ? candidateScores[selectedCandidate.id] || {} : {}}
        averageScore={selectedCandidateScoreSet?.average_score ? parseFloat(selectedCandidateScoreSet.average_score.toString()) : undefined}
      />
    </div>
  );
}