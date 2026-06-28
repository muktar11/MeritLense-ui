"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChartData } from '@/types/admin-dashboard';

interface LineChartCardProps {
  title: string;
  data: LineChartData[];
  dataKey?: string;
  lineColor?: string;
}

export function LineChartCard({ 
  title, 
  data, 
  dataKey = 'value',
  lineColor = '#3D72FC' 
}: LineChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[350px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
            />
            <Line 
              type="monotone"
              dataKey={dataKey} 
              stroke={lineColor}
              strokeWidth={2}
              dot={{ fill: lineColor, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}