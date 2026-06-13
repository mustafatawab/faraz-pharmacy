"use client";

import { useState, useEffect } from "react";
import { TrendingUp, AlertCircle, Package, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/shared/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import DonutChart from "@/components/dashboard/DonutChart";
import RecentSalesTable from "@/components/dashboard/RecentSalesTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: api.dashboard.stats,
  });

  if (!mounted) return null;

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
        <StatCard title="Today's Revenue" value={stats?.todayRevenue ?? 0} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Outstanding Arrears" value={stats?.totalArrears ?? 0} icon={<AlertCircle className="h-5 w-5" />} />
        <StatCard title="Low Stock Items" value={stats?.lowStockCount ?? 0} icon={<Package className="h-5 w-5" />} />
        <StatCard title="Expiring Soon" value={stats?.expiringSoonCount ?? 0} icon={<Clock className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats?.weekRevenue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={stats?.topProducts} />
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
