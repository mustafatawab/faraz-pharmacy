import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, TrendingUp, Package, Wallet, Undo2, CreditCard } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RevenueChart from "@/components/dashboard/RevenueChart";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Product, Expense, Sale, ReturnEntry, Arrear } from "@/types";

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: api.dashboard.stats,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: api.products.list,
  });

  const { data: allSales = [] } = useQuery({
    queryKey: ["sales", "recent", 500],
    queryFn: () => api.sales.listRecent(500),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: api.expenses.list,
  });

  const { data: returns = [] } = useQuery({
    queryKey: ["returns"],
    queryFn: api.returns.list,
  });

  const { data: arrears = [] } = useQuery({
    queryKey: ["arrears"],
    queryFn: () => api.arrears.list(),
  });

  const lowStockProducts = products.filter((p: Product) => p.stock_qty > 0 && p.stock_qty <= 5);
  const expiringProducts = products.filter((p: Product) => {
    if (!p.expiry) return false;
    const daysLeft = (new Date(p.expiry).getTime() - Date.now()) / 86400000;
    return daysLeft > 0 && daysLeft <= 30;
  });

  const filteredSales = allSales.filter((s: Sale) =>
    s.created_at >= dateRange.from && s.created_at <= dateRange.to + "T23:59:59"
  );
  const totalRevenue = filteredSales.reduce((sum: number, s: Sale) => sum + s.total, 0);

  const filteredExpenses = expenses.filter((e: Expense) =>
    e.date >= dateRange.from && e.date <= dateRange.to
  );
  const totalExpenses = filteredExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);

  const filteredReturns = returns.filter((r: ReturnEntry) =>
    r.created_at >= dateRange.from && r.created_at <= dateRange.to + "T23:59:59"
  );
  const totalRefunds = filteredReturns.reduce((sum: number, r: ReturnEntry) => sum + r.refund_amount, 0);

  const filteredArrears = arrears.filter((a: Arrear) =>
    a.created_at >= dateRange.from && a.created_at <= dateRange.to + "T23:59:59"
  );
  const totalOutstanding = filteredArrears.filter((a: Arrear) => a.status === "pending").reduce((sum: number, a: Arrear) => sum + a.balance_due, 0);
  const pendingArrears = filteredArrears.filter((a: Arrear) => a.status === "pending");

  const weekRevenue = dashboardStats?.weekRevenue ?? [];

  return (
    <div>
      <PageHeader title="Reports" description="Analyze your business performance" />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">From:</span>
          <Input type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))} className="h-9 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">To:</span>
          <Input type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))} className="h-9 w-40" />
        </div>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="mb-6">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="stock">Stock Report</TabsTrigger>
          <TabsTrigger value="expense">Expense Report</TabsTrigger>
          <TabsTrigger value="returns">Returns Report</TabsTrigger>
          <TabsTrigger value="arrears">Arrears Report</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Revenue (selected period)</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold font-mono">{formatCurrency(totalRevenue)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Transactions</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold font-mono">{filteredSales.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Total Expenses</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-semibold font-mono">{formatCurrency(totalExpenses)}</p></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Revenue Trend (7 days)</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Export</Button>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold text-warning flex items-center gap-2"><Package className="h-4 w-4" />Low Stock Items (&le;5)</CardTitle></CardHeader>
              <CardContent className="p-0">
                {lowStockProducts.length === 0 ? (
                  <p className="text-center py-8 text-sm text-text-secondary">No low stock items</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Product</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Stock</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Threshold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.map((p: Product) => (
                        <tr key={p.id} className="border-b border-border last:border-0">
                          <td className="py-3 px-4 text-text-primary">{p.name}</td>
                          <td className="py-3 px-4 text-right font-mono text-danger font-medium">{p.stock_qty}</td>
                          <td className="py-3 px-4 text-right font-mono text-text-secondary">5</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold text-danger flex items-center gap-2"><Package className="h-4 w-4" />Expiring Items (30 days)</CardTitle></CardHeader>
              <CardContent className="p-0">
                {expiringProducts.length === 0 ? (
                  <p className="text-center py-8 text-sm text-text-secondary">No items expiring soon</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Product</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Expiry</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Days Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiringProducts.map((p: Product) => {
                        const daysLeft = p.expiry ? Math.ceil((new Date(p.expiry).getTime() - Date.now()) / 86400000) : 0;
                        return (
                          <tr key={p.id} className="border-b border-border last:border-0">
                            <td className="py-3 px-4 text-text-primary">{p.name}</td>
                            <td className="py-3 px-4 font-mono text-sm text-text-secondary">{formatDate(p.expiry)}</td>
                            <td className="py-3 px-4 text-right font-mono text-danger font-medium">{daysLeft}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expense">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Wallet className="h-4 w-4 text-text-secondary" />
                <CardTitle className="text-sm font-medium text-text-secondary">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold font-mono">{formatCurrency(totalExpenses)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <CardTitle className="text-sm font-medium text-text-secondary">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold font-mono text-success">{formatCurrency(Math.max(0, totalRevenue - totalExpenses))}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Expense Breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              {filteredExpenses.length === 0 ? (
                <p className="text-center py-8 text-sm text-text-secondary">No expenses in this period</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Title</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Category</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Amount</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((e: Expense) => (
                      <tr key={e.id} className="border-b border-border hover:bg-surface-2/50">
                        <td className="py-3 px-4 text-text-primary">{e.title}</td>
                        <td className="py-3 px-4 text-text-secondary">{e.category}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-danger">{formatCurrency(e.amount)}</td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-text-secondary">{formatDate(e.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Undo2 className="h-4 w-4 text-text-secondary" />
                <CardTitle className="text-sm font-medium text-text-secondary">Total Refunds</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold font-mono text-danger">{formatCurrency(totalRefunds)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Undo2 className="h-4 w-4 text-text-secondary" />
                <CardTitle className="text-sm font-medium text-text-secondary">Total Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold font-mono">{filteredReturns.length}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Return History</CardTitle></CardHeader>
            <CardContent className="p-0">
              {filteredReturns.length === 0 ? (
                <p className="text-center py-8 text-sm text-text-secondary">No returns in this period</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Sale ID</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Refund</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReturns.map((r: ReturnEntry) => (
                      <tr key={r.id} className="border-b border-border hover:bg-surface-2/50">
                        <td className="py-3 px-4 font-mono text-xs text-text-secondary">{formatDateTime(r.created_at)}</td>
                        <td className="py-3 px-4 font-mono text-xs text-text-secondary">{r.sale_id.slice(0, 8)}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-danger">{formatCurrency(r.refund_amount)}</td>
                        <td className="py-3 px-4 text-text-secondary">{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arrears">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <CreditCard className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-medium text-text-secondary">Outstanding Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold font-mono text-warning">{formatCurrency(totalOutstanding)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <CreditCard className="h-4 w-4 text-text-secondary" />
                <CardTitle className="text-sm font-medium text-text-secondary">Pending Arrears</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold font-mono">{pendingArrears.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <CreditCard className="h-4 w-4 text-text-secondary" />
                <CardTitle className="text-sm font-medium text-text-secondary">Total Arrears (period)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold font-mono">{filteredArrears.length}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Arrear Details</CardTitle></CardHeader>
            <CardContent className="p-0">
              {filteredArrears.length === 0 ? (
                <p className="text-center py-8 text-sm text-text-secondary">No arrears in this period</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Customer</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Date</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Total Bill</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Paid</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Balance</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-text-secondary uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArrears.map((a: Arrear) => (
                      <tr key={a.id} className="border-b border-border hover:bg-surface-2/50">
                        <td className="py-3 px-4 font-medium text-text-primary">{a.customer_name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-text-secondary">{formatDateTime(a.created_at)}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(a.total_bill)}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(a.amount_paid)}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium">{formatCurrency(a.balance_due)}</td>
                        <td className="py-3 px-4 text-center"><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
