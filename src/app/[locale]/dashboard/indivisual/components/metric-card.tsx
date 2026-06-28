import { Card, CardContent } from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: string
  change: string
  icon: string
}

export function MetricCard({ title, value, change, icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <div className="text-2xl">{icon}</div>
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{change}</div>
      </CardContent>
    </Card>
  )
}
