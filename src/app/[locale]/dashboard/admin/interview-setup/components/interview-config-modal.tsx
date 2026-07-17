"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2 } from "lucide-react";
import interviewService from "@/app/api/interviews/endpoints";
import type { InterviewConfig, InterviewConfigPayload } from "@/app/api/interviews/types";
import { CANDIDATE_JOB_ROLES, EVALUATION_TIERS } from "@/app/api/interviews/types";

interface InterviewConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  configToEdit: InterviewConfig | null;
}

const initialForm: InterviewConfigPayload = {
  role_name: "",
  role_code: CANDIDATE_JOB_ROLES[0].code,
  language: "EN",
  evaluation_tier: "FULL",
  duration_minutes: 30,
  total_questions: 8,
  allow_retries: true,
  max_retries: 1,
  enable_translation: false,
  enable_task_module: false,
  enable_integrity_checks: false,
  is_active: true,
};

export function InterviewConfigModal({ isOpen, onClose, onSuccess, configToEdit }: InterviewConfigModalProps) {
  const [form, setForm] = useState<InterviewConfigPayload>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!configToEdit;

  useEffect(() => {
    if (isOpen) {
      if (configToEdit) {
        setForm({
          role_name: configToEdit.role_name,
          role_code: configToEdit.role_code,
          language: configToEdit.language,
          evaluation_tier: configToEdit.evaluation_tier,
          duration_minutes: configToEdit.duration_minutes,
          total_questions: configToEdit.total_questions,
          allow_retries: configToEdit.allow_retries,
          max_retries: configToEdit.max_retries,
          enable_translation: configToEdit.enable_translation,
          enable_task_module: configToEdit.enable_task_module,
          enable_integrity_checks: configToEdit.enable_integrity_checks,
          rubric_version: configToEdit.rubric_version,
          question_set_version: configToEdit.question_set_version,
          is_active: configToEdit.is_active,
        });
      } else {
        setForm(initialForm);
      }
      setErrors({});
    }
  }, [isOpen, configToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.role_name.trim()) newErrors.role_name = "Role name is required";
    if (!form.role_code.trim()) newErrors.role_code = "Role code is required";
    if (!form.total_questions || form.total_questions < 1) newErrors.total_questions = "Must be at least 1";
    if (!form.duration_minutes || form.duration_minutes < 1) newErrors.duration_minutes = "Must be at least 1";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEditMode && configToEdit) {
        await interviewService.updateConfig(configToEdit.id, form);
      } else {
        await interviewService.createConfig(form);
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
        setErrors({ form: 'Failed to save interview configuration. Please try again.' });
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
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    {isEditMode ? 'Edit Interview Configuration' : 'New Interview Configuration'}
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

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
                    <label className={labelClass}>Evaluation Tier</label>
                    <select name="evaluation_tier" value={form.evaluation_tier} onChange={handleChange} className={inputClass}>
                      {EVALUATION_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Only active question templates for this role whose tier matches (or is &quot;Both&quot;) will be pulled into sessions using this config.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Total Questions</label>
                      <input type="number" name="total_questions" value={form.total_questions} onChange={handleChange} className={inputClass} min={1} />
                      {errors.total_questions && <p className="text-xs text-red-600 mt-1">{errors.total_questions}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Duration (minutes)</label>
                      <input type="number" name="duration_minutes" value={form.duration_minutes} onChange={handleChange} className={inputClass} min={1} />
                      {errors.duration_minutes && <p className="text-xs text-red-600 mt-1">{errors.duration_minutes}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Max Retries</label>
                      <input type="number" name="max_retries" value={form.max_retries} onChange={handleChange} className={inputClass} min={0} />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" name="allow_retries" checked={form.allow_retries} onChange={handleChange} className="rounded border-gray-300 text-purple-600" />
                        Allow retries
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" name="enable_translation" checked={form.enable_translation} onChange={handleChange} className="rounded border-gray-300 text-purple-600" />
                      Enable translation
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" name="enable_task_module" checked={form.enable_task_module} onChange={handleChange} className="rounded border-gray-300 text-purple-600" />
                      Enable task module
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" name="enable_integrity_checks" checked={form.enable_integrity_checks} onChange={handleChange} className="rounded border-gray-300 text-purple-600" />
                      Enable integrity checks
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="rounded border-gray-300 text-purple-600" />
                      Active
                    </label>
                  </div>

                  {form.is_active === false && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Heads up: deactivating hides this config from every list view (including this admin page) — there is currently no way to browse back to it here. You would need to reactivate it directly via the API or Django admin.
                    </p>
                  )}

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
                      {isEditMode ? 'Save Changes' : 'Create Configuration'}
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
