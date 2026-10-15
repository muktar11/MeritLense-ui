"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Mail, User, Briefcase, Key } from "lucide-react";
import { useTranslations } from "next-intl";
import teamService from "@/app/api/team/endpoints";
import { PRESET_PERMISSIONS, ROLE_JOB_TITLE, ROLE_PRESET, TEAM_ROLES, roleForJobTitle, type TeamRole } from "./team-roles";
import type { Permission } from "@/app/api/team/types";

interface InviteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteTeamModal({ isOpen, onClose, onSuccess }: InviteTeamModalProps) {
  const t = useTranslations("dashboard.business.company-profile.team");
  const tPage = useTranslations("dashboard.business.company-profile");
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    job_title: "",
    phone_number: "",
    permissions: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
    } else {
      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        job_title: "",
        phone_number: "",
        permissions: []
      });
      setErrors({});
    }
  }, [isOpen]);

  const fetchPermissions = async () => {
    try {
      const data = await teamService.getPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // A role is a job title plus the permissions it starts with; they can
  // still be adjusted with the checkboxes below.
  const handleRoleChange = (role: TeamRole) => {
    setFormData(prev => ({
      ...prev,
      job_title: ROLE_JOB_TITLE[role],
      permissions: PRESET_PERMISSIONS[ROLE_PRESET[role]],
    }));
  };

  const handlePermissionChange = (permissionKey: string) => {
    setFormData(prev => {
      const newPermissions = prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey];
      return { ...prev, permissions: newPermissions };
    });
  };

  // "Full Access" is a convenience that selects every available
  // permission at once - not a stored value of its own, so there's only
  // ever one source of truth for what a member can do (the four
  // individual permissions, never a separate flag that could drift out of
  // sync with them).
  const hasFullAccess = permissions.length > 0 && permissions.every(p => formData.permissions.includes(p.key));
  const handleFullAccessChange = () => {
    setFormData(prev => ({
      ...prev,
      permissions: hasFullAccess ? [] : permissions.map(p => p.key),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.job_title.trim()) {
      newErrors.job_title = "Job title is required";
    }

    if (!formData.phone_number.trim()) {
      newErrors.job_title = "Phone Number is required";
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = "At least one permission is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await teamService.inviteTeamMember(formData);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to invite team member:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ form: 'Failed to send invitation. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={onClose} />
      
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md pointer-events-auto relative max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10">
            <h3 className="text-lg font-bold text-gray-900">{t('inviteModal.title')}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {errors.form && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inviteModal.email')} *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="colleague@company.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inviteModal.firstName')} *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John"
                />
              </div>
              {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inviteModal.lastName')} *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                />
              </div>
              {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
            </div>

            <div>
              <label htmlFor="team-role" className="block text-sm font-medium text-gray-700 mb-1">
                {t('inviteModal.role')} *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  id="team-role"
                  value={roleForJobTitle(formData.job_title) ?? ''}
                  onChange={(e) => handleRoleChange(e.target.value as TeamRole)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm bg-white ${
                    errors.job_title ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="" disabled>—</option>
                  {TEAM_ROLES.map((role) => (
                    <option key={role} value={role}>{tPage(`staff.roles.${role}`)}</option>
                  ))}
                </select>
              </div>
              {roleForJobTitle(formData.job_title) && (
                <p className="mt-1 text-xs text-gray-500">{tPage(`staff.roleHelp.${roleForJobTitle(formData.job_title)}`)}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">{t('inviteModal.roleHint')}</p>
              {errors.job_title && <p className="mt-1 text-xs text-red-600">{errors.job_title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inviteModal.phoneNumber')} *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm ${
                    errors.phone_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+123 9577483883"
                />
              </div>
              {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inviteModal.permissions')} *
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasFullAccess}
                    onChange={handleFullAccessChange}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-gray-900">{t('inviteModal.fullAccess')}</span>
                </label>
                {permissions.map((permission) => (
                  <label key={permission.key} className="flex items-center gap-2 pl-1">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.key)}
                      onChange={() => handlePermissionChange(permission.key)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{permission.label}</span>
                  </label>
                ))}
              </div>
              {errors.permissions && <p className="mt-1 text-xs text-red-600">{errors.permissions}</p>}
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700">
                {t('inviteModal.inviteInfo')}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                disabled={loading}
              >
                {t('inviteModal.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('inviteModal.sending')}
                  </>
                ) : (
                  t('inviteModal.sendInvite')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}