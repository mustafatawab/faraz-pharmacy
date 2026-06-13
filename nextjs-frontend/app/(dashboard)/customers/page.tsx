"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { api } from "@/lib/api";
import type { Customer } from "@/types";

const columns = [
  { key: "name", header: "Name", sortable: true, render: (c: Customer) => <span className="font-medium text-text-primary">{c.name}</span> },
  { key: "phone", header: "Phone", sortable: true, render: (c: Customer) => <span className="font-mono text-xs text-text-secondary">{c.phone}</span> },
  { key: "totalPurchases", header: "Total Purchases", sortable: true, render: (c: Customer) => <span className="font-mono font-medium">{c.totalPurchases}</span> },
  { key: "outstandingArrear", header: "Arrear", sortable: true, render: (c: Customer) => (
    <span className={`font-mono font-medium ${c.outstandingArrear > 0 ? "text-warning" : "text-text-secondary"}`}>
      {c.outstandingArrear > 0 ? formatCurrency(c.outstandingArrear) : "—"}
    </span>
  ) },
  { key: "lastPurchase", header: "Last Purchase", sortable: true, render: (c: Customer) => <span className="text-xs text-text-secondary">{formatDate(c.lastPurchase)}</span> },
];

export default function CustomersPage() {
  const router = useRouter();
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: api.customers.list,
  });

  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage your customer relationships" />
      <DataTable
        columns={columns}
        data={customers}
        keyField="id"
        searchPlaceholder="Search by name or phone..."
        loading={isLoading}
        emptyTitle="No customers found"
        onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
      />
    </div>
  );
}
