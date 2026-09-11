"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Breadcrumb } from "@/components/app/Breadcrumb";
import AuthGuard from "@/components/auth/AuthGuard";
import { AgreementGuard, useB2BAgreementStatus } from "./components/agreement-guard";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  FileText,
  Key,
  Network,
} from "lucide-react";
import { LanguageSelector } from "@/components/app/LanguageSelector";
import { useTranslations, useLocale } from "next-intl";
import { useMemo } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("dashboard.business");
  const locale = useLocale(); // ✅ current locale

  const agreementStatus = useB2BAgreementStatus();
  // Company Profile stays reachable while unsigned - it hosts the "Sign
  // Agreements" entry point. Every other page is gated until the B2B
  // Agreement and DPA are both signed.
  const lockedUntilSigned = agreementStatus !== "signed";
  const disabledTooltip = t("sidebarLocked");

  const ADMIN_SIDEBAR_ITEMS = useMemo(
    () => [
      {
        label: t("pages_list.overview"),
        icon: LayoutDashboard,
        href: `/${locale}/dashboard/business`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },
      {
        label: t("pages_list.candidate_management"),
        icon: Users,
        href: `/${locale}/dashboard/business/candidates`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },

      {
        label: t("pages_list.business_management"),
        icon: Building2,
        href: `/${locale}/dashboard/business/score-management`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },
      {
        label: t("pages_list.system_configuration"),
        icon: Settings,
        href: `/${locale}/dashboard/business/company-profile`,
      },
      {
        label: t("pages_list.audit_logs"),
        icon: FileText,
        href: `/${locale}/dashboard/business/payment`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },

      {
        label: t("pages_list.multi_agency_panel"),
        icon: Network,
        href: `/${locale}/dashboard/business/candidate-evaluation`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },
    ],
    [t, locale, lockedUntilSigned, disabledTooltip]
  );

  return (
    <AuthGuard allowedRoles={["B2B", "B2B_TEAM_MEMBER"]}>
      <AgreementGuard status={agreementStatus}>
        <DashboardLayout
          sidebarItems={ADMIN_SIDEBAR_ITEMS}
          userType={t("user_type")}
        >
          <div className="lg:px-8 px-0">
            <div className="w-full bg-white h-16 rounded-b shadow-2xl/5 flex items-center justify-between pl-18 lg:pl-4 pr-4">
              <Breadcrumb />
              <LanguageSelector />
            </div>
            <div className="sm:px-8 px-4">{children}</div>
          </div>
        </DashboardLayout>
      </AgreementGuard>
    </AuthGuard>
  );
}
