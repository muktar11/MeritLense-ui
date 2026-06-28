// components/share-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Users, Check, Loader2 } from "lucide-react";
import { authClient } from "../../../../../api/auth/client";
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
  full_name: string;
  email: string;
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
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
      setSelectedUsers((candidate.shared_with || []).map(Number));
    }
  }, [isOpen, candidate]);

  const fetchTeamMembers = async () => {
    setFetchingMembers(true);
    setError(null);
    try {
      // Use authClient which already has the base URL and auth token
      const response = await authClient.get('/companies/team/');
      setTeamMembers(response.data);
    } catch (err: any) {
      console.error('Failed to fetch team members:', err);
      setError(err.response?.data?.message || 'Failed to fetch team members');
    } finally {
      setFetchingMembers(false);
    }
  };

  const handleShare = async () => {
    setLoading(true);
    setError(null);

    try {
      await candidateService.shareCandidate(candidate.id, { user_ids: selectedUsers });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to share candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async (userId: number) => {
    setLoading(true);
    try {
      await candidateService.unshareCandidate(candidate.id, [userId]);
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove sharing');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  // Only B2B users should see the share modal content
  if (userRole !== 'B2B' && userRole !== 'B2B_TEAM_MEMBER') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
          <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
            <div className="p-6 text-center">
              <p className="text-red-600">You don't have permission to share candidates.</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users size={20} />
              Share Candidate
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600 mb-4">
              Share <span className="font-medium">{candidate.full_name}</span> with team members
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Team Members List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {fetchingMembers ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 size={24} className="animate-spin text-purple-500" />
                </div>
              ) : teamMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No team members available
                </p>
              ) : (
                teamMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{member.full_name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedUsers.includes(member.id) ? (
                        <>
                          <button
                            onClick={() => handleUnshare(member.id)}
                            disabled={loading}
                            className="px-3 py-1 text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                          >
                            Remove
                          </button>
                          <Check size={18} className="text-green-500" />
                        </>
                      ) : (
                        <button
                          onClick={() => toggleUser(member.id)}
                          disabled={loading}
                          className="px-3 py-1 text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 rounded disabled:opacity-50"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Currently Shared With */}
            {selectedUsers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Currently shared with:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(userId => {
                    const user = teamMembers.find(m => m.id === userId);
                    return user ? (
                      <span
                        key={userId}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center gap-1"
                      >
                        {user.full_name}
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
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={loading || fetchingMembers}
              className="px-4 py-2 text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
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
        </div>
      </div>
    </div>
  );
}