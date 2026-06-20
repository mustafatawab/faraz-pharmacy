import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";
import StatCard from "@/components/shared/StatCard";
import DataTable from "@/components/shared/DataTable";
import { api } from "@/lib/api";
import type { Sale, Arrear } from "@/types";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => api.customers.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Customer not found</p>
        <Button variant="link" onClick={() => navigate("/customers")}>Back to Customers</Button>
      </div>
    );
  }

  const purchaseColumns = [
    { key: "date", header: "Date", cell: (s: Sale) => <span className="font-mono text-xs text-text-secondary">{formatDate(s.created_at)}</span> },
    { key: "items", header: "Items", cell: (s: Sale) => <span className="text-text-secondary">{s.items?.length ?? 0} items</span> },
    { key: "total", header: "Total", cell: (s: Sale) => <span className="font-mono font-medium">{formatCurrency(s.total)}</span> },
    { key: "paid", header: "Paid", cell: (s: Sale) => <span className="font-mono">{formatCurrency(s.amount_paid)}</span> },
    { key: "status", header: "Status", cell: (s: Sale) => <StatusBadge status={s.status} />, className: "text-center" },
  ];

  const arrearColumns = [
    { key: "date", header: "Date", cell: (a: Arrear) => <span className="font-mono text-xs text-text-secondary">{formatDate(a.created_at)}</span> },
    { key: "total_bill", header: "Total Bill", cell: (a: Arrear) => <span className="font-mono">{formatCurrency(a.total_bill)}</span> },
    { key: "paid", header: "Paid", cell: (a: Arrear) => <span className="font-mono">{formatCurrency(a.amount_paid)}</span> },
    { key: "balance", header: "Balance", cell: (a: Arrear) => <span className="font-mono font-medium">{formatCurrency(a.balance_due)}</span> },
    { key: "status", header: "Status", cell: (a: Arrear) => <StatusBadge status={a.status} />, className: "text-center" },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/customers")} className="gap-1.5 text-text-secondary">
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{customer.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
            <ShoppingBag className="h-3.5 w-3.5" />
            {customer.phone}
          </div>
          {customer.address && (
            <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
              <ShoppingBag className="h-3.5 w-3.5" />
              {customer.address}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Purchases" value={customer.total_purchases ?? customer.purchases?.length ?? 0} icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard title="Total Spent" value={formatCurrency(customer.purchases?.reduce((s: number, p: Sale) => s + p.total, 0) ?? 0)} icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard title="Outstanding Arrear" value={formatCurrency(customer.outstanding_arrear ?? 0)} icon={<ShoppingBag className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="purchases">
        <TabsList>
          <TabsTrigger value="purchases">Purchase History</TabsTrigger>
          <TabsTrigger value="arrears">Arrear History</TabsTrigger>
        </TabsList>
        <TabsContent value="purchases">
          <Card>
            <CardContent className="p-0">
              <DataTable columns={purchaseColumns} data={(customer.purchases ?? []) as Sale[]} keyExtractor={(s: Sale) => s.id} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="arrears">
          <Card>
            <CardContent className="p-0">
              <DataTable columns={arrearColumns} data={(customer.arrears ?? []) as Arrear[]} keyExtractor={(a: Arrear) => a.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
