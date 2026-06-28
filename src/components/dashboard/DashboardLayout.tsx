"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LucideIcon,
  ChevronLeft,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth-store";
import { useTranslations, useLocale } from "next-intl";

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface DashboardLayoutProps {
  sidebarItems: SidebarItem[];
  userType: string;
  children: React.ReactNode;
}

function SidebarContent({
  sidebarItems,
  userType,
  collapsed,
  onClose,
}: {
  sidebarItems: SidebarItem[];
  userType: string;
  collapsed: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const t = useTranslations("dashboard");

  /** ✅ LOGOUT HANDLER */
  const logOutHandler = () => {
    logout(); // clear auth store
    router.replace(`/${locale}/auth/login`); // locale-aware redirect
  };

  return (
    <>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-900">
                MeritLense
              </h2>
              <p className="text-xs text-gray-500">{userType}</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-10 h-10 bg-secondary-900 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-lg">M</span>
          </div>
        )}

        {/* Mobile Close */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = pathname.endsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                "hover:bg-secondary-200",
                isActive &&
                  "bg-secondary text-white hover:bg-secondary-600",
                !isActive && "text-gray-700",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : ""}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  collapsed && "text-secondary",
                  isActive && "text-white"
                )}
              />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary-200 transition-colors",
                collapsed && "justify-center"
              )}
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-gray-600" />
              </div>

              {!collapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align={collapsed ? "center" : "end"}
            className="w-56"
          >
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>{t("profile")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={logOutHandler}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export function DashboardLayout({
  sidebarItems,
  userType,
  children,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const t = useTranslations("dashboard");

  return (
    <div className="flex h-screen bg-primary/2">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex bg-white shadow-2xl/5 flex-col transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent
          sidebarItems={sidebarItems}
          userType={userType}
          collapsed={collapsed}
          onClose={() => {}}
        />

        {/* Collapse Toggle */}
        <div className="border-t border-gray-200 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full hover:bg-secondary-200",
              collapsed && "px-0"
            )}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
            {!collapsed && (
              <span className="ml-2">{t("collapse")}</span>
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl flex flex-col transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          sidebarItems={sidebarItems}
          userType={userType}
          collapsed={false}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>

        {children}
      </main>
    </div>
  );
}
