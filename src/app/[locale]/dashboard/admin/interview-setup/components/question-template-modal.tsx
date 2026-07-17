"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2 } from "lucide-react";
import interviewService from "@/app/api/interviews/endpoints";
import type { QuestionTemplate, QuestionTemplatePayload } from "@/app/api/interviews/types";
import {
  CANDIDATE_JOB_ROLES,
  QUESTION_DIFFICULTIES,
  QUESTION_TYPES,
  QUESTION_FORMATS,
  EXPECTED_ANSWER_TYPES,
  QUESTION_STATUSES,
  EVALUATION_TIERS,
} from "@/app/api/interviews/types";

interface QuestionTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  templateToEdit: QuestionTemplate | null;
}

const initialForm: QuestionTemplatePayload = {
  role_name: "",
  role_code: CANDIDATE_JOB_ROLES[0].code,
  question_code: "",
  question_status: "active",
  domain: "",
  skill_tag: "",
  skill: "",
  sequence_number: undefined,
  difficulty: "MEDIUM",
  question_text: "",
  question_type: "knowledge",
  question_format: "TEXT",
  language: "EN",
  expected_answer_type: "structured",
  evaluation_tier: "BOTH",
  is_mandatory: true,
  follow_up_allowed: false,
  critical_question: false,
  is_active: true,
};

export function QuestionTemplateModal({ isOpen, onClose, onSuccess, templateToEdit }: QuestionTemplateModalProps) {
  const [form, setForm] = useState<QuestionTemplatePayload>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!templateToEdit;

  useEffect(() => {
    if (isOpen) {
      if (templateToEdit) {
        setForm({
          role_name: templateToEdit.role_name,
          role_code: templateToEdit.role_code,
          question_code: templateToEdit.question_code,
          question_version: templateToEdit.question_version,
          question_status: templateToEdit.question_status,
          domain: templateToEdit.domain,
          skill_tag: templateToEdit.skill_tag,
          skill: templateToEdit.skill,
          sequence_number: templateToEdit.sequence_number,
          difficulty: templateToEdit.difficulty,
          question_text: templateToEdit.question_text,
          question_type: templateToEdit.question_type,
          question_format: templateToEdit.question_format,
          weight: templateToEdit.weight,
          language: templateToEdit.language,
          scoring_type: templateToEdit.scoring_type,
          estimated_time_seconds: templateToEdit.estimated_time_seconds,
          expected_answer_type: templateToEdit.expected_answer_type,
          evaluation_tier: templateToEdit.evaluation_tier,
          rubric_version: templateToEdit.rubric_version,
          question_set_version: templateToEdit.question_set_version,
          is_mandatory: templateToEdit.is_mandatory,
          follow_up_allowed: templateToEdit.follow_up_allowed,
          critical_question: templateToEdit.critical_question,
          is_active: templateToEdit.is_active,
        });
      } else {
        setForm(initialForm);
      }
      setErrors({});
    }
  }, [isOpen, templateToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.role_name.trim()) newErrors.role_name = "Role name is required";
    if (!form.role_code.trim()) newErrors.role_code = "Role code is required";
    if (!form.domain.trim()) newErrors.domain = "Domain is required";
    if (!form.skill.trim()) newErrors.skill = "Skill is required";
    if (!form.question_text.trim()) newErrors.question_text = "Question text is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: QuestionTemplatePayload = {
        ...form,
        skill_tag: form.skill_tag || form.skill,
        sequence_number: form.sequence_number ? Number(form.sequence_number) : undefined,
      };
      if (isEditMode && templateToEdit) {
        await interviewService.updateQuestionTemplate(templateToEdit.id, payload);
      } else {
        await interviewService.createQuestionTemplate(payload);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      const data = error?.response?.data;
      if (data && typeof data === 'object') {
        const backendErrors: Record<string, string> = {};
        Object.entries(data).forEach(([key, value]) => {
          backendErrors[key] = Array.isArray(value) ? String(value[0]) : String(value);
        });
        setErrors(backendErrors);
      } else {
        setErrors({ form: 'Failed to save question template. Please try again.' });
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    {isEditMode ? 'Edit Question Template' : 'New Question Template'}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                {errors.form && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-4">
                    {errors.form}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-left max-h-[65vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Role</label>
                      <select name="role_code" value={form.role_code} onChange={(e) => {
                        const role = CANDIDATE_JOB_ROLES.find(r => r.code === e.target.value);
                        setForm(prev => ({ ...prev, role_code: e.target.value, role_name: role?.name ?? prev.role_name }));
                      }} className={inputClass}>
                        {CANDIDATE_JOB_ROLES.map(role => (
                          <option key={role.code} value={role.code}>{role.icon} {role.name} ({role.code})</option>
                        ))}
                      </select>
                      {errors.role_code && <p className="text-xs text-red-600 mt-1">{errors.role_code}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Language</label>
                      <select name="language" value={form.language} onChange={handleChange} className={inputClass}>
                        <option value="EN">English</option>
                        <option value="AR">Arabic</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Question Text</label>
                    <textarea
                      name="question_text"
                      value={form.question_text}
                      onChange={handleChange}
                      rows={3}
                      className={inputClass}
                      placeholder="e.g. You notice a spill on the kitchen floor. Walk me through what you would do."
                    />
                    {errors.question_text && <p className="text-xs text-red-600 mt-1">{errors.question_text}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Domain</label>
                      <input name="domain" value={form.domain} onChange={handleChange} className={inputClass} placeholder="e.g. Safety & Hygiene" />
                      {errors.domain && <p className="text-xs text-red-600 mt-1">{errors.domain}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Skill</label>
                      <input name="skill" value={form.skill} onChange={handleChange} className={inputClass} placeholder="e.g. Safety Awareness" />
                      {errors.skill && <p className="text-xs text-red-600 mt-1">{errors.skill}</p>}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Skill Tag <span className="text-gray-400 font-normal">(used to match scoring rules — leave blank to reuse Skill)</span></label>
                    <input name="skill_tag" value={form.skill_tag} onChange={handleChange} className={inputClass} placeholder="e.g. safety_awareness" />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Question Type</label>
                      <select name="question_type" value={form.question_type} onChange={handleChange} className={inputClass}>
                        {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Format</label>
                      <select name="question_format" value={form.question_format} onChange={handleChange} className={inputClass}>
                        {QUESTION_FORMATS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Difficulty</label>
                      <select name="difficulty" value={form.difficulty} onChange={handleChange} className={inputClass}>
                        {QUESTION_DIFFICULTIES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Evaluation Tier</label>
                      <select name="evaluation_tier" value={form.evaluation_tier} onChange={handleChange} className={inputClass}>
                        {EVALUATION_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Expected Answer Type</label>
                      <select name="expected_answer_type" value={form.expected_answer_type} onChange={handleChange} className={inputClass}>
                        {EXPECTED_ANSWER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Status</label>
                      <select name="question_status" value={form.question_status} onChange={handleChange} className={inputClass}>
                        {QUESTION_STATUSES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Sequence Number</label>
                      <input type="number" name="sequence_number" value={form.sequence_number ?? ""} onChange={handleChange} className={inputClass} placeholder="1" />
                    </div>
                    <div>
                      <label className={labelClass}>Question Code</label>
                      <input name="question_code" value={form.question_code} onChange={handleChange} className={inputClass} placeholder="optional" />
                    </div>
                    <div>
                      <label className={labelClass}>Est. Time (sec)</label>
                      <input type="number" name="estimated_time_seconds" value={form.estimated_time_seconds ?? ""} onChange={handleChange} className={inputClass} placeholder="30" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" name="is_mandatory" checked={form.is_mandatory} onChange={handleChange} className="rounded border-gray-300 text-purple-600" />
                      Mandatory
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" name="critical_question" checked={form.critical_question} onChange={handleChange} className="rounded border-gray-300 text-purple-600" />
                      Critical question
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" name="follow_up_allowed" checked={form.follow_up_allowed} onChange={handleChange} className="rounded border-gray-300 text-purple-600" />
                      Follow-up allowed
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="rounded border-gray-300 text-purple-600" />
                      Active
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isEditMode ? 'Save Changes' : 'Create Question'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
