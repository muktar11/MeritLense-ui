"use client";

import EditProfileTab from "./settings/edit-profile-tab";
import SecurityTab from "./settings/security-tab";
import {BillingTab} from "./settings/billing-tab";
import AgreementsTab from "./settings/agreements-tab";
import { useTranslations } from "next-intl";
import { SubscriptionProvider } from "@/app/context/SubscriptionContext";

interface SettingsTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function SettingsTabs({ activeTab, setActiveTab }: SettingsTabsProps) {
  const t = useTranslations("dashboard.indivisual.settings-tabs");

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Tabs Navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-4 font-medium text-sm transition-colors ${
            activeTab === "profile" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {t("editProfile")}
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-6 py-4 font-medium text-sm transition-colors ${
            activeTab === "security" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {t("security")}
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-6 py-4 font-medium text-sm transition-colors ${
            activeTab === "billing" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {t("billing")}
        </button>
        <button
          onClick={() => setActiveTab("agreements")}
          className={`px-6 py-4 font-medium text-sm transition-colors ${
            activeTab === "agreements" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {t("agreements")}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {activeTab === "profile" && <EditProfileTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "billing" &&
        <SubscriptionProvider>
              <BillingTab />
            </SubscriptionProvider>}
        {activeTab === "agreements" && <AgreementsTab />}
      </div>
    </div>
  );
}
