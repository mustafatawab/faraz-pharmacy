"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const defaultData = [
  { name: "Amoxicillin", value: 320 },
  { name: "Paracetamol", value: 280 },
  { name: "Omeprazole", value: 210 },
  { name: "Atorvastatin", value: 180 },
  { name: "Metformin", value: 150 },
];

const COLORS = [
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "#8B5CF6",
  "var(--danger)",
];

interface DonutChartProps {
  data?: { name: string; value: number }[];
}

export function DonutChart({ data }: DonutChartProps) {
  const chartData = data && data.length > 0 ? data : defaultData;
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              fontSize: "13px",
            }}
            formatter={(value) => [`${((Number(value) / total) * 100).toFixed(1)}%`, "Share"]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
