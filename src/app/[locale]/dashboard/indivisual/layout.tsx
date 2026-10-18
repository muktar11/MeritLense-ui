"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Breadcrumb } from "@/components/app/Breadcrumb";
import AuthGuard from "@/components/auth/AuthGuard";
import { Watermark } from "@/components/app/Watermark";
import { AgreementGuard, useB2CAgreementStatus } from "./components/agreement-guard";
import { UpdatedAgreementsNotice } from "@/components/agreements/UpdatedAgreementsNotice";

import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  ClipboardList,
  BarChart3,
  Trophy,
  UserCog,
  FolderOpen,
  Package,
  Bell,
  Activity,
  GitCompare,
  ShieldCheck,
} from "lucide-react";

import { LanguageSelector } from "@/components/app/LanguageSelector";
import { useTranslations, useLocale } from "next-intl";
import { useMemo } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('dashboard.indivisual'); // ✅ set namespace

  const locale = useLocale(); // ✅ get current locale

  const agreementStatus = useB2CAgreementStatus();
  // Profile stays reachable while unsigned - it hosts the "Sign Agreement"
  // entry point. Every other page is gated until the B2C Agreement is signed.
  const lockedUntilSigned = agreementStatus !== "signed";
  const disabledTooltip = t("sidebarLocked");

  const BUSINESS_SIDEBAR_ITEMS = useMemo(
    () => [
      {
        label: t("pages_list.overview"),
        icon: LayoutDashboard,
        href: `/${locale}/dashboard/indivisual`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },
      {
        label: t("pages_list.analytics_insights"),
        icon: BarChart3,
        href: `/${locale}/dashboard/indivisual/analytics`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },
      {
        label: t("pages_list.profile_management"),
        icon: Building2,
        href: `/${locale}/dashboard/indivisual/profile`,
      },
      {
        label: t("pages_list.candidate_management"),
        icon: Users,
        href: `/${locale}/dashboard/indivisual/candidates`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },
      {
        label: locale === "ar" ? "التقييمات" : "Evaluations",
        icon: ClipboardList,
        href: `/${locale}/dashboard/indivisual/evaluations`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },
      {
        label: locale === "ar" ? "نتائج التقييم" : "Assessment Results",
        icon: Building2,
        href: `/${locale}/dashboard/indivisual/score-management`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },
      {
        label: t("pages_list.exceptions_quality"),
        icon: ShieldCheck,
        href: `/${locale}/dashboard/indivisual/exceptions-quality`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },

      {
        label: t("pages_list.compare_candidates"),
        icon: GitCompare,
        href: `/${locale}/dashboard/indivisual/compare-candidates`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },
    {
        label: t("pages_list.packages_subscription"),
        icon: Package,
        href: `/${locale}/dashboard/indivisual/payment`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },

    ],
    [t, locale, lockedUntilSigned, disabledTooltip]
  );

  return (
    <AuthGuard allowedRoles={["B2C"]}>
      <Watermark />
      <AgreementGuard status={agreementStatus}>
        <DashboardLayout
          sidebarItems={BUSINESS_SIDEBAR_ITEMS}
          userType={t("user_type")}
        >
          <div className="lg:px-8 px-0">
            <div className="w-full bg-white h-16 rounded-b shadow-2xl/5 flex items-center justify-between pl-18 lg:pl-4 pr-4">
              <Breadcrumb />
              <LanguageSelector />
            </div>
            <div className="sm:px-8 px-4">
              <UpdatedAgreementsNotice types={["B2C_AGREEMENT"]} signPath="/dashboard/indivisual/sign-agreements" />
              {children}
            </div>
          </div>
        </DashboardLayout>
      </AgreementGuard>
    </AuthGuard>
  );
}
