"use client"

import type React from "react"

import { X } from "lucide-react"
import { Bell, FileText, Users, TrendingUp } from "lucide-react"

interface Notification {
  id: number
  icon: React.ReactNode
  title: string
  message: string
  timestamp: string
}

const notifications: Notification[] = [
  {
    id: 1,
    icon: <Bell className="w-5 h-5 text-blue-600" />,
    title: "Emily Tolar sent you a comment",
    message: "in Evaluation task",
    timestamp: "25 ago",
  },
  {
    id: 2,
    icon: <Users className="w-5 h-5 text-blue-600" />,
    title: "Calculated the status of Candidate",
    message: "set to be in Progress",
    timestamp: "1h ago",
  },
  {
    id: 3,
    icon: <FileText className="w-5 h-5 text-blue-600" />,
    title: "Low points Review Item",
    message: "added to do list",
    timestamp: "2h 45 ago",
  },
  {
    id: 4,
    icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
    title: "Emily Tolar Report is ready",
    message: "Download and Review",
    timestamp: "Yesterday 9:18 pm",
  },
]

export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute top-16 right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {notifications.map((notification) => (
          <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">{notification.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-2">{notification.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
