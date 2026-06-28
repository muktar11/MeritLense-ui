"use client";

import { Eye } from "lucide-react";
import type { Candidate } from "@/app/api/candidates/types";
import { SCORE_AREA_LABELS } from "@/app/api/scores/types";

interface MaintainanceWorkerTableProps {
  candidates: Candidate[];
  scores: Record<string, Record<string, number>>;
  onViewScores: (candidate: Candidate) => void;
}

export function MaintenanceWorkerTable({ candidates, scores, onViewScores }: MaintainanceWorkerTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Name</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Email</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">{SCORE_AREA_LABELS.MAINTENANCE}</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">{SCORE_AREA_LABELS.ORGANIZATION}</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">{SCORE_AREA_LABELS.ATTENTION_TO_DETAIL}</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">{SCORE_AREA_LABELS.RELIABILITY}</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">{SCORE_AREA_LABELS.PUNCTUALITY}</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">{SCORE_AREA_LABELS.COMMUNICATION}</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Avg</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => {
            const candidateScore = scores[candidate.id] || {};
            const avg = Object.values(candidateScore).length > 0
              ? Math.round(Object.values(candidateScore).reduce((a, b) => a + b, 0) / Object.values(candidateScore).length)
              : 0;

            return (
              <tr key={candidate.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 sm:px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
                      {candidate.first_name.charAt(0)}{candidate.last_name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{candidate.full_name}</span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 text-gray-600">{candidate.email}</td>
                <td className="px-4 sm:px-6 py-3 text-gray-600">{candidateScore.MAINTENANCE || '-'}</td>
                <td className="px-4 sm:px-6 py-3 text-gray-600">{candidateScore.ORGANIZATION || '-'}</td>
                <td className="px-4 sm:px-6 py-3 text-gray-600">{candidateScore.ATTENTION_TO_DETAIL || '-'}</td>
                <td className="px-4 sm:px-6 py-3 text-gray-600">{candidateScore.RELIABILITY || '-'}</td>
                <td className="px-4 sm:px-6 py-3 text-gray-600">{candidateScore.PUNCTUALITY || '-'}</td>
                <td className="px-4 sm:px-6 py-3 text-gray-600">{candidateScore.COMMUNICATION || '-'}</td>
                <td className="px-4 sm:px-6 py-3 font-medium text-purple-600">{avg || '-'}</td>
                <td className="px-4 sm:px-6 py-3">
                  <button
                    onClick={() => onViewScores(candidate)}
                    className="p-1 text-gray-400 hover:text-purple-600 rounded-full hover:bg-purple-50"
                    title="View Scores"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}