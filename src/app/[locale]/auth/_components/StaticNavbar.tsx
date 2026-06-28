// src/app/[locale]/admin/_components/StaticNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StaticNavbar() {
  const pathname = usePathname();
  
  // Simple navigation items
  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/candidates", label: "Candidates" },
    { href: "/admin/evaluations", label: "Evaluations" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin/dashboard" className="text-xl font-bold">
                Admin Panel
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === item.href
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <Link
              href="/"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Back to Site
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}