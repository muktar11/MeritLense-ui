// app/dashboard/admin/candidates/components/employer-detail-modal.tsx
"use client";

import { Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react';
import { X, Mail, User, Calendar, CheckCircle, XCircle, Clock, Building2, Phone, MapPin, Briefcase, FileText, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Employer } from "@/app/api/admin/employers/types";
import { format } from "date-fns";

interface EmployerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employer: Employer | null;
}

export function EmployerDetailModal({ isOpen, onClose, employer }: EmployerDetailModalProps) {
  const t = useTranslations("dashboard.admin.candidateManagement");

  if (!employer) return null;

  const getStatusIcon = () => {
    if (employer.documents_verified) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (employer.documents_verification_status === 'rejected') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (employer.documents_verified) return 'Verified';
    if (employer.documents_verification_status === 'rejected') return 'Rejected';
    return 'Pending Verification';
  };

  const isB2C = employer.role === 'B2C';
  const profile = employer.profile_details as any;

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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    {t("detailModal.title")}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Header with status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-lg font-bold">
                        {employer.first_name[0]}{employer.last_name[0]}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{employer.full_name}</h2>
                        <p className="text-sm text-gray-500">{employer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon()}
                      <span className={`text-sm font-medium ${
                        employer.documents_verified ? 'text-green-600' :
                        employer.documents_verification_status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {getStatusText()}
                      </span>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Account Status</p>
                        <p className={`text-sm font-medium ${employer.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {employer.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email Verified</p>
                        <p className={`text-sm font-medium ${employer.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                          {employer.is_verified ? 'Verified' : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Joined</p>
                        <p className="text-sm font-medium">{format(new Date(employer.created_at), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Role</p>
                        <p className="text-sm font-medium">{employer.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Profile Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {isB2C ? (
                        <>
                          {profile?.passport_id && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Passport ID</p>
                                <p className="text-sm">{profile.passport_id}</p>
                              </div>
                            </div>
                          )}
                          {profile?.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="text-sm">{profile.phone_number}</p>
                              </div>
                            </div>
                          )}
                          {profile?.nationality && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Nationality</p>
                                <p className="text-sm">{profile.nationality}</p>
                              </div>
                            </div>
                          )}
                          {profile?.job_role && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Job Role</p>
                                <p className="text-sm">{profile.job_role}</p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {profile?.company_name && (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Company</p>
                                <p className="text-sm">{profile.company_name}</p>
                              </div>
                            </div>
                          )}
                          {profile?.company_registration_number && (
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Registration #</p>
                                <p className="text-sm">{profile.company_registration_number}</p>
                              </div>
                            </div>
                          )}
                          {profile?.company_size && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Company Size</p>
                                <p className="text-sm">{profile.company_size}</p>
                              </div>
                            </div>
                          )}
                          {profile?.country && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Location</p>
                                <p className="text-sm">{profile.city}, {profile.country}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Document Status */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Documents</h4>
                    <div className="space-y-2">
                      {Object.entries(employer.documents_status).map(([key, value]) => {
                        if (key === 'verified') return null;
                        return (
                          <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-600">{key.replace(/_/g, ' ')}</span>
                            {value ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Close Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}