"use client";

import { Bell, User, Settings, BarChart3 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import NotificationsPanel from "./notifications";
import { useAuth } from "@/app/hooks/useAuth";
import { useCurrentPlanName } from "@/app/hooks/useCurrentPlanName";

export default function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const locale = useLocale();
  const t = useTranslations("dashboard.indivisual.dashboardHeader");
  const planName = useCurrentPlanName();
  const { userRole } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Left side (logo / title if needed) */}
        </div>
        
        <div className="flex items-center gap-4 relative">
          {planName && (
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium" title={t("planBadgeTitle")}>
              {planName}
            </span>
          )}

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label={t("notifications")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-600" />
          </button>

          {showNotifications && (
            <NotificationsPanel onClose={() => setShowNotifications(false)} />
          )}

          {/* Evaluations */}
          <Link
            href={`/${locale}/dashboard/business/candidate-evaluation`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-gray-600" />
          </Link>

          {/* Profile / Settings */}
          {userRole !== "B2B_TEAM_MEMBER" && (
            <Link
              href={`/${locale}/dashboard/business/company-profile`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={t("companyProfile")}
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </Link>
          )}

          {/* Candidates */}
          <Link
            href={`/${locale}/dashboard/business/score-management`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <User className="w-5 h-5 text-gray-600" />
          </Link>
        </div>
      </div>
    </header>
  );
}
