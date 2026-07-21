"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import evaluationService from "@/app/api/evaluations/endpoints";
import type {
  ScoringRuleSet,
  ScoringRuleSetPayload,
  ScoringRulePayload,
  ScoringMethod,
} from "@/app/api/evaluations/types";
import { SCORING_METHODS } from "@/app/api/evaluations/types";
import { CANDIDATE_JOB_ROLES, EVALUATION_TIERS } from "@/app/api/interviews/types";

interface ScoringRuleSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ruleSetToEdit: ScoringRuleSet | null;
}

// Form-level shapes keep list/dict fields as editable text so the inputs
// don't fight the user while typing; they're parsed into the real
// array/dict payload shapes only on submit.
interface RuleFormRow {
  competency_code: string;
  competency_name: string;
  question_code: string;
  expected_indicators: string;
  required_indicators: string;
  weighted_indicators: string;
  critical_failure_indicators: string;
  risk_flags: string;
  max_score: string;
  pass_threshold: string;
  scoring_method: ScoringMethod;
  is_active: boolean;
}

const emptyRule = (): RuleFormRow => ({
  competency_code: "",
  competency_name: "",
  question_code: "",
  expected_indicators: "",
  required_indicators: "",
  weighted_indicators: "",
  critical_failure_indicators: "",
  risk_flags: "",
  max_score: "10.00",
  pass_threshold: "7.00",
  scoring_method: "WEIGHTED_INDICATOR_MATCH",
  is_active: true,
});

interface RuleSetForm {
  role_code: string;
  role_name: string;
  name: string;
  version: string;
  description: string;
  evaluation_tier: ScoringRuleSetPayload["evaluation_tier"];
  is_active: boolean;
  rules: RuleFormRow[];
}

const initialForm = (): RuleSetForm => ({
  role_code: CANDIDATE_JOB_ROLES[0].code,
  role_name: CANDIDATE_JOB_ROLES[0].name,
  name: "",
  version: "v1",
  description: "",
  evaluation_tier: "FULL",
  is_active: true,
  rules: [emptyRule()],
});

function parseList(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatList(items: string[]): string {
  return (items || []).join(", ");
}

function parseWeightedIndicators(text: string): Record<string, number> {
  const result: Record<string, number> = {};
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [key, weight] = line.split(":").map((s) => s.trim());
      if (key && weight && !isNaN(Number(weight))) {
        result[key] = Number(weight);
      }
    });
  return result;
}

function formatWeightedIndicators(dict: Record<string, string> | undefined): string {
  if (!dict) return "";
  return Object.entries(dict)
    .map(([key, weight]) => `${key}: ${weight}`)
    .join("\n");
}

export function ScoringRuleSetModal({ isOpen, onClose, onSuccess, ruleSetToEdit }: ScoringRuleSetModalProps) {
  const [form, setForm] = useState<RuleSetForm>(initialForm());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!ruleSetToEdit;
  const locked = !!ruleSetToEdit?.has_usage;

  useEffect(() => {
    if (isOpen) {
      if (ruleSetToEdit) {
        setForm({
          role_code: ruleSetToEdit.role_code,
          role_name: ruleSetToEdit.role_name,
          name: ruleSetToEdit.name,
          version: ruleSetToEdit.version,
          description: ruleSetToEdit.description,
          evaluation_tier: ruleSetToEdit.evaluation_tier,
          is_active: ruleSetToEdit.is_active,
          rules: ruleSetToEdit.rules.length
            ? ruleSetToEdit.rules.map((r) => ({
                competency_code: r.competency_code,
                competency_name: r.competency_name,
                question_code: r.question_code,
                expected_indicators: formatList(r.expected_indicators),
                required_indicators: formatList(r.required_indicators),
                weighted_indicators: formatWeightedIndicators(r.weighted_indicators),
                critical_failure_indicators: formatList(r.critical_failure_indicators),
                risk_flags: formatList(r.risk_flags),
                max_score: r.max_score,
                pass_threshold: r.pass_threshold,
                scoring_method: r.scoring_method,
                is_active: r.is_active,
              }))
            : [emptyRule()],
        });
      } else {
        setForm(initialForm());
      }
      setErrors({});
    }
  }, [isOpen, ruleSetToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const updateRule = (index: number, patch: Partial<RuleFormRow>) => {
    setForm((prev) => ({
      ...prev,
      rules: prev.rules.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
  };

  const addRule = () => {
    setForm((prev) => ({ ...prev, rules: [...prev.rules, emptyRule()] }));
  };

  const removeRule = (index: number) => {
    setForm((prev) => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.version.trim()) newErrors.version = "Version is required";
    if (form.rules.length === 0) newErrors.rules = "At least one rule is required";
    form.rules.forEach((r, i) => {
      if (!r.competency_code.trim()) newErrors[`rule_${i}_competency_code`] = "Competency code is required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: ScoringRuleSetPayload = {
        name: form.name,
        version: form.version,
        description: form.description,
        role_code: form.role_code,
        role_name: form.role_name,
        evaluation_tier: form.evaluation_tier,
        is_active: form.is_active,
        rules: form.rules.map<ScoringRulePayload>((r) => ({
          competency_code: r.competency_code,
          competency_name: r.competency_name,
          question_code: r.question_code,
          expected_indicators: parseList(r.expected_indicators),
          required_indicators: parseList(r.required_indicators),
          weighted_indicators: parseWeightedIndicators(r.weighted_indicators),
          critical_failure_indicators: parseList(r.critical_failure_indicators),
          risk_flags: parseList(r.risk_flags),
          max_score: r.max_score,
          pass_threshold: r.pass_threshold,
          scoring_method: r.scoring_method,
          is_active: r.is_active,
        })),
      };

      if (isEditMode && ruleSetToEdit) {
        await evaluationService.updateRuleSet(ruleSetToEdit.id, payload);
      } else {
        await evaluationService.createRuleSet(payload);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      const data = error?.response?.data;
      if (data && typeof data === "object") {
        const backendErrors: Record<string, string> = {};
        Object.entries(data).forEach(([key, value]) => {
          backendErrors[key] = Array.isArray(value) ? String(value[0]) : String(value);
        });
        setErrors(backendErrors);
      } else {
        setErrors({ form: "Failed to save scoring rule set. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500";
  const labelClass = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    {isEditMode ? "Edit Scoring Rule Set" : "New Scoring Rule Set"}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                {locked && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                    This rule set has already been used to score at least one evaluation and can no longer be
                    modified — this is enforced by the backend to keep historical scores reproducible. Create a new
                    version instead.
                  </p>
                )}

                {errors.form && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-4">
                    {errors.form}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-left max-h-[70vh] overflow-y-auto pr-1">
                  <fieldset disabled={locked} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Role</label>
                        <select
                          name="role_code"
                          value={form.role_code}
                          onChange={(e) => {
                            const role = CANDIDATE_JOB_ROLES.find((r) => r.code === e.target.value);
                            setForm((prev) => ({ ...prev, role_code: e.target.value, role_name: role?.name ?? prev.role_name }));
                          }}
                          className={inputClass}
                        >
                          {CANDIDATE_JOB_ROLES.map((role) => (
                            <option key={role.code} value={role.code}>
                              {role.icon} {role.name} ({role.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Evaluation Tier</label>
                        <select name="evaluation_tier" value={form.evaluation_tier} onChange={handleChange} className={inputClass}>
                          {EVALUATION_TIERS.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Must match the Interview Configuration&apos;s tier used for this role.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Name</label>
                        <input name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="e.g. Nursing Assistant Default" />
                        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Version</label>
                        <input name="version" value={form.version} onChange={handleChange} className={inputClass} placeholder="e.g. v1" />
                        {errors.version && <p className="text-xs text-red-600 mt-1">{errors.version}</p>}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Description</label>
                      <input name="description" value={form.description} onChange={handleChange} className={inputClass} placeholder="optional" />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="rounded border-gray-300 text-purple-600" />
                      Active
                    </label>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">Rules</p>
                        <button
                          type="button"
                          onClick={addRule}
                          className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Rule
                        </button>
                      </div>
                      {errors.rules && <p className="text-xs text-red-600 mb-2">{errors.rules}</p>}

                      <div className="space-y-3">
                        {form.rules.map((rule, i) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-gray-500">Rule {i + 1}</p>
                              {form.rules.length > 1 && (
                                <button type="button" onClick={() => removeRule(i)} className="text-red-500 hover:text-red-700">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className={labelClass}>Competency Code</label>
                                <input
                                  value={rule.competency_code}
                                  onChange={(e) => updateRule(i, { competency_code: e.target.value })}
                                  className={inputClass}
                                  placeholder="e.g. safety_awareness — must match the question's Skill Tag"
                                />
                                {errors[`rule_${i}_competency_code`] && (
                                  <p className="text-xs text-red-600 mt-1">{errors[`rule_${i}_competency_code`]}</p>
                                )}
                              </div>
                              <div>
                                <label className={labelClass}>Competency Name</label>
                                <input
                                  value={rule.competency_name}
                                  onChange={(e) => updateRule(i, { competency_name: e.target.value })}
                                  className={inputClass}
                                  placeholder="e.g. Safety Awareness"
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Question Code</label>
                                <input
                                  value={rule.question_code}
                                  onChange={(e) => updateRule(i, { question_code: e.target.value })}
                                  className={inputClass}
                                  placeholder="matches Question Template's code"
                                />
                              </div>
                            </div>

                            <div>
                              <label className={labelClass}>
                                Expected Indicators <span className="text-gray-400 font-normal">(comma-separated)</span>
                              </label>
                              <input
                                value={rule.expected_indicators}
                                onChange={(e) => updateRule(i, { expected_indicators: e.target.value })}
                                className={inputClass}
                                placeholder="identify hazard, clean spill, prevent recurrence"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={labelClass}>
                                  Required Indicators <span className="text-gray-400 font-normal">(must be present, or score = 0)</span>
                                </label>
                                <input
                                  value={rule.required_indicators}
                                  onChange={(e) => updateRule(i, { required_indicators: e.target.value })}
                                  className={inputClass}
                                  placeholder="identify hazard"
                                />
                              </div>
                              <div>
                                <label className={labelClass}>
                                  Critical Failure Indicators <span className="text-gray-400 font-normal">(zeroes score, flags review)</span>
                                </label>
                                <input
                                  value={rule.critical_failure_indicators}
                                  onChange={(e) => updateRule(i, { critical_failure_indicators: e.target.value })}
                                  className={inputClass}
                                  placeholder="e.g. ignored unresponsive patient"
                                />
                              </div>
                            </div>

                            <div>
                              <label className={labelClass}>
                                Weighted Indicators <span className="text-gray-400 font-normal">(one per line, &quot;indicator: weight&quot;)</span>
                              </label>
                              <textarea
                                value={rule.weighted_indicators}
                                onChange={(e) => updateRule(i, { weighted_indicators: e.target.value })}
                                className={inputClass}
                                rows={3}
                                placeholder={"identify hazard: 4\nclean spill: 3\nprevent recurrence: 3"}
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className={labelClass}>Max Score</label>
                                <input
                                  value={rule.max_score}
                                  onChange={(e) => updateRule(i, { max_score: e.target.value })}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Pass Threshold</label>
                                <input
                                  value={rule.pass_threshold}
                                  onChange={(e) => updateRule(i, { pass_threshold: e.target.value })}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Scoring Method</label>
                                <select
                                  value={rule.scoring_method}
                                  onChange={(e) => updateRule(i, { scoring_method: e.target.value as ScoringMethod })}
                                  className={inputClass}
                                >
                                  {SCORING_METHODS.map((m) => (
                                    <option key={m.value} value={m.value}>
                                      {m.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <label className="flex items-center gap-2 text-xs text-gray-700">
                              <input
                                type="checkbox"
                                checked={rule.is_active}
                                onChange={(e) => updateRule(i, { is_active: e.target.checked })}
                                className="rounded border-gray-300 text-purple-600"
                              />
                              Active
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </fieldset>

                  {!locked && (
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                      <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEditMode ? "Save Changes" : "Create Rule Set"}
                      </button>
                    </div>
                  )}
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
