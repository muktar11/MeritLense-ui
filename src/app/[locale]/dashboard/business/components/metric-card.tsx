"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Users, Award, Coins, TrendingUp } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: "clipboard" | "users" | "certificate" | "coins" | "trending"
  highlight?: boolean
  showButton?: boolean
  buttonText?: string
}

const iconMap = {
  clipboard: ClipboardList,
  users: Users,
  certificate: Award,
  coins: Coins,
  trending: TrendingUp,
}

const iconColorMap = {
  clipboard: "text-blue-500",
  users: "text-blue-600",
  certificate: "text-blue-500",
  coins: "text-amber-500",
  trending: "text-green-500",
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  highlight = false,
  showButton = false,
  buttonText
}: MetricCardProps) {
  const Icon = iconMap[icon]
  const iconColor = iconColorMap[icon]
  
  return (
    <Card className={`p-4 flex-1 ${highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className={`text-xs ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-500' : 
            'text-gray-500'
          }`}>
            {change}
          </p>
          {showButton && (
            <Button size="sm" className="mt-2 bg-amber-400 hover:bg-amber-500 text-amber-900 text-xs h-7 px-3 rounded-md">
              {buttonText}
            </Button>
          )}
        </div>
        <div className={`p-2 rounded-lg ${highlight ? 'bg-blue-100' : 'bg-gray-50'}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </Card>
  )
}
