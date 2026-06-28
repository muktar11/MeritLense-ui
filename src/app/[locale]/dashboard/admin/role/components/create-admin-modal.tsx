// app/dashboard/admin/user-role-management/components/create-admin-modal.tsx
"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, Mail, User, Phone, Key, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ADMIN_PERMISSIONS } from "@/app/api/admin/users/types";

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
}

export function CreateAdminModal({ isOpen, onClose, onSubmit }: CreateAdminModalProps) {
  const t = useTranslations("dashboard.admin.userRoleManagement");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    department: "",
    phone_number: "",
    permissions: [] as string[]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePermissionChange = (permissionKey: string) => {
    setFormData(prev => {
      const newPermissions = prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey];
      return { ...prev, permissions: newPermissions };
    });
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

    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
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
      const success = await onSubmit(formData);
      if (success) {
        onClose();
        // Reset form
        setFormData({
          email: "",
          first_name: "",
          last_name: "",
          password: "",
          confirm_password: "",
          department: "",
          phone_number: "",
          permissions: []
        });
      }
    } catch (error) {
      console.error('Failed to create admin:', error);
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
                    {t("createAdmin.title")}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                {errors.form && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {errors.form}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("createAdmin.email")} *
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
                        placeholder="admin@example.com"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("createAdmin.firstName")} *
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
                        {t("createAdmin.lastName")} *
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
                  </div>

                  {/* Department & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("createAdmin.department")}
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="IT Department"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("createAdmin.phoneNumber")}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="tel"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("createAdmin.password")}
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm ${
                            errors.password ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("createAdmin.confirmPassword")}
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="password"
                          name="confirm_password"
                          value={formData.confirm_password}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm ${
                            errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.confirm_password && <p className="mt-1 text-xs text-red-600">{errors.confirm_password}</p>}
                    </div>
                  </div>

                  {/* Password Hint */}
                  <p className="text-xs text-gray-500">
                    {t("createAdmin.passwordHint")}
                  </p>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("createAdmin.permissions")}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ADMIN_PERMISSIONS.map((permission) => (
                        <label key={permission.key} className="flex items-center gap-2">
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
                  </div>

                  {/* Info Text */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-700">
                      {t("createAdmin.infoText")}
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      disabled={loading}
                    >
                      {t("createAdmin.cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("createAdmin.creating")}
                        </>
                      ) : (
                        t("createAdmin.create")
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