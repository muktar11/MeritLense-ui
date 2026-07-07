"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import DashboardHeader from "../components/dashboard-header";
import SettingsTabs from "../components/settings-tabs";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("dashboard.indivisual.profile");
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "profile");

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("pageTitle")}</h1>
          <SettingsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </main>
    </div>
  );
}


