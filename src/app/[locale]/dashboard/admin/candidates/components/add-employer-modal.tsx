"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, Upload } from "lucide-react";
import employerService from "@/app/api/admin/employers/endpoints";
import { JOB_ROLES, NATIONALITIES, LANGUAGES, COMPANY_SIZES } from "@/app/api/auth/endpoints";
import type { B2CRegistrationData, B2BRegistrationData } from "@/app/api/auth/auth";

interface AddEmployerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AccountType = 'B2C' | 'B2B';

const initialB2C = {
  email: "", first_name: "", last_name: "", password: "", confirm_password: "",
  passport_id: "", job_role: "", nationality: "", preferred_language: "EN",
  phone_number: "", date_of_birth: "", address: "",
  id_document: null as File | null, resume_document: null as File | null,
};

const initialB2B = {
  email: "", first_name: "", last_name: "", password: "", confirm_password: "",
  company_name: "", company_registration_number: "", company_size: "",
  country: "", city: "", preferred_language: "EN", phone_number: "",
  website: "", industry: "", address: "",
  registration_certificate: null as File | null,
  resachetified_license: null as File | null,
  tax_id_document: null as File | null,
};

export function AddEmployerModal({ isOpen, onClose, onSuccess }: AddEmployerModalProps) {
  const [accountType, setAccountType] = useState<AccountType>('B2C');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [b2c, setB2c] = useState(initialB2C);
  const [b2b, setB2b] = useState(initialB2B);

  const resetForm = () => {
    setB2c(initialB2C);
    setB2b(initialB2B);
    setErrors({});
    setAccountType('B2C');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleB2cChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setB2c(prev => ({ ...prev, [name]: value }));
  };

  const handleB2bChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setB2b(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setter((prev: any) => ({ ...prev, [field]: file }));
  };

  const validateB2C = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!b2c.email.trim()) newErrors.email = "Email is required";
    if (!b2c.first_name.trim()) newErrors.first_name = "First name is required";
    if (!b2c.last_name.trim()) newErrors.last_name = "Last name is required";
    if (b2c.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (b2c.password !== b2c.confirm_password) newErrors.confirm_password = "Passwords do not match";
    if (!b2c.passport_id.trim()) newErrors.passport_id = "Passport ID is required";
    if (!b2c.job_role) newErrors.job_role = "Job role is required";
    if (!b2c.nationality) newErrors.nationality = "Nationality is required";
    if (!b2c.phone_number.trim()) newErrors.phone_number = "Phone number is required";
    if (!b2c.id_document) newErrors.id_document = "ID document is required";
    if (!b2c.resume_document) newErrors.resume_document = "Resume document is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateB2B = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!b2b.email.trim()) newErrors.email = "Email is required";
    if (!b2b.first_name.trim()) newErrors.first_name = "First name is required";
    if (!b2b.last_name.trim()) newErrors.last_name = "Last name is required";
    if (b2b.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (b2b.password !== b2b.confirm_password) newErrors.confirm_password = "Passwords do not match";
    if (!b2b.company_name.trim()) newErrors.company_name = "Company name is required";
    if (!b2b.company_registration_number.trim()) newErrors.company_registration_number = "Registration number is required";
    if (!b2b.company_size) newErrors.company_size = "Company size is required";
    if (!b2b.country.trim()) newErrors.country = "Country is required";
    if (!b2b.city.trim()) newErrors.city = "City is required";
    if (!b2b.phone_number.trim()) newErrors.phone_number = "Phone number is required";
    if (!b2b.registration_certificate) newErrors.registration_certificate = "Registration certificate is required";
    if (!b2b.resachetified_license) newErrors.resachetified_license = "License document is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountType === 'B2C') {
      if (!validateB2C()) return;
      setLoading(true);
      try {
        await employerService.createEmployerB2C(b2c as unknown as B2CRegistrationData);
        onSuccess();
        handleClose();
      } catch (error: any) {
        const data = error?.response?.data;
        if (data && typeof data === 'object') {
          const backendErrors: Record<string, string> = {};
          Object.entries(data).forEach(([key, value]) => {
            backendErrors[key] = Array.isArray(value) ? String(value[0]) : String(value);
          });
          setErrors(backendErrors);
        } else {
          setErrors({ form: 'Failed to create employer. Please try again.' });
        }
      } finally {
        setLoading(false);
      }
    } else {
      if (!validateB2B()) return;
      setLoading(true);
      try {
        await employerService.createEmployerB2B(b2b as unknown as B2BRegistrationData);
        onSuccess();
        handleClose();
      } catch (error: any) {
        const data = error?.response?.data;
        if (data && typeof data === 'object') {
          const backendErrors: Record<string, string> = {};
          Object.entries(data).forEach(([key, value]) => {
            backendErrors[key] = Array.isArray(value) ? String(value[0]) : String(value);
          });
          setErrors(backendErrors);
        } else {
          setErrors({ form: 'Failed to create employer. Please try again.' });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                    Add Employer
                  </Dialog.Title>
                  <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                {errors.form && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {errors.form}
                  </div>
                )}

                {/* Account type toggle */}
                <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAccountType('B2C')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                      accountType === 'B2C' ? 'bg-white shadow text-purple-700' : 'text-gray-500'
                    }`}
                  >
                    Individual (B2C)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('B2B')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                      accountType === 'B2B' ? 'bg-white shadow text-purple-700' : 'text-gray-500'
                    }`}
                  >
                    Company (B2B)
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                  {/* Shared account fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={accountType === 'B2C' ? b2c.email : b2b.email}
                        onChange={accountType === 'B2C' ? handleB2cChange : handleB2bChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={accountType === 'B2C' ? b2c.phone_number : b2b.phone_number}
                        onChange={accountType === 'B2C' ? handleB2cChange : handleB2bChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.phone_number ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.phone_number && <p className="mt-1 text-xs text-red-600">{errors.phone_number}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        name="first_name"
                        value={accountType === 'B2C' ? b2c.first_name : b2b.first_name}
                        onChange={accountType === 'B2C' ? handleB2cChange : handleB2bChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.first_name ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        name="last_name"
                        value={accountType === 'B2C' ? b2c.last_name : b2b.last_name}
                        onChange={accountType === 'B2C' ? handleB2cChange : handleB2bChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.last_name ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={accountType === 'B2C' ? b2c.password : b2b.password}
                        onChange={accountType === 'B2C' ? handleB2cChange : handleB2bChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={accountType === 'B2C' ? b2c.confirm_password : b2b.confirm_password}
                        onChange={accountType === 'B2C' ? handleB2cChange : handleB2bChange}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.confirm_password ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.confirm_password && <p className="mt-1 text-xs text-red-600">{errors.confirm_password}</p>}
                    </div>
                  </div>

                  {accountType === 'B2C' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Passport ID *</label>
                          <input
                            type="text"
                            name="passport_id"
                            value={b2c.passport_id}
                            onChange={handleB2cChange}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.passport_id ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.passport_id && <p className="mt-1 text-xs text-red-600">{errors.passport_id}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Job Role *</label>
                          <select
                            name="job_role"
                            value={b2c.job_role}
                            onChange={handleB2cChange}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.job_role ? 'border-red-500' : 'border-gray-300'}`}
                          >
                            <option value="">Select role</option>
                            {JOB_ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                          </select>
                          {errors.job_role && <p className="mt-1 text-xs text-red-600">{errors.job_role}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
                          <select
                            name="nationality"
                            value={b2c.nationality}
                            onChange={handleB2cChange}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.nationality ? 'border-red-500' : 'border-gray-300'}`}
                          >
                            <option value="">Select nationality</option>
                            {NATIONALITIES.map(n => <option key={n.key} value={n.key}>{n.label}</option>)}
                          </select>
                          {errors.nationality && <p className="mt-1 text-xs text-red-600">{errors.nationality}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
                          <select
                            name="preferred_language"
                            value={b2c.preferred_language}
                            onChange={handleB2cChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            {LANGUAGES.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            name="date_of_birth"
                            value={b2c.date_of_birth}
                            onChange={handleB2cChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <input
                            type="text"
                            name="address"
                            value={b2c.address}
                            onChange={handleB2cChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ID Document *</label>
                          <label className={`flex items-center gap-2 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-purple-500 transition ${errors.id_document ? 'border-red-500' : 'border-gray-300'}`}>
                            <Upload size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600 truncate">
                              {b2c.id_document ? b2c.id_document.name : 'Click to upload'}
                            </span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileChange(setB2c, 'id_document')}
                              className="hidden"
                            />
                          </label>
                          {errors.id_document && <p className="mt-1 text-xs text-red-600">{errors.id_document}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Resume Document *</label>
                          <label className={`flex items-center gap-2 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-purple-500 transition ${errors.resume_document ? 'border-red-500' : 'border-gray-300'}`}>
                            <Upload size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600 truncate">
                              {b2c.resume_document ? b2c.resume_document.name : 'Click to upload'}
                            </span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileChange(setB2c, 'resume_document')}
                              className="hidden"
                            />
                          </label>
                          {errors.resume_document && <p className="mt-1 text-xs text-red-600">{errors.resume_document}</p>}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                          <input
                            type="text"
                            name="company_name"
                            value={b2b.company_name}
                            onChange={handleB2bChange}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.company_name ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.company_name && <p className="mt-1 text-xs text-red-600">{errors.company_name}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                          <input
                            type="text"
                            name="company_registration_number"
                            value={b2b.company_registration_number}
                            onChange={handleB2bChange}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.company_registration_number ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.company_registration_number && <p className="mt-1 text-xs text-red-600">{errors.company_registration_number}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company Size *</label>
                          <select
                            name="company_size"
                            value={b2b.company_size}
                            onChange={handleB2bChange}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.company_size ? 'border-red-500' : 'border-gray-300'}`}
                          >
                            <option value="">Select size</option>
                            {COMPANY_SIZES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                          </select>
                          {errors.company_size && <p className="mt-1 text-xs text-red-600">{errors.company_size}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                          <input
                            type="text"
                            name="industry"
                            value={b2b.industry}
                            onChange={handleB2bChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                          <input
                            type="text"
                            name="country"
                            value={b2b.country}
                            onChange={handleB2bChange}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                          <input
                            type="text"
                            name="city"
                            value={b2b.city}
                            onChange={handleB2bChange}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                          <input
                            type="url"
                            name="website"
                            value={b2b.website}
                            onChange={handleB2bChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
                          <select
                            name="preferred_language"
                            value={b2b.preferred_language}
                            onChange={handleB2bChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            {LANGUAGES.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <input
                            type="text"
                            name="address"
                            value={b2b.address}
                            onChange={handleB2bChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Registration Certificate *</label>
                          <label className={`flex items-center gap-2 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-purple-500 transition ${errors.registration_certificate ? 'border-red-500' : 'border-gray-300'}`}>
                            <Upload size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600 truncate">
                              {b2b.registration_certificate ? b2b.registration_certificate.name : 'Click to upload'}
                            </span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileChange(setB2b, 'registration_certificate')}
                              className="hidden"
                            />
                          </label>
                          {errors.registration_certificate && <p className="mt-1 text-xs text-red-600">{errors.registration_certificate}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">License Document *</label>
                          <label className={`flex items-center gap-2 border-2 border-dashed rounded-lg p-3 cursor-pointer hover:border-purple-500 transition ${errors.resachetified_license ? 'border-red-500' : 'border-gray-300'}`}>
                            <Upload size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600 truncate">
                              {b2b.resachetified_license ? b2b.resachetified_license.name : 'Click to upload'}
                            </span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileChange(setB2b, 'resachetified_license')}
                              className="hidden"
                            />
                          </label>
                          {errors.resachetified_license && <p className="mt-1 text-xs text-red-600">{errors.resachetified_license}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID Document</label>
                          <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-purple-500 transition">
                            <Upload size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600 truncate">
                              {b2b.tax_id_document ? b2b.tax_id_document.name : 'Click to upload (optional)'}
                            </span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileChange(setB2b, 'tax_id_document')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-700">
                      The account will be created and marked verified. The new user will receive an email with login instructions.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Employer'
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
