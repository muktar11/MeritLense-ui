"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts"

function ScoreDistributionChart() {
  const scoreDistributionData = [
    { role: "Cleaner", score: 6500 },
    { role: "Comparison", score: 7200 },
    { role: "Manager", score: 7200 },
    { role: "Agent", score: 4800 },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Candidate Score Distribution by Job Role</h3>
        <span className="text-xs text-gray-400 cursor-pointer">MORE</span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={scoreDistributionData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="role" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[0, 8000]} />

          <Tooltip
  formatter={(value: any) => {
    if (Array.isArray(value)) {
      return value.map(v => (typeof v === "number" ? `${v}%` : v)).join(", ");
    }
    return typeof value === "number" ? `${value}%` : value;
  }}
/>


          <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function RightColumnCharts() {
  const performanceData = [
    { month: "Jan", performance: 65 },
    { month: "Feb", performance: 72 },
    { month: "Mar", performance: 68 },
    { month: "Apr", performance: 75 },
    { month: "May", performance: 80 },
  ]

  const budgetData = [
    { name: "Design", value: 35, color: "#3b82f6" },
    { name: "Operations", value: 25, color: "#f97316" },
    { name: "Management", value: 20, color: "#10b981" },
    { name: "Admin", value: 20, color: "#a855f7" },
  ]

  const readinessData = [
    { name: "Ready", value: 60, color: "#10b981" },
    { name: "In Progress", value: 30, color: "#a855f7" },
    { name: "Pending", value: 10, color: "#f59e0b" },
  ]

  const ageDistributionData = [
    { category: "Age Group (25-35)", accepted: 65, rejected: 35 },
    { category: "Age Group (20-23)", accepted: 60, rejected: 40 },
    { category: "AppearanceScore (<4.0)", accepted: 55, rejected: 45 },
    { category: "Nationality (International)", accepted: 30, rejected: 70 },
  ]

  const languageData = [
    { name: "French", value: 45 },
    { name: "Arabic", value: 35 },
    { name: "English", value: 28 },
    { name: "Spanish", value: 20 },
  ]

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-sm">Performance</h3>
          <div className="flex gap-3 text-xs">
            <span className="text-gray-500 cursor-pointer hover:text-gray-700">Others</span>
            <span className="text-gray-500 cursor-pointer hover:text-gray-700">Projects</span>
            <span className="text-gray-500 cursor-pointer hover:text-gray-700">Operating Status</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="performance"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Budget Consumption */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Paint Consumption by Service</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={budgetData} cx="50%" cy="50%" outerRadius={45} dataKey="value" startAngle={90} endAngle={450}>
                {budgetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 text-xs">
            {budgetData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Readiness */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Overall Readiness Index</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={readinessData}
                cx="50%"
                cy="50%"
                outerRadius={45}
                dataKey="value"
                startAngle={90}
                endAngle={450}
              >
                {readinessData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 text-xs">
            {readinessData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Age Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-sm">Age Distribution (Rejected vs Accepted)</h3>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-sm" />
              <span className="text-xs text-gray-600">Accepted</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-pink-400 rounded-sm" />
              <span className="text-xs text-gray-600">Rejected</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ageDistributionData} layout="vertical" margin={{ top: 5, right: 30, left: 140, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} />
            <YAxis dataKey="category" type="category" tick={{ fontSize: 9 }} width={135} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Bar dataKey="accepted" stackId="a" fill="#3b82f6" />
            <Bar dataKey="rejected" stackId="a" fill="#ec4899" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Language Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">Evaluation Language Distribution</h3>

         <ResponsiveContainer width="100%" height={330}>


          <BarChart data={languageData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Export as namespace
export default { ScoreDistributionChart, RightColumnCharts }
