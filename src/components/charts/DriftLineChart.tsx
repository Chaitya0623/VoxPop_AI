'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { PreferenceDriftPoint } from '@/lib/types';

interface Props {
  data: PreferenceDriftPoint[];
  title: string;
}

export function DriftLineChart({ data, title }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h4 className="text-sm font-semibold text-muted-foreground mb-4">{title}</h4>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#71717a' }} />
          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111118',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type="monotone"
            dataKey="averageAccuracyPref"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Accuracy Pref"
          />
          <Line
            type="monotone"
            dataKey="averageFairnessPref"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Fairness Pref"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
