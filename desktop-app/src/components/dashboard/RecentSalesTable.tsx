import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";
import { api } from "@/lib/api";
import type { Sale } from "@/types";

export default function RecentSalesTable() {
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: () => api.sales.listRecent(5),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Customer</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Total</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Paid</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {sales.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-sm text-text-secondary">No sales yet</td>
            </tr>
          ) : (
            sales.map((sale: Sale) => (
              <tr key={sale.id} className="border-b border-border hover:bg-surface-2/50 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-text-secondary">{formatDateTime(sale.created_at)}</td>
                <td className="py-3 px-4 text-text-primary">{sale.customer_name || "Walk-in"}</td>
                <td className="py-3 px-4 text-right font-mono font-medium">{formatCurrency(sale.total)}</td>
                <td className="py-3 px-4 text-right font-mono">{formatCurrency(sale.amount_paid)}</td>
                <td className="py-3 px-4 text-center"><StatusBadge status={sale.status} /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
