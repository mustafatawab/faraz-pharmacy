import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone, MapPin, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";
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
            <Phone className="h-3.5 w-3.5" />
            {customer.phone}
          </div>
          {customer.address && (
            <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
              <MapPin className="h-3.5 w-3.5" />
              {customer.address}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <ShoppingBag className="h-4 w-4 text-text-secondary" />
            <CardTitle className="text-sm font-medium text-text-secondary">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">{customer.total_purchases ?? customer.purchases?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <ShoppingBag className="h-4 w-4 text-text-secondary" />
            <CardTitle className="text-sm font-medium text-text-secondary">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">{formatCurrency(customer.purchases?.reduce((s: number, p: Sale) => s + p.total, 0) ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <ShoppingBag className="h-4 w-4 text-warning" />
            <CardTitle className="text-sm font-medium text-text-secondary">Outstanding Arrear</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold font-mono ${(customer.outstanding_arrear ?? 0) > 0 ? "text-warning" : "text-text-primary"}`}>
              {formatCurrency(customer.outstanding_arrear ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="purchases">
        <TabsList>
          <TabsTrigger value="purchases">Purchase History</TabsTrigger>
          <TabsTrigger value="arrears">Arrear History</TabsTrigger>
        </TabsList>
        <TabsContent value="purchases">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Items</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Total</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Paid</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-text-secondary uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(customer.purchases ?? []).length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-sm text-text-secondary">No purchases yet</td></tr>
                  ) : (
                    (customer.purchases as Sale[]).map((sale) => (
                      <tr key={sale.id} className="border-b border-border hover:bg-surface-2/50">
                        <td className="py-3 px-4 font-mono text-xs text-text-secondary">{formatDate(sale.created_at)}</td>
                        <td className="py-3 px-4 text-text-secondary">{sale.items?.length ?? 0} items</td>
                        <td className="py-3 px-4 text-right font-mono font-medium">{formatCurrency(sale.total)}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(sale.amount_paid)}</td>
                        <td className="py-3 px-4 text-center"><StatusBadge status={sale.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="arrears">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Total Bill</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Paid</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Balance</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-text-secondary uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(customer.arrears ?? []).length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-sm text-text-secondary">No arrears</td></tr>
                  ) : (
                    (customer.arrears as Arrear[]).map((arrear) => (
                      <tr key={arrear.id} className="border-b border-border hover:bg-surface-2/50">
                        <td className="py-3 px-4 font-mono text-xs text-text-secondary">{formatDate(arrear.created_at)}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(arrear.total_bill)}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(arrear.amount_paid)}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium">{formatCurrency(arrear.balance_due)}</td>
                        <td className="py-3 px-4 text-center"><StatusBadge status={arrear.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
