import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  subtitle?: string;
  loading?: boolean;
}

export default function StatCard({ title, value, icon, trend, subtitle, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 space-y-3">
        <div className="h-4 w-24 bg-surface-2 rounded animate-pulse" />
        <div className="h-8 w-32 bg-surface-2 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-surface p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="text-2xl font-bold text-text-primary">
            {typeof value === "number" && title.toLowerCase().includes("revenue") ? formatCurrency(value) : value}
          </p>
          {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        </div>
        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-sm">
          {trend.positive ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-danger" />
          )}
          <span className={trend.positive ? "text-success" : "text-danger"}>{trend.value}%</span>
          <span className="text-text-secondary">vs last week</span>
        </div>
      )}
    </motion.div>
  );
}
