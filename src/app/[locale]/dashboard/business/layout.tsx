"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Breadcrumb } from "@/components/app/Breadcrumb";
import AuthGuard from "@/components/auth/AuthGuard";
import { Watermark } from "@/components/app/Watermark";
import { AgreementGuard, useB2BAgreementStatus } from "./components/agreement-guard";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  FileText,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { LanguageSelector } from "@/components/app/LanguageSelector";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { profileAPI } from "@/app/api/profile/endpoints";
import { Button } from "@/components/ui/button";

const TEAM_PERMISSIONS = {
  candidates: "add_candidates",
  evaluation: "set_evaluation",
  scores: "set_scores",
  payment: "set_payment",
} as const;

const ALL_TEAM_PERMISSIONS = Object.values(TEAM_PERMISSIONS);

function requiredPermissionsForPath(path: string): string[] | null {
  if (path.includes("/dashboard/business/company-profile")) return null;
  if (path.includes("/dashboard/business/candidates")) return [TEAM_PERMISSIONS.candidates];
  if (path.includes("/dashboard/business/candidate-evaluation")) return [TEAM_PERMISSIONS.evaluation];
  if (path.includes("/dashboard/business/score-management")) return [TEAM_PERMISSIONS.scores];
  if (path.includes("/dashboard/business/payment")) return [TEAM_PERMISSIONS.payment];
  return ALL_TEAM_PERMISSIONS;
}

function canAccessPath(path: string, permissions: string[], allowProfile = false): boolean {
  if (path.includes("/dashboard/business/company-profile")) return allowProfile;
  const required = requiredPermissionsForPath(path);
  return required === null || required.every(permission => permissions.includes(permission));
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("dashboard.business");
  const locale = useLocale(); // ✅ current locale
  const pathname = usePathname();
  const router = useRouter();
  const { userRole } = useAuth();
  const [teamPermissions, setTeamPermissions] = useState<string[] | null>(null);
  const [permissionsLoadError, setPermissionsLoadError] = useState(false);
  const [companyLicenseVerified, setCompanyLicenseVerified] = useState<boolean | null>(null);
  const [licenseLoadError, setLicenseLoadError] = useState(false);
  const [profileAccessAttempt, setProfileAccessAttempt] = useState(0);

  useEffect(() => {
    if (userRole !== "B2B" && userRole !== "B2B_TEAM_MEMBER") return;

    let cancelled = false;
    profileAPI.getProfile().then((profile) => {
      if (!cancelled) {
        setTeamPermissions(userRole === "B2B_TEAM_MEMBER" && Array.isArray(profile.permissions)
          ? profile.permissions
          : []);
        setPermissionsLoadError(false);
        setCompanyLicenseVerified(profile.company_is_verified === true);
        setLicenseLoadError(false);
      }
    }).catch((error) => {
      console.error("Failed to fetch business account access status:", error);
      if (!cancelled) {
        setTeamPermissions([]);
        setPermissionsLoadError(userRole === "B2B_TEAM_MEMBER");
        setCompanyLicenseVerified(null);
        setLicenseLoadError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userRole, profileAccessAttempt]);

  const agreementStatus = useB2BAgreementStatus(userRole, companyLicenseVerified === true);
  const licenseLocked = licenseLoadError || companyLicenseVerified !== true;
  // Company Profile stays reachable while unsigned - it hosts the "Sign
  // Agreements" entry point. Every other page is gated until the B2B
  // Agreement and DPA are both signed.
  const lockedUntilSigned = agreementStatus !== "signed";
  const disabledTooltip = t("sidebarLocked");

  const ADMIN_SIDEBAR_ITEMS = useMemo(() => {
    const items = [
      {
        label: t("pages_list.overview"),
        icon: LayoutDashboard,
        href: `/${locale}/dashboard/business`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },
      {
        label: t("pages_list.system_configuration"),
        icon: Settings,
        href: `/${locale}/dashboard/business/company-profile`,
      },
      {
        label: t("pages_list.candidate_management"),
        icon: Users,
        href: `/${locale}/dashboard/business/candidates`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },
      {
        label: t("pages_list.multi_agency_panel"),
        icon: ClipboardList,
        href: `/${locale}/dashboard/business/candidate-evaluation`,
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
        label: t("pages_list.audit_logs"),
        icon: FileText,
        href: `/${locale}/dashboard/business/payment`,
        disabled: lockedUntilSigned,
        disabledTooltip,
      },
    ];

    if (licenseLocked) {
      return items.filter(item => item.href.includes("/dashboard/business/company-profile"));
    }
    if (userRole !== "B2B_TEAM_MEMBER" || teamPermissions === null) return items;
    return items.filter(item => canAccessPath(item.href, teamPermissions));
  }, [t, locale, lockedUntilSigned, disabledTooltip, userRole, teamPermissions, licenseLocked]);

  const permissionsReady = userRole !== "B2B_TEAM_MEMBER" || teamPermissions !== null;
  const isProfilePath = pathname.includes("/dashboard/business/company-profile");
  const canAccessCurrentPath = licenseLocked
    ? isProfilePath
    : userRole !== "B2B_TEAM_MEMBER"
      || (teamPermissions !== null && canAccessPath(pathname, teamPermissions));

  return (
    <AuthGuard allowedRoles={["B2B", "B2B_TEAM_MEMBER"]}>
      <Watermark />
      <DashboardLayout
        sidebarItems={ADMIN_SIDEBAR_ITEMS}
        userType={t("user_type")}
      >
        <div className="lg:px-8 px-0">
          <div className="w-full bg-white h-16 rounded-b shadow-2xl/5 flex items-center justify-between pl-18 lg:pl-4 pr-4">
            <Breadcrumb />
            <LanguageSelector />
          </div>
          <div className="sm:px-8 px-4">
            {companyLicenseVerified === null && !licenseLoadError ? (
              <div className="flex min-h-48 items-center justify-center" role="status">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : licenseLoadError ? (
              <div className="mx-auto max-w-2xl py-12 text-center">
                <p className="mb-4 text-red-600">{t("licenseStatusLoadError")}</p>
                <Button variant="outline" onClick={() => setProfileAccessAttempt((value) => value + 1)}>
                  {t("retry")}
                </Button>
              </div>
            ) : licenseLocked ? (
              isProfilePath ? (
                children
              ) : (
                <div className="mx-auto max-w-2xl py-12 text-center">
                  <h1 className="mb-3 text-xl font-semibold">{t("licenseAccessTitle")}</h1>
                  <p className="mb-5 text-muted-foreground">{t("licenseAccessDescription")}</p>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={() => setProfileAccessAttempt((value) => value + 1)}>
                      {t("refreshCompanyStatus")}
                    </Button>
                    <Button onClick={() => router.push(`/${locale}/dashboard/business/company-profile`)}>
                      {t("licenseProfileLink")}
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <AgreementGuard status={agreementStatus}>
                {!permissionsReady ? (
                  <div className="flex min-h-48 items-center justify-center" role="status">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  </div>
                ) : permissionsLoadError ? (
                  <p className="py-8 text-center text-red-600">{t("permissionsLoadError")}</p>
                ) : canAccessCurrentPath ? (
                  children
                ) : (
                  <p className="py-8 text-center text-muted-foreground">{t("accessDenied")}</p>
                )}
              </AgreementGuard>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
