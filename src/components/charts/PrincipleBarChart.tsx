'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface Props {
  data: { name: string; value: number }[];
  title: string;
}

export function PrincipleBarChart({ data, title }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h4 className="text-sm font-semibold text-muted-foreground mb-4">{title}</h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#71717a' }} />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fontSize: 11, fill: '#a5a5c0' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111118',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
