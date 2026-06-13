"use client";

import { motion, useSpring, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trend?: number;
  color: "green" | "amber" | "red" | "orange";
  prefix?: string;
  format?: boolean;
}

const colorConfig = {
  green: { border: "border-l-success", bg: "bg-success/5", icon: "text-success" },
  amber: { border: "border-l-warning", bg: "bg-warning/5", icon: "text-warning" },
  red: { border: "border-l-danger", bg: "bg-danger/5", icon: "text-danger" },
  orange: { border: "border-l-orange-500", bg: "bg-orange-500/5", icon: "text-orange-500" },
};

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 100, damping: 30 });

  useMotionValueEvent(springValue, "change", (latest) => {
    setDisplayValue(Math.round(latest));
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <span>{prefix}{displayValue.toLocaleString()}</span>;
}

export function StatCard({ title, value, icon, trend, color, prefix = "", format = false }: StatCardProps) {
  const config = colorConfig[color];

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "rounded-xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow duration-150 border-l-[3px]",
        config.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg", config.bg)}>
          <div className={cn("h-5 w-5", config.icon)}>{icon}</div>
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend >= 0 ? "text-success bg-success/10" : "text-danger bg-danger/10"
          )}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-semibold tracking-tight font-mono text-text-primary">
          <AnimatedNumber value={value} prefix={prefix} />
        </p>
        <p className="text-sm text-text-secondary mt-1">{title}</p>
      </div>
    </motion.div>
  );
}
