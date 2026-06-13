"use client";

import { useState } from "react";
import { BarChart3, Download, TrendingUp, Package, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/formatters";

const reportSales = [
  { id: "s1", date: "2026-06-02", customer: "Walk-in", items: 3, total: 1200, status: "paid" as const },
  { id: "s2", date: "2026-06-01", customer: "Ahmed Khan", items: 2, total: 850, status: "partial" as const },
  { id: "s3", date: "2026-05-31", customer: "Fatima Ali", items: 5, total: 2300, status: "paid" as const },
];

const lowStockItems = [
  { name: "Omeprazole 20mg", stock: 3, threshold: 10 },
  { name: "Losartan 50mg", stock: 15, threshold: 20 },
];

const expiringItems = [
  { name: "Salbutamol Inhaler", expiry: "2026-05-10", daysLeft: -23 },
  { name: "Losartan 50mg", expiry: "2026-07-31", daysLeft: 59 },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({ from: "2026-05-01", to: "2026-06-02" });

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Analyze your business performance"
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">From:</span>
          <Input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="h-9 w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">To:</span>
          <Input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="h-9 w-40"
          />
        </div>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="mb-6">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="stock">Stock Report</TabsTrigger>
          <TabsTrigger value="expense">Expense Report</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                <RevenueChart />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Sales Details</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Customer</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Items</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Total</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportSales.map((sale) => (
                      <tr key={sale.id} className="border-b border-border hover:bg-surface-2/50">
                        <td className="py-3 px-4 font-mono text-xs text-text-secondary">{formatDate(sale.date)}</td>
                        <td className="py-3 px-4 text-text-primary">{sale.customer}</td>
                        <td className="py-3 px-4 text-text-secondary">{sale.items}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium">{formatCurrency(sale.total)}</td>
                        <td className="py-3 px-4 text-center"><StatusBadge status={sale.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stock">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-warning flex items-center gap-2">
                  <Package className="h-4 w-4" /> Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Product</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Stock</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="py-3 px-4 font-medium text-text-primary">{item.name}</td>
                        <td className="py-3 px-4 text-right font-mono text-danger">{item.stock}</td>
                        <td className="py-3 px-4 text-right font-mono text-text-secondary">{item.threshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-danger flex items-center gap-2">
                  <Package className="h-4 w-4" /> Expiring Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Product</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Expiry</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Days Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringItems.map((item, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="py-3 px-4 font-medium text-text-primary">{item.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-text-secondary">{formatDate(item.expiry)}</td>
                        <td className={`py-3 px-4 text-right font-mono ${item.daysLeft < 0 ? "text-danger" : "text-warning"}`}>
                          {item.daysLeft < 0 ? "Expired" : `${item.daysLeft} days`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expense">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <Wallet className="h-4 w-4 text-text-secondary" />
                  <CardTitle className="text-sm font-medium text-text-secondary">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold font-mono">{formatCurrency(142500)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <CardTitle className="text-sm font-medium text-text-secondary">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold font-mono text-success">{formatCurrency(187500)}</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Expense Breakdown by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { category: "Salaries", amount: 85000, percentage: 59 },
                    { category: "Rent", amount: 40000, percentage: 28 },
                    { category: "Utilities", amount: 15000, percentage: 10 },
                    { category: "Supplies", amount: 2500, percentage: 2 },
                  ].map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-primary">{item.category}</span>
                        <span className="font-mono text-text-secondary">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
