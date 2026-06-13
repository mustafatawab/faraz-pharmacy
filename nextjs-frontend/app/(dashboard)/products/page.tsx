"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { api } from "@/lib/api";
import type { Product } from "@/types";

const columns = [
  { key: "barcode", header: "Barcode", sortable: true, render: (p: Product) => <span className="font-mono text-xs text-text-secondary">{p.barcode}</span> },
  { key: "name", header: "Name", sortable: true, render: (p: Product) => <span className="font-medium text-text-primary">{p.name}</span> },
  { key: "company", header: "Company", sortable: true, render: (p: Product) => <span className="text-text-secondary">{p.company}</span> },
  { key: "salePrice", header: "Sale Price", sortable: true, render: (p: Product) => <span className="font-mono font-medium">{formatCurrency(p.salePrice)}</span> },
  { key: "stockQty", header: "Stock Qty", sortable: true, render: (p: Product) => (
    <span className={`font-mono font-medium ${p.stockQty <= 5 ? "text-danger" : "text-text-primary"}`}>{p.stockQty}</span>
  ) },
  { key: "expiry", header: "Expiry", sortable: true, render: (p: Product) => <span className="font-mono text-xs text-text-secondary">{formatDate(p.expiry)}</span> },
  { key: "status", header: "Status", sortable: true, render: (p: Product) => <StatusBadge status={p.status} /> },
];

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: api.products.list,
  });

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your pharmacy inventory"
      />
      <DataTable
        columns={columns}
        data={products}
        keyField="id"
        searchPlaceholder="Search by name, barcode, or company..."
        loading={isLoading}
        emptyTitle="No products found"
        emptyDescription="Add your first product to get started."
      />
    </div>
  );
}
