"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, AlertCircle, Package, Clock } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: api.dashboard.stats,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[350px] rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Revenue" value={stats?.todayRevenue ?? 0} icon={<TrendingUp className="h-5 w-5" />} trend={12.5} color="green" prefix="Rs. " />
        <StatCard title="Outstanding Arrears" value={stats?.totalArrears ?? 0} icon={<AlertCircle className="h-5 w-5" />} trend={-3.2} color="amber" prefix="Rs. " />
        <StatCard title="Low Stock Items" value={stats?.lowStockCount ?? 0} icon={<Package className="h-5 w-5" />} trend={25} color="red" />
        <StatCard title="Expiring Soon" value={stats?.expiringSoonCount ?? 0} icon={<Clock className="h-5 w-5" />} trend={0} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientOnly><RevenueChart data={stats?.weekRevenue} /></ClientOnly>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientOnly><DonutChart data={stats?.topProducts} /></ClientOnly>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentSalesTable />
        </CardContent>
      </Card>
    </div>
  );
}
