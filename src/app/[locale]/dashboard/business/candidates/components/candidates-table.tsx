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
import TablePagination from "@/components/ui/table-pagination";

const PAGE_SIZE = 10;

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
  const t = useTranslations("dashboard.candidates.table");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

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

  // Search/filter changes (or the candidate list itself changing, e.g.
  // after add/delete) can make the current page run past the end of the
  // new result set - snap back to page 1 rather than showing an empty page.
  // Adjusted during render (not an Effect) per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const paginationResetKey = `${searchTerm}|${filterRole}|${candidates.length}`;
  const [prevResetKey, setPrevResetKey] = useState(paginationResetKey);
  if (paginationResetKey !== prevResetKey) {
    setPrevResetKey(paginationResetKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCandidates = filteredCandidates.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

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
    const validRoles = ['HK', 'EC', 'NA', 'MW', 'DR', 'KA', 'OT'];
    return validRoles.includes(role) ? t(`candidateRoles.${role}`) : role;
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
                placeholder={t("searchPlaceholder")}
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
              <option value="">{t("filters.allRoles")}</option>
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
            {t("addCandidate")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("headers.candidate")}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("headers.jobRole")}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("headers.status")}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("headers.skills")}
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("headers.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  {t("loading")}
                </td>
              </tr>
            ) : filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  {t("noCandidates")}
                </td>
              </tr>
            ) : (
              paginatedCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="shrink-0 h-8 w-8">
                        {candidate.profile_photo ? (
                          <img
                            src={candidate.profile_photo}
                            alt={candidate.full_name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-xs font-medium">
                              {candidate.first_name[0]}{candidate.last_name[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {candidate.full_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate" title={`${candidate.email} - ${t("idLabel", { id: candidate.passport_id })}`}>
                          {candidate.email} · {t("idLabel", { id: candidate.passport_id })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getJobRoleLabel(candidate.job_role)}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(candidate.status)}`}>
                      {t(`status.${candidate.status.toLowerCase()}`)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1 max-w-50">
                      {candidate.skills_list.slice(0, 2).map((skill, index) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {candidate.skills_list.length > 2 && (
                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          +{candidate.skills_list.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(candidate)}
                        className="p-1 text-gray-400 hover:text-purple-500 rounded-full hover:bg-purple-50"
                        title={t("actions.view")}
                      >
                        <Eye size={16} />
                      </button>

                      {canEdit(candidate) && (
                        <button
                          onClick={() => onEdit(candidate)}
                          className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50"
                          title={t("actions.edit")}
                        >
                          <Edit size={16} />
                        </button>
                      )}

                      {canShare && (
                        <button
                          onClick={() => onShare(candidate)}
                          className="p-1 text-gray-400 hover:text-green-500 rounded-full hover:bg-green-50"
                          title={t("actions.share")}
                        >
                          <Share2 size={16} />
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

      <TablePagination
        currentPage={safePage}
        totalItems={filteredCandidates.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        itemLabel={t("itemLabelPlural")}
      />
    </div>
  );
}