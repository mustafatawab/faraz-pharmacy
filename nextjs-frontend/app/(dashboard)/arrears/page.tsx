"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { api } from "@/lib/api";
import type { Arrear } from "@/types";

export default function ArrearsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  const { data: arrears = [], isLoading } = useQuery({
    queryKey: ["arrears", filter],
    queryFn: () => api.arrears.list(filter === "all" ? undefined : filter),
  });

  const recordPayment = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.arrears.recordPayment(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arrears"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setPayingId(null);
      setPaymentAmount("");
    },
  });

  const totalOutstanding = arrears
    .filter((a: Arrear) => a.status === "pending")
    .reduce((s: number, a: Arrear) => s + a.balanceDue, 0);

  return (
    <div>
      <PageHeader title="Arrears" subtitle="Track and manage outstanding payments" />
      <StatCard title="Total Outstanding" value={totalOutstanding} icon={<CreditCard className="h-5 w-5" />} color="amber" prefix="Rs. " />

      <div className="mt-6">
        <Tabs defaultValue="all" onValueChange={(v) => { setFilter(v); setPayingId(null); }}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="settled">Settled</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Sale Date</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Total Bill</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Paid</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Balance Due</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7}><Skeleton className="h-10 w-full" /></td>
                  </tr>
                ))
              ) : arrears.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-text-secondary">No arrear records found.</td>
                </tr>
              ) : (
                (arrears as Arrear[]).map((arrear) => (
                  <tr key={arrear.id} className="border-b border-border hover:bg-surface-2/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-text-primary">{arrear.customerName}</td>
                    <td className="py-3 px-4 font-mono text-xs text-text-secondary">{formatDate(arrear.saleDate)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(arrear.totalBill)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(arrear.amountPaid)}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-warning">{formatCurrency(arrear.balanceDue)}</td>
                    <td className="py-3 px-4 text-center"><StatusBadge status={arrear.status} /></td>
                    <td className="py-3 px-4 text-center">
                      {arrear.status === "pending" && (
                        <div className="flex items-center gap-2 justify-center">
                          {payingId === arrear.id ? (
                            <>
                              <Input type="number" placeholder="Amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="h-8 w-24 text-sm font-mono" autoFocus />
                              <Button size="sm" className="h-8" onClick={() => recordPayment.mutate({ id: arrear.id, amount: Number(paymentAmount) })} disabled={!paymentAmount}>Pay</Button>
                              <Button size="sm" variant="ghost" className="h-8" onClick={() => setPayingId(null)}>Cancel</Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" className="h-8" onClick={() => setPayingId(arrear.id)}>Record Payment</Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
