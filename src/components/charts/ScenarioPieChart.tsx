'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: { name: string; value: number }[];
  title: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

export function ScenarioPieChart({ data, title }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h4 className="text-sm font-semibold text-muted-foreground mb-4">{title}</h4>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#111118',
              border: '1px solid #27272a',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e4e4e7',
            }}
            itemStyle={{ color: '#e4e4e7' }}
            labelStyle={{ color: '#a1a1aa' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [`${value ?? 0} votes`, name ?? '']}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#e4e4e7' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
