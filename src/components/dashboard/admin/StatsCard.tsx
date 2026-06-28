import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { StatCard as StatCardType } from '@/types/admin-dashboard';

interface StatsCardProps {
  data: StatCardType;
  icon: LucideIcon;
}

export function StatsCard({ data, icon: Icon }: StatsCardProps) {
  const getChangeColor = () => {
    if (!data.changeType) return 'text-gray-500';
    
    switch (data.changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {data.title}
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {data.value}
            </p>
            {data.change && (
              <p className={`text-sm font-medium mt-2 ${getChangeColor()}`}>
                {data.change}
              </p>
            )}
          </div>
          <div className="ml-4">
            <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary-500" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}