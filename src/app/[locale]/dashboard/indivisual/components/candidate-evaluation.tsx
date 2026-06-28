"use client"

import { useState } from "react"
import { ChevronDown, Download, LinkIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

export function CandidateEvaluation() {
  const [roleFilter, setRoleFilter] = useState("Housekeeper")
  const [statusFilter, setStatusFilter] = useState("Completed")
  const [searchTerm, setSearchTerm] = useState("")

  const candidates = [
    {
      id: 1,
      name: "Evan Flores",
      avatar: "👤",
      passport: "432 234 23 4443",
      role: "Housekeeper",
      certificate: "In Progress",
      evaluationDate: "Apr 1, 2025",
      language: "English",
    },
   {
      id: 2,
      name: "Ariana Wilson",
      avatar: "👤",
      passport: "432 234 23 4443",
      role: "Nanny",
      certificate: "Complete",
      evaluationDate: "Apr 1, 2025",
      language: "Arabic",
    },
    {
      id: 3,
      name: "Jamila Cooper",
      avatar: "👤",
      passport: "432 234 23 4443",
      role: "Elder Companion",
      certificate: "Complete",
      evaluationDate: "Apr 1, 2025",
      language: "English",
    },
    {
      id: 4,
      name: "David Brown",
      avatar: "👤",
      passport: "432 234 23 4443",
      role: "Kitchen Assistant",
      certificate: "Ready for Employment",
      evaluationDate: "Apr 1, 2025",
      language: "English",
    },
    {
      id: 5,
      name: "Jorge Black",
      avatar: "👤",
      passport: "432 234 23 4443",
      role: "Maintenance worker",
      certificate: "Ready for Employment",
      evaluationDate: "Apr 1, 2025",
      language: "Spanish",
    },
    {
      id: 6,
      name: "Jorge Black",
      avatar: "👤",
      passport: "432 234 23 4443",
      role: "Housekeeper",
      certificate: "Need Training",
      evaluationDate: "Apr 1, 2025",
      language: "English",
    },
    {
      id: 7,
      name: "Ariana Wilson",
      avatar: "👤",
      passport: "432 234 23 4443",
      role: "Elder Companion",
      certificate: "Ready for Employment",
      evaluationDate: "Apr 1, 2025",
      language: "English",
    },
    {
      id: 8,
      name: "Ariana Wilson",
      avatar: "👤",
      passport: "432 234 23 4443",
      role: "Kitchen Assistant",
      certificate: "Need Training",
      evaluationDate: "Apr 1, 2025",
      language: "Arabic",
    },
    {
      id: 9,
      name: "Philip Stewart",
      avatar: "👤",
      passport: "432 234 23 4443",
      role: "Maintenance worker",
      certificate: "Need Training",
      evaluationDate: "Apr 1, 2025",
      language: "Spanish",
    }
  ]

  const getCertificateColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-yellow-100 text-yellow-800"
      case "Complete":
        return "bg-green-100 text-green-800"
      case "Ready for Employment":
        return "bg-blue-100 text-blue-800"
      case "Need Training":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-4 sm:p-6 mb-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="font-semibold text-gray-700 whitespace-nowrap">
            Quick Actions:
          </span>

          {/* Role Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full appearance-none border rounded-lg px-4 py-2 pr-8 text-sm"
            >
              <option>Filter by Role</option>
              <option>Housekeeper</option>
              <option>Nanny</option>
              <option>Elder Companion</option>
              <option>Kitchen Assistant</option>
              <option>Maintenance worker</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none border rounded-lg px-4 py-2 pr-8 text-sm"
            >
              <option>Filter by Status</option>
              <option>Completed</option>
              <option>In Progress</option>
              <option>Ready for Employment</option>
              <option>Need Training</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>

          {/* Search */}
          <div className="w-full sm:w-64 sm:ml-auto">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-base sm:text-lg font-semibold">
            Candidate Evaluation
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  "Candidate",
                  "ID / Passport",
                  "Job Role",
                  "Certificate Status",
                  "Evaluation Date",
                  "Language",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {candidates.map((c) => (
                <tr
                  key={c.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-sm">
                      {c.avatar}
                    </div>
                    <span className="font-medium">{c.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.passport}
                  </td>
                  <td className="px-4 py-3">{c.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getCertificateColor(
                        c.certificate
                      )}`}
                    >
                      {c.certificate}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c.evaluationDate}</td>
                  <td className="px-4 py-3">{c.language}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg hover:bg-blue-50 text-blue-600">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-purple-50 text-purple-600">
                        <LinkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
