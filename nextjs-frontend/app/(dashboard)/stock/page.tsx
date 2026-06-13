"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Package, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatCard } from "@/components/shared/StatCard";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { api } from "@/lib/api";
import type { StockPurchase } from "@/types";

const columns = [
  { key: "date", header: "Date", sortable: true, render: (s: StockPurchase) => <span className="font-mono text-xs text-text-secondary">{formatDate(s.date)}</span> },
  { key: "productName", header: "Product", sortable: true, render: (s: StockPurchase) => <span className="font-medium text-text-primary">{s.productName}</span> },
  { key: "distributorName", header: "Distributor", sortable: true, render: (s: StockPurchase) => <span className="text-text-secondary">{s.distributorName}</span> },
  { key: "quantity", header: "Qty", sortable: true, render: (s: StockPurchase) => <span className="font-mono">{s.quantity}</span> },
  { key: "purchasePrice", header: "Purchase Price", sortable: true, render: (s: StockPurchase) => <span className="font-mono">{formatCurrency(s.purchasePrice)}</span> },
  { key: "expiry", header: "Expiry", sortable: true, render: (s: StockPurchase) => <span className="font-mono text-xs text-text-secondary">{formatDate(s.expiry)}</span> },
  { key: "totalValue", header: "Total Value", sortable: true, render: (s: StockPurchase) => <span className="font-mono font-medium">{formatCurrency(s.totalValue)}</span> },
];

export default function StockPage() {
  const { data: stockEntries = [], isLoading } = useQuery({
    queryKey: ["stock"],
    queryFn: api.stock.list,
  });

  const totalValue = stockEntries.reduce((s: number, i: StockPurchase) => s + i.totalValue, 0);

  return (
    <div>
      <PageHeader
        title="Stock / Purchases"
        subtitle="Track inventory purchases and stock levels"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard title="Total Stock Value" value={totalValue} icon={<Package className="h-5 w-5" />} color="green" prefix="Rs. " />
        <StatCard title="Purchases This Month" value={totalValue} icon={<TrendingUp className="h-5 w-5" />} color="green" prefix="Rs. " />
      </div>
      <DataTable
        columns={columns}
        data={stockEntries}
        keyField="id"
        searchPlaceholder="Search by product or distributor..."
        loading={isLoading}
        emptyTitle="No stock entries found"
      />
    </div>
  );
}
