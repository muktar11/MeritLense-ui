"use client"

import { Bell, User, Settings } from "lucide-react"
import { useState } from "react"
import NotificationsPanel from "./notifications"

export default function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            AI
          </div>
          <h1 className="text-xl font-bold text-gray-900">Recruitment Dashboard</h1>
        </div>
        <div className="flex items-center gap-4 relative">
          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">Premium</span>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <User className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  )
}
