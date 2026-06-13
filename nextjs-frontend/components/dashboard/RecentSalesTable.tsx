"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { formatCurrency, formatTime } from "@/lib/formatters";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { Sale } from "@/types";

export function RecentSalesTable() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: () => api.sales.listRecent(10),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-text-secondary">
        No sales recorded yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Time</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Customer</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Items</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Total</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Paid</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {(sales as Sale[]).map((sale, idx) => (
            <motion.tr
              key={sale.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className="border-b border-border hover:bg-surface-2/50 transition-colors"
            >
              <td className="py-3 px-4 text-text-secondary font-mono text-xs">
                {mounted ? formatTime(sale.createdAt) : "—"}
              </td>
              <td className="py-3 px-4 font-medium text-text-primary">
                {sale.customerName || "Walk-in"}
              </td>
              <td className="py-3 px-4 text-text-secondary">
                {sale.items?.length ?? 0} items
              </td>
              <td className="py-3 px-4 text-right font-mono font-medium">
                {formatCurrency(sale.total)}
              </td>
              <td className="py-3 px-4 text-right font-mono">
                {formatCurrency(sale.amountPaid)}
              </td>
              <td className="py-3 px-4 text-center">
                <StatusBadge status={sale.status} />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
