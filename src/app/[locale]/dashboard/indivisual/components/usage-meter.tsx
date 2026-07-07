"use client";

import { AlertCircle } from 'lucide-react';

interface UsageMeterProps {
  used: number;
  limit: number;
  label: string;
  unit?: string;
}

export function UsageMeter({ used, limit, label, unit = 'items' }: UsageMeterProps) {
  const percentage = (used / limit) * 100;
  const remaining = Math.max(0, limit - used);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const getColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm items-baseline">
        <span className="text-gray-600">{label}</span>
        <span className="text-right">
          <span className="font-semibold text-gray-900">{remaining} remaining</span>
          <span className="text-gray-400"> ({used} / {limit} {unit} used)</span>
        </span>
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {isNearLimit && !isAtLimit && (
        <div className="flex items-center gap-1 text-xs text-yellow-600">
          <AlertCircle className="w-3 h-3" />
          <span>Approaching limit ({Math.round(percentage)}% used)</span>
        </div>
      )}

      {isAtLimit && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>Limit reached. Upgrade your plan to add more.</span>
        </div>
      )}
    </div>
  );
}