"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CreditCard, History, Loader2 } from "lucide-react";
import { PlansTab } from "../components/plans-tab";
import { BillingTab } from "../components/settings/billing-tab";
import { SubscriptionProvider } from "@/app/context/SubscriptionContext";

type TabType = 'plans' | 'billing';

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}

function PaymentPageContent() {
  const t = useTranslations("dashboard.indivisual.payment");
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(
    () => (searchParams.get("tab") as TabType) || 'plans'
  );

  const tabs = [
    { id: 'plans', label: t('tabs.plans'), icon: CreditCard },
    { id: 'billing', label: t('tabs.billing'), icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-1 px-4" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                      ${activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'plans' && <PlansTab />}
            {activeTab === 'billing' && 
                    <SubscriptionProvider>
                          <BillingTab />
                        </SubscriptionProvider>}
          </div>
        </div>
      </div>
    </div>
  );
}