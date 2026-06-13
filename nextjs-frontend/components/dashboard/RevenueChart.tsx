"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";

const defaultData = [
  { day: "Mon", revenue: 12500 },
  { day: "Tue", revenue: 18200 },
  { day: "Wed", revenue: 15800 },
  { day: "Thu", revenue: 22100 },
  { day: "Fri", revenue: 19400 },
  { day: "Sat", revenue: 25600 },
  { day: "Sun", revenue: 18900 },
];

interface RevenueChartProps {
  data?: { day: string; revenue: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              fontSize: "13px",
            }}
            formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
            labelStyle={{ color: "var(--text-secondary)", marginBottom: 4 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
