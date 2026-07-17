"use client";

import { useEffect, useState } from "react";
import { X, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, PlayCircle } from "lucide-react";
import evaluationService from "@/app/api/evaluations/endpoints";
import type {
  SessionEvaluationSummary,
  ResponseEvaluationResult,
  CompetencyEvaluationResult,
  CompetencyStatus,
  SessionEvaluationStatus,
} from "@/app/api/evaluations/types";

interface EvaluationResultsModalProps {
  evaluationId: string | null;
  candidateName: string;
  onClose: () => void;
}

function statusColor(status: CompetencyStatus) {
  switch (status) {
    case "MEETS_THRESHOLD":
      return "bg-green-100 text-green-700";
    case "BELOW_THRESHOLD":
      return "bg-amber-100 text-amber-700";
    case "EVALUATED":
      return "bg-blue-100 text-blue-700";
    case "NOT_STARTED":
    case "INCOMPLETE":
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function sessionStatusColor(status: SessionEvaluationStatus) {
  switch (status) {
    case "EVALUATED":
      return "bg-green-100 text-green-700";
    case "REQUIRES_HUMAN_REVIEW":
      return "bg-amber-100 text-amber-700";
    case "EVALUATION_FAILED":
      return "bg-red-100 text-red-700";
    case "PARTIALLY_EVALUATED":
    case "PENDING":
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function EvaluationResultsModal({ evaluationId, candidateName, onClose }: EvaluationResultsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionEvaluationSummary | null>(null);
  const [competencyResults, setCompetencyResults] = useState<CompetencyEvaluationResult[]>([]);
  const [responseResults, setResponseResults] = useState<ResponseEvaluationResult[]>([]);
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null);
  const [runningScoring, setRunningScoring] = useState(false);

  const load = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const summaryData = await evaluationService.getScoringSummary(id);
      setSummary(summaryData);
      if (summaryData) {
        const [competencies, responses] = await Promise.all([
          evaluationService.getCompetencyResults(id),
          evaluationService.getResponseResults(id),
        ]);
        setCompetencyResults(competencies);
        setResponseResults(responses);
      } else {
        setCompetencyResults([]);
        setResponseResults([]);
      }
    } catch {
      setError("Failed to load evaluation results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!evaluationId) return;
    load(evaluationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationId]);

  const handleRunScoring = async () => {
    if (!evaluationId) return;
    setRunningScoring(true);
    setError(null);
    try {
      await evaluationService.runScoring(evaluationId);
      await load(evaluationId);
    } catch (err: any) {
      const msg = err?.detail ?? err?.response?.data?.detail ?? "Failed to run scoring. Try again.";
      setError(msg);
    } finally {
      setRunningScoring(false);
    }
  };

  if (!evaluationId) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={onClose} />

      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl pointer-events-auto relative max-h-[85vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10">
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI Interview Results</h3>
              <p className="text-sm text-gray-500">{candidateName}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {!loading && !summary && (
            <div className="text-center py-10">
              <p className="text-sm text-gray-500 mb-4">Scoring hasn&apos;t run yet for this interview.</p>
              <button
                type="button"
                onClick={handleRunScoring}
                disabled={runningScoring}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {runningScoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                Run Scoring
              </button>
            </div>
          )}

          {!loading && summary && (
            <div className="space-y-6">
              {/* Header summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Overall Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.overall_percentage}%{" "}
                    <span className="text-sm font-normal text-gray-400">
                      ({summary.total_score}/{summary.max_score})
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sessionStatusColor(summary.status)}`}>
                    {summary.status.replace(/_/g, " ")}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">Rule set {summary.rule_set_version}</p>
                </div>
              </div>

              {summary.critical_failures.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700 space-y-1">
                    <p className="font-medium">Critical failures</p>
                    {summary.critical_failures.map((failure) => (
                      <p key={failure.response_id} className="text-xs">
                        <span className="font-medium">{failure.competency_code.replace(/_/g, " ")}:</span>{" "}
                        {failure.explanation}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Competency table */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Competency Breakdown</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Competency</th>
                        <th className="text-left px-3 py-2 font-medium">Score</th>
                        <th className="text-left px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {competencyResults.map((c) => (
                        <tr key={c.id}>
                          <td className="px-3 py-2 text-gray-900">{c.competency_name}</td>
                          <td className="px-3 py-2 text-gray-600">
                            {c.total_score}/{c.max_score} ({c.percentage}%)
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(c.status)}`}>
                              {c.status.replace(/_/g, " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {competencyResults.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-gray-400 text-xs">
                            No competency results available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Response-level drill-down */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Response Detail</h4>
                <div className="space-y-2">
                  {responseResults.map((r) => {
                    const expanded = expandedResponseId === r.id;
                    return (
                      <div key={r.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedResponseId(expanded ? null : r.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            {r.critical_failure ? (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                            <span className="text-sm font-medium text-gray-900">{r.competency_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {r.score}/{r.max_score} ({r.percentage}%)
                            </span>
                            {expanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>
                        {expanded && (
                          <div className="px-3 pb-3 pt-1 text-xs text-gray-600 space-y-2 border-t border-gray-100">
                            {r.explanation && <p>{r.explanation}</p>}
                            {r.matched_indicators.length > 0 && (
                              <IndicatorRow label="Matched" items={r.matched_indicators} color="green" />
                            )}
                            {r.missing_indicators.length > 0 && (
                              <IndicatorRow label="Missing" items={r.missing_indicators} color="amber" />
                            )}
                            {r.risk_flags.length > 0 && (
                              <IndicatorRow label="Risk flags" items={r.risk_flags} color="red" />
                            )}
                            {r.requires_human_review && (
                              <p className="text-amber-600 font-medium">⚠ Requires human review</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {responseResults.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No response-level results available.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IndicatorRow({ label, items, color }: { label: string; items: string[]; color: "green" | "amber" | "red" }) {
  const chipColor = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  }[color];
  return (
    <div>
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span key={i} className={`px-2 py-0.5 rounded-full ${chipColor}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
