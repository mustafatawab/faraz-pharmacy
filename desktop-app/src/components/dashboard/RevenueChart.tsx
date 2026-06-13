import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data?: { day: string; revenue: number }[];
}

export default function RevenueChart({ data = [] }: RevenueChartProps) {
  if (data.length === 0) {
    data = Array.from({ length: 7 }, (_, i) => ({
      day: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString("en-US", { weekday: "short" }),
      revenue: 0,
    }));
  }

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "Revenue"]}
            contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
          />
          <Bar dataKey="revenue" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
