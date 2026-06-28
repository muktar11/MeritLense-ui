"use client"

import type React from "react"
import { Home, Users, Settings, Briefcase, CheckSquare, TrendingUp, CreditCard } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: Users, label: "Company Profile", href: "/company-profile" },
    { icon: CheckSquare, label: "Candidate Evaluation", href: "/candidate-evaluation" },
    { icon: TrendingUp, label: "Score Management", href: "/score-management" },
    { icon: CreditCard, label: "Payment", href: "/payment" },
    { icon: Briefcase, label: "Partnerships", href: "/partnerships" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-6 space-y-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            B
          </div>
          <span className="font-semibold">B2B</span>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? "bg-purple-600 text-white" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
