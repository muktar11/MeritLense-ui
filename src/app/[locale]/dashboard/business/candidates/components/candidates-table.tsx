"use client";

import { useState } from "react";
import { 
  Eye, 
  Edit, 
  Share2, 
  Search,
  Plus
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Candidate } from "../../../../../api/candidates/types";

interface CandidatesTableProps {
  candidates: Candidate[];
  onView: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
  onShare: (candidate: Candidate) => void;
  onAdd: () => void;
  loading?: boolean;
  userRole: string;
  currentUserId?: string;
}

export default function CandidatesTable({ 
  candidates, 
  onView, 
  onEdit, 
  onShare,
  onAdd,
  loading,
  userRole = 'B2C',
  currentUserId
}: CandidatesTableProps) {
  const t = useTranslations("dashboard.indivisual.candidates");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");

  const canShare = userRole === 'B2B';
  
  const canEdit = (candidate: Candidate) => {
  if (userRole === 'B2B_TEAM_MEMBER') {
    return candidate.created_by === currentUserId;
  }
  return true;
};

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.passport_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole ? candidate.job_role === filterRole : true;
    
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800';
      case 'BLACKLIST':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      'HK': 'Housekeeper',
      'EC': 'Elder Companion',
      'NA': 'Nanny',
      'MW': 'Maintenance Worker',
      'DR': 'Driver',
      'KA': 'Kitchen Assistant',
      'OT': 'Other',
    };
    return roles[role] || role;
  };

  const uniqueRoles = [...new Set(candidates.map(c => c.job_role))];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{getJobRoleLabel(role)}</option>
              ))}
            </select>
          </div>
          <button
            onClick={onAdd}
            className="w-full sm:w-auto px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Candidate
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Candidate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skills
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading candidates...
                </td>
              </tr>
            ) : filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No candidates found
                </td>
              </tr>
            ) : (
              filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="shrink-0 h-10 w-10">
                        {candidate.profile_photo ? (
                          <img
                            src={candidate.profile_photo}
                            alt={candidate.full_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 font-medium">
                              {candidate.first_name[0]}{candidate.last_name[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {candidate.passport_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{candidate.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getJobRoleLabel(candidate.job_role)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(candidate.status)}`}>
                      {candidate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills_list.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {candidate.skills_list.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{candidate.skills_list.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(candidate)}
                        className="p-1 text-gray-400 hover:text-purple-500 rounded-full hover:bg-purple-50"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {canEdit(candidate) && (
                        <button
                          onClick={() => onEdit(candidate)}
                          className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      
                      {canShare && (
                        <button
                          onClick={() => onShare(candidate)}
                          className="p-1 text-gray-400 hover:text-green-500 rounded-full hover:bg-green-50"
                          title="Share"
                        >
                          <Share2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">
          Showing {filteredCandidates.length} of {candidates.length} candidates
        </div>
      </div>
    </div>
  );
}