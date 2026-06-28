"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChartData } from '@/types/admin-dashboard';

interface BarChartCardProps {
  title: string;
  data: BarChartData[];
  dataKey?: string;
  barColor?: string;
}

export function BarChartCard({ 
  title, 
  data, 
  dataKey = 'value',
  barColor = '#3D72FC' 
}: BarChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              cursor={{ fill: 'rgba(61, 114, 252, 0.1)' }}
            />
            <Bar 
              dataKey={dataKey} 
              fill={barColor}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}