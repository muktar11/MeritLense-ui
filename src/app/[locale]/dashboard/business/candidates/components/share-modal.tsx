// components/share-modal.tsx
"use client";

import { useState, useEffect, Fragment } from "react";
import { X, Users, Check, Loader2 } from "lucide-react";
import { Dialog, Transition } from '@headlessui/react';
import { apiClient } from "../../../../../api/auth/client";
import candidateService from "../../../../../api/candidates/endpoints";
import { Candidate } from "../../../../../api/candidates/types";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  onSuccess?: () => void;
  userRole?: string;
}

interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  job_title?: string;
  role?: string;
}

export default function ShareModal({ 
  isOpen, 
  onClose, 
  candidate, 
  onSuccess,
  userRole 
}: ShareModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingMembers, setFetchingMembers] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
      setSelectedUsers(candidate.shared_with || []);
      setError(null);
      setWarning(null);
    }
  }, [isOpen, candidate]);

  const fetchTeamMembers = async () => {
    setFetchingMembers(true);
    setError(null);
    try {
      const response = await apiClient.get('/auth/companies/team/');
      console.log('Team members response:', response.data);
      
      const members = Array.isArray(response.data) ? response.data : response.data.results || [];
      setTeamMembers(members);
    } catch (err: any) {
      console.error('Failed to fetch team members:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch team members');
    } finally {
      setFetchingMembers(false);
    }
  };

  const handleShare = async () => {
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const validUserIds = selectedUsers.filter(id =>
        teamMembers.some(member => String(member.id) === id)
      );
      
      const response = await candidateService.shareCandidate(candidate.id, { user_ids: validUserIds.map(Number) });
      
      // Show warning if some IDs were invalid (from backend response)
      if (response.warning) {
        setWarning(response.warning);
      }
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Share error:', err);
      
      // Handle different error formats from backend
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.user_ids) {
        // Handle validation errors on user_ids field
        const userErrors = err.response.data.user_ids;
        if (Array.isArray(userErrors)) {
          setError(userErrors[0]);
        } else if (typeof userErrors === 'string') {
          setError(userErrors);
        } else {
          setError('Failed to share candidate');
        }
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to share candidate');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async (userId: string) => {
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const response = await candidateService.unshareCandidate(candidate.id, [Number(userId)]);
      
      if (response.warning) {
        setWarning(response.warning);
      }
      
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      onSuccess?.();
    } catch (err: any) {
      console.error('Unshare error:', err);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to remove sharing');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: number) => {
    const id = String(userId);
    setSelectedUsers(prev =>
      prev.includes(id)
        ? prev.filter(v => v !== id)
        : [...prev, id]
    );
  };

  const getMemberDisplayName = (member: TeamMember): string => {
    return member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email;
  };

  if (!isOpen) return null;

  // Only B2B users should see the share modal content
  if (userRole !== 'B2B' && userRole !== 'B2B_TEAM_MEMBER') {
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 mb-4">
                    Permission Denied
                  </Dialog.Title>
                  <p className="text-red-600 mb-4">You don't have permission to share candidates.</p>
                  <div className="flex justify-end">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users size={20} />
                    Share Candidate
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Share <span className="font-medium">{candidate.full_name}</span> with team members
                  </p>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Warning Message (for partial success) */}
                  {warning && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
                      {warning}
                    </div>
                  )}

                  {/* Team Members List */}
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                    {fetchingMembers ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 size={24} className="animate-spin text-purple-500" />
                      </div>
                    ) : teamMembers.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No team members available</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Invite team members from the company profile page
                        </p>
                      </div>
                    ) : (
                      teamMembers.map(member => {
                        const displayName = getMemberDisplayName(member);
                        const isSelected = selectedUsers.includes(String(member.id));
                        
                        return (
                          <div
                            key={member.id}
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                              isSelected 
                                ? 'bg-purple-50 border border-purple-200' 
                                : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{displayName}</p>
                              <p className="text-sm text-gray-500 truncate">{member.email}</p>
                              {member.job_title && (
                                <p className="text-xs text-gray-400 mt-1">{member.job_title}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              {isSelected ? (
                                <>
                                  <button
                                    onClick={() => handleUnshare(String(member.id))}
                                    disabled={loading}
                                    className="px-3 py-1 text-xs text-red-600 hover:text-red-700 font-medium hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                  >
                                    Remove
                                  </button>
                                  <Check size={18} className="text-green-500 shrink-0" />
                                </>
                              ) : (
                                <button
                                  onClick={() => toggleUser(member.id)}
                                  disabled={loading}
                                  className="px-3 py-1 text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 hover:bg-purple-50 rounded transition-colors disabled:opacity-50"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Currently Shared With Summary */}
                  {selectedUsers.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Currently shared with ({selectedUsers.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map(userId => {
                          const user = teamMembers.find(m => String(m.id) === userId);
                          return user ? (
                            <span
                              key={userId}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center gap-1"
                            >
                              {getMemberDisplayName(user)}
                              <button
                                onClick={() => handleUnshare(userId)}
                                disabled={loading}
                                className="ml-1 hover:text-purple-900"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={loading || fetchingMembers || selectedUsers.length === 0}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}