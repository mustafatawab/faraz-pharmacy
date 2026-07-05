import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, AlertCircle, Package, Clock } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import DonutChart from "@/components/dashboard/DonutChart";
import RecentSalesTable from "@/components/dashboard/RecentSalesTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
} as const;

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: api.dashboard.stats,
  });

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="lg:col-span-2 h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
        <Skeleton className="h-[260px] rounded-xl" />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div variants={itemVariants}>
          <StatCard
            title="Today's Revenue"
            value={stats?.todayRevenue ?? 0}
            icon={<TrendingUp className="h-4 w-4" />}
            delay={0}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Outstanding Arrears"
            value={stats?.totalArrears ?? 0}
            icon={<AlertCircle className="h-4 w-4" />}
            delay={0.05}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Low Stock Items"
            value={stats?.lowStockCount ?? 0}
            icon={<Package className="h-4 w-4" />}
            delay={0.1}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Expiring Soon"
            value={stats?.expiringSoonCount ?? 0}
            icon={<Clock className="h-4 w-4" />}
            delay={0.15}
          />
        </motion.div>
      </div>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats?.weekRevenue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>By sales volume</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={stats?.topProducts} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSalesTable />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
