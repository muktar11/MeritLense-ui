"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import adminPackageService from "@/app/api/admin/packages/endpoints";
import type { Package, PackagePayload } from "@/app/api/admin/packages/types";

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  packageToEdit: Package | null;
}

const TARGET_USER_TYPES = [
  { key: 'B2C', labelKey: 'targetUserTypes.B2C' },
  { key: 'B2B', labelKey: 'targetUserTypes.B2B' },
  { key: 'BOTH', labelKey: 'targetUserTypes.BOTH' },
];

const BILLING_TYPES = [
  { key: 'RECURRING', labelKey: 'billingTypes.RECURRING' },
  { key: 'ONE_TIME', labelKey: 'billingTypes.ONE_TIME' },
];

const INTERVALS = [
  { key: 'MONTHLY', labelKey: 'intervals.MONTHLY' },
  { key: 'QUARTERLY', labelKey: 'intervals.QUARTERLY' },
  { key: 'YEARLY', labelKey: 'intervals.YEARLY' },
];

const EVALUATION_TIERS = [
  { key: '', labelKey: 'evaluationTiers.none' },
  { key: 'SCREENING', labelKey: 'evaluationTiers.SCREENING' },
  { key: 'FULL', labelKey: 'evaluationTiers.FULL' },
  { key: 'BOTH', labelKey: 'evaluationTiers.BOTH' },
];

const COMPANY_SIZES = [
  { key: '', labelKey: 'companySizes.any' },
  { key: '1-10', labelKey: 'companySizes.1-10' },
  { key: '11-50', labelKey: 'companySizes.11-50' },
  { key: '51-200', labelKey: 'companySizes.51-200' },
  { key: '201-1000', labelKey: 'companySizes.201-1000' },
  { key: '1000+', labelKey: 'companySizes.1000+' },
];

const OUTPUT_REPORT_LEVELS = [
  { key: '', labelKey: 'outputReportLevels.none' },
  { key: 'summary', labelKey: 'outputReportLevels.summary' },
  { key: 'standard', labelKey: 'outputReportLevels.standard' },
  { key: 'detailed', labelKey: 'outputReportLevels.detailed' },
];

const initialForm = {
  name: "",
  target_user_type: "B2C" as PackagePayload['target_user_type'],
  min_company_size: "",
  max_company_size: "",
  unit_amount: "",
  currency: "eur",
  billing_type: "RECURRING" as PackagePayload['billing_type'],
  interval: "MONTHLY" as NonNullable<PackagePayload['interval']>,
  interval_count: 1,
  evaluation_tier: "",
  task_observation_enabled: false,
  candidate_limit: "",
  evaluation_limit: "",
  team_member_limit: "",
  slot_grant: "",
  points_grant: "",
  question_count_min: "",
  question_count_max: "",
  session_duration_min_minutes: "",
  session_duration_max_minutes: "",
  output_report_level: "",
  is_active: true,
};

export function PackageModal({ isOpen, onClose, onSuccess, packageToEdit }: PackageModalProps) {
  const t = useTranslations("dashboard.admin.packages.modal");
  const tOptions = useTranslations("dashboard.admin.packages");
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!packageToEdit;

  useEffect(() => {
    if (isOpen) {
      if (packageToEdit) {
        setForm({
          name: packageToEdit.name,
          target_user_type: packageToEdit.target_user_type,
          min_company_size: packageToEdit.min_company_size || "",
          max_company_size: packageToEdit.max_company_size || "",
          unit_amount: packageToEdit.unit_amount,
          currency: packageToEdit.currency,
          billing_type: packageToEdit.billing_type,
          interval: packageToEdit.interval || "MONTHLY",
          interval_count: packageToEdit.interval_count || 1,
          evaluation_tier: packageToEdit.evaluation_tier || "",
          task_observation_enabled: packageToEdit.task_observation_enabled,
          candidate_limit: packageToEdit.feature_limits?.candidate_limit?.toString() || "",
          evaluation_limit: packageToEdit.feature_limits?.evaluation_limit?.toString() || "",
          team_member_limit: packageToEdit.feature_limits?.team_member_limit?.toString() || "",
          slot_grant: packageToEdit.slot_grant?.toString() || "",
          points_grant: packageToEdit.points_grant?.toString() || "",
          question_count_min: packageToEdit.feature_limits?.question_count_min?.toString() || "",
          question_count_max: packageToEdit.feature_limits?.question_count_max?.toString() || "",
          session_duration_min_minutes: packageToEdit.feature_limits?.session_duration_min_minutes?.toString() || "",
          session_duration_max_minutes: packageToEdit.feature_limits?.session_duration_max_minutes?.toString() || "",
          output_report_level: packageToEdit.features?.output_report_level || "",
          is_active: packageToEdit.is_active,
        });
      } else {
        setForm(initialForm);
      }
      setErrors({});
    }
  }, [isOpen, packageToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = t("errors.nameRequired");
    if (form.unit_amount.trim() === '' || Number(form.unit_amount) < 0) newErrors.unit_amount = t("errors.amountInvalid");
    if (!form.currency.trim()) newErrors.currency = t("errors.currencyRequired");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (): PackagePayload => {
    const feature_limits: Record<string, number> = {};
    const numericFields: Array<keyof typeof form> = [
      'candidate_limit', 'evaluation_limit', 'team_member_limit',
      'question_count_min', 'question_count_max',
      'session_duration_min_minutes', 'session_duration_max_minutes',
    ];
    numericFields.forEach(key => {
      const value = form[key];
      if (typeof value === 'string' && value.trim() !== '') {
        feature_limits[key] = Number(value);
      }
    });

    const payload: PackagePayload = {
      name: form.name,
      target_user_type: form.target_user_type,
      min_company_size: (form.min_company_size || null) as PackagePayload['min_company_size'],
      max_company_size: (form.max_company_size || null) as PackagePayload['max_company_size'],
      unit_amount: form.unit_amount,
      currency: form.currency,
      billing_type: form.billing_type,
      evaluation_tier: (form.evaluation_tier || null) as PackagePayload['evaluation_tier'],
      task_observation_enabled: form.task_observation_enabled,
      feature_limits,
      slot_grant: form.slot_grant.trim() !== '' ? Number(form.slot_grant) : null,
      points_grant: form.points_grant.trim() !== '' ? Number(form.points_grant) : null,
      features: form.output_report_level ? { output_report_level: form.output_report_level as any } : {},
      is_active: form.is_active,
    };

    if (form.billing_type === 'RECURRING') {
      payload.interval = form.interval;
      payload.interval_count = Number(form.interval_count) || 1;
    }

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      if (isEditMode && packageToEdit) {
        await adminPackageService.updatePackage(packageToEdit.id, payload);
      } else {
        await adminPackageService.createPackage(payload);
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
        setErrors({ form: t("errors.saveFailed") });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
                    {isEditMode ? t("editTitle") : t("newTitle")}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                {errors.form && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {errors.form}
                  </div>
                )}

                {isEditMode && (form.billing_type !== packageToEdit?.billing_type ||
                  form.unit_amount !== packageToEdit?.unit_amount) && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
                    {t("priceChangeWarning")}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto px-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("name")}</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("availableTo")}</label>
                      <select name="target_user_type" value={form.target_user_type} onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        {TARGET_USER_TYPES.map(o => <option key={o.key} value={o.key}>{tOptions(o.labelKey)}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("billingType")}</label>
                      <select name="billing_type" value={form.billing_type} onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        {BILLING_TYPES.map(o => <option key={o.key} value={o.key}>{tOptions(o.labelKey)}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("amount")}</label>
                      <input
                        type="number"
                        step="0.01"
                        name="unit_amount"
                        value={form.unit_amount}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.unit_amount ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.unit_amount && <p className="mt-1 text-xs text-red-600">{errors.unit_amount}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("currency")}</label>
                      <input
                        type="text"
                        name="currency"
                        value={form.currency}
                        onChange={handleChange}
                        placeholder="eur"
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.currency ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.currency && <p className="mt-1 text-xs text-red-600">{errors.currency}</p>}
                    </div>

                    {form.billing_type === 'RECURRING' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t("billingInterval")}</label>
                          <select name="interval" value={form.interval} onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            {INTERVALS.map(o => <option key={o.key} value={o.key}>{tOptions(o.labelKey)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t("intervalCount")}</label>
                          <input
                            type="number"
                            min="1"
                            name="interval_count"
                            value={form.interval_count}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </>
                    )}

                    {(form.target_user_type === 'B2B' || form.target_user_type === 'BOTH') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t("minCompanySize")}</label>
                          <select name="min_company_size" value={form.min_company_size} onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            {COMPANY_SIZES.map(o => <option key={o.key} value={o.key}>{tOptions(o.labelKey)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t("maxCompanySize")}</label>
                          <select name="max_company_size" value={form.max_company_size} onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            {COMPANY_SIZES.map(o => <option key={o.key} value={o.key}>{tOptions(o.labelKey)}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("evaluationTier")}</label>
                      <select name="evaluation_tier" value={form.evaluation_tier} onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        {EVALUATION_TIERS.map(o => <option key={o.key} value={o.key}>{tOptions(o.labelKey)}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("outputReportLevel")}</label>
                      <select name="output_report_level" value={form.output_report_level} onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        {OUTPUT_REPORT_LEVELS.map(o => <option key={o.key} value={o.key}>{tOptions(o.labelKey)}</option>)}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 md:col-span-2 pt-1">
                      <input
                        type="checkbox"
                        id="task_observation_enabled"
                        name="task_observation_enabled"
                        checked={form.task_observation_enabled}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-purple-600"
                      />
                      <label htmlFor="task_observation_enabled" className="text-sm text-gray-700">
                        {t("includesTaskObservation")}
                      </label>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">{t("slotsPointsHeading")}</h4>
                    <p className="text-xs text-gray-500 mb-3">
                      {t("slotsPointsDescription")}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t("assessmentSlots")}</label>
                        <input type="number" name="slot_grant" value={form.slot_grant} onChange={handleChange}
                          placeholder={t("unlimitedPlaceholder")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t("pointsBalance")}</label>
                        <input type="number" name="points_grant" value={form.points_grant} onChange={handleChange}
                          placeholder={t("unlimitedPlaceholder")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">{t("otherLimitsHeading")}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t("candidateLimit")}</label>
                        <input type="number" name="candidate_limit" value={form.candidate_limit} onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t("evaluationLimit")}</label>
                        <input type="number" name="evaluation_limit" value={form.evaluation_limit} onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t("teamMemberLimit")}</label>
                        <input type="number" name="team_member_limit" value={form.team_member_limit} onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">{t("sessionConfigHeading")}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t("questionsMin")}</label>
                        <input type="number" name="question_count_min" value={form.question_count_min} onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t("questionsMax")}</label>
                        <input type="number" name="question_count_max" value={form.question_count_max} onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t("durationMin")}</label>
                        <input type="number" name="session_duration_min_minutes" value={form.session_duration_min_minutes} onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t("durationMax")}</label>
                        <input type="number" name="session_duration_max_minutes" value={form.session_duration_max_minutes} onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t pt-4">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-purple-600"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700">{t("active")}</label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      disabled={loading}
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("saving")}
                        </>
                      ) : (
                        isEditMode ? t("saveChanges") : t("createPackage")
                      )}
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
