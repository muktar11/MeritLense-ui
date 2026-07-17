"use client";

import { useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Breadcrumb } from "@/components/app/Breadcrumb";
import { LanguageSelector } from "@/components/app/LanguageSelector";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/app/hooks/useAuth";
import { useTranslations, useLocale } from "next-intl";

import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  FileText,
  Key,
  Network,
  UserCheck,
  SlidersHorizontal,
  Package,
  ClipboardList,
} from "lucide-react";

// Optional: locale code → human-readable name map
const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  ar: "Arabic",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("dashboard.admin");
  const locale = useLocale(); // ✅ current locale
  const { userRole } = useAuth();

  const ADMIN_SIDEBAR_ITEMS = useMemo(
    () => [
      {
        label: t("pages_list.overview"),
        icon: LayoutDashboard,
        href: `/${locale}/dashboard/admin`,
      },

      ...(userRole === 'SUPERADMIN' ? [{
        label: t("pages_list.package_management"),
        icon: Package,
        href: `/${locale}/dashboard/admin/packages`,
      }] : []),

      {
        label: t("pages_list.interview_setup"),
        icon: ClipboardList,
        href: `/${locale}/dashboard/admin/interview-setup`,
      },

      {
        label: t("pages_list.user_management"),
        icon: Users,
        href: `/${locale}/dashboard/admin/role`,
      },

      {
        label: t("pages_list.candidate_management"),
        icon: UserCheck,
        href: `/${locale}/dashboard/admin/candidates`,
      },

      {
        label: t("pages_list.business_management"),
        icon: Building2,
        href: `/${locale}/dashboard/admin/users`,
      },

      {
        label: t("pages_list.settings"),
        icon: Settings,
        href: `/${locale}/dashboard/admin/settings`,
      },

      {
        label: t("pages_list.system_configuration"),
        icon: SlidersHorizontal,
        href: `/${locale}/dashboard/admin/system-config`,
      },
      {
        label: t("pages_list.audit_logs"),
        icon: FileText,
        href: `/${locale}/dashboard/admin/logs`,
      },
     
      {
        label: t("pages_list.multi_agency_panel"),
        icon: Network,
        href: `/${locale}/dashboard/admin/billing`,
      },

      
    ],
    [t, locale, userRole]
  );

  return (
    <AuthGuard allowedRoles={["SUPERADMIN", "ADMIN"]}>
      <DashboardLayout
        sidebarItems={ADMIN_SIDEBAR_ITEMS}
        userType={t("user_type")}
      >
        <div className="lg:px-8 px-0">
          <div className="w-full bg-white h-16 rounded-b shadow-2xl/5 flex items-center justify-between pl-18 lg:pl-4 pr-4">
            <Breadcrumb />
            <LanguageSelector locales={LOCALE_NAMES} />
          </div>
          <div className="sm:px-8 px-4">{children}</div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
