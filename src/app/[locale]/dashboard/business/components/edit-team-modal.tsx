"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Briefcase, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import teamService from "@/app/api/team/endpoints";
import type { Permission, TeamMember } from "@/app/api/team/types";

interface EditTeamModalProps {
  member: TeamMember;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Deliberately no email/first name/last name fields - those live on the
// member's own User account, not TeamMemberProfile, and
// TeamMemberUpdateSerializer only ever accepts job_title/department/
// phone_number/permissions.
export function EditTeamModal({ member, isOpen, onClose, onSuccess }: EditTeamModalProps) {
  const t = useTranslations("dashboard.business.company-profile.team");
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState({
    job_title: member.job_title,
    department: member.department,
    phone_number: member.phone_number,
    permissions: member.permissions,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        job_title: member.job_title,
        department: member.department,
        phone_number: member.phone_number,
        permissions: member.permissions,
      });
      setErrors({});
      teamService.getPermissions().then(setPermissions).catch((error) => {
        console.error('Failed to fetch permissions:', error);
      });
    }
  }, [isOpen, member]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permissionKey: string) => {
    setFormData(prev => {
      const newPermissions = prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey];
      return { ...prev, permissions: newPermissions };
    });
  };

  // Same "Full Access selects all four" convenience as the Invite form -
  // never a stored value of its own.
  const hasFullAccess = permissions.length > 0 && permissions.every(p => formData.permissions.includes(p.key));
  const handleFullAccessChange = () => {
    setFormData(prev => ({
      ...prev,
      permissions: hasFullAccess ? [] : permissions.map(p => p.key),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      await teamService.updateTeamMember(member.id, formData);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update team member:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ form: t('editModal.failedAlert') });
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
            <h3 className="text-lg font-bold text-gray-900">{t('editModal.title', { name: member.full_name })}</h3>
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
                {t('inviteModal.jobTitle')} *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm ${
                    errors.job_title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.job_title && <p className="mt-1 text-xs text-red-600">{errors.job_title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('editModal.department')}
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department}</p>}
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
                />
              </div>
              {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inviteModal.permissions')}
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
                    {t('editModal.saving')}
                  </>
                ) : (
                  t('editModal.save')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
