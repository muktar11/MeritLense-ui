"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChartData } from '@/types/admin-dashboard';
import { useEffect, useState } from 'react';

interface PieChartCardProps {
  title: string;
  data: PieChartData[];
}

const COLORS = ['#3D72FC', '#8A4FFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function PieChartCard({ title, data }: PieChartCardProps) {
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    setIsRTL(document.dir === 'rtl');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data as any}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={isRTL ? 70 : 80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  direction: isRTL ? 'rtl' : 'ltr'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{
                  direction: isRTL ? 'rtl' : 'ltr',
                  textAlign: isRTL ? 'right' : 'left'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}