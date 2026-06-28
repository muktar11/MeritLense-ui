"use client"
import EditProfileTab from "./settings/edit-profile-tab"
import SecurityTab from "./settings/security-tab"
import { BillingTab } from "./settings/billing-tab"


interface SettingsTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}



export default function SettingsTabs({ activeTab, setActiveTab }: SettingsTabsProps) {
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
          Edit Profile
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-6 py-4 font-medium text-sm transition-colors ${
            activeTab === "security" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Security
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-6 py-4 font-medium text-sm transition-colors ${
            activeTab === "billing" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Billing & Subscription
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {activeTab === "profile" && <EditProfileTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "billing" && <BillingTab />}
      </div>
    </div>
  )
}
