"use client";

import { Eye } from "lucide-react";
import type { Candidate } from "@/app/api/candidates/types";
import type { CandidateScoreSummary } from "@/app/api/evaluations/types";

interface DynamicScoreTableProps {
  candidates: Candidate[];
  scores: Record<string, CandidateScoreSummary>;
  onViewScores: (candidate: Candidate) => void;
}

// Replaces the old per-job-role table components (driver-table.tsx,
// housekeeper-table.tsx, ...), which each hardcoded a fixed set of column
// keys (SAFE_DRIVING, CLEANING, ...) that never matched any real
// ScoringRule.competency_code. Columns here are built from whatever
// competencies actually exist in the real scoring data for the candidates
// being shown, so this works for any role/rule set without a per-role
// mapping to maintain.
export function DynamicScoreTable({ candidates, scores, onViewScores }: DynamicScoreTableProps) {
  const columns: { code: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const summary = scores[candidate.id];
    if (!summary) continue;
    for (const competency of summary.competencies) {
      if (!seen.has(competency.code)) {
        seen.add(competency.code);
        columns.push({ code: competency.code, name: competency.name });
      }
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Name</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Email</th>
            {columns.map((column) => (
              <th key={column.code} className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">
                {column.name}
              </th>
            ))}
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Avg</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => {
            const summary = scores[candidate.id];
            const byCode = new Map(summary?.competencies.map((c) => [c.code, c.percentage]) ?? []);

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
                {columns.map((column) => (
                  <td key={column.code} className="px-4 sm:px-6 py-3 text-gray-600">
                    {byCode.has(column.code) ? `${byCode.get(column.code)}%` : "-"}
                  </td>
                ))}
                <td className="px-4 sm:px-6 py-3 font-medium text-purple-600">
                  {summary ? `${summary.overall_percentage}%` : "-"}
                </td>
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
