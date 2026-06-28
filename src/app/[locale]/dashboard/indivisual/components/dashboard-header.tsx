"use client";

import { Bell, User, Settings, BarChart3 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import NotificationsPanel from "./notifications";

export default function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const locale = useLocale();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Left side (logo / title if needed) */}
        </div>
        
        <div className="flex items-center gap-4 relative">
          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
            Premium
          </span>

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {showNotifications && (
            <NotificationsPanel onClose={() => setShowNotifications(false)} />
          )}

          {/* Evaluations */}
          <Link
            href={`/${locale}/dashboard/indivisual/evaluations`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-gray-600" />
          </Link>

          {/* Profile / Settings */}
          <Link
            href={`/${locale}/dashboard/indivisual/profile`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </Link>

          {/* Candidates */}
          <Link
            href={`/${locale}/dashboard/indivisual/candidates`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <User className="w-5 h-5 text-gray-600" />
          </Link>
        </div>
      </div>
    </header>
  );
}
