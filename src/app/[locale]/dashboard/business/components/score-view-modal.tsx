"use client";

import { X, Calendar, User, Mail, Hash } from "lucide-react";
import { useTranslations } from "next-intl";
import { SCORE_AREA_LABELS } from "@/app/api/scores/types";
import type { Candidate } from "@/app/api/candidates/types";

interface ScoreViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  scores: Record<string, number>;
  averageScore?: number;
}

export function ScoreViewModal({
  isOpen,
  onClose,
  candidate,
  scores,
  averageScore,
}: ScoreViewModalProps) {
  const t = useTranslations("dashboard.business.score-management");

  if (!isOpen || !candidate) return null;

  const calculatedAverage = averageScore || 
    (Object.values(scores).length > 0 
      ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length) 
      : 0);

  const sortedScores = Object.entries(scores).sort(([a], [b]) => 
    (SCORE_AREA_LABELS[a] || a).localeCompare(SCORE_AREA_LABELS[b] || b)
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={onClose} />
      
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl pointer-events-auto relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-2 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            Score Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-linear-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{candidate.full_name}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{candidate.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Passport ID</p>
                <p className="text-sm font-medium text-gray-900">{candidate.passport_id}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Job Role</p>
                <p className="text-sm font-medium text-gray-900">{candidate.job_role}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Preferred Language</p>
                <p className="text-sm font-medium text-gray-900">{candidate.preferred_language}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Average Score</span>
              <span className="text-2xl font-bold text-purple-600">{calculatedAverage}%</span>
            </div>
          </div>
        </div>

        {sortedScores.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              Skill Scores Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedScores.map(([area, score]) => (
                <div 
                  key={area} 
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      {SCORE_AREA_LABELS[area] || area}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{area}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="font-semibold text-purple-600 min-w-11.25 text-right">
                      {score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No scores available for this candidate yet.</p>
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}