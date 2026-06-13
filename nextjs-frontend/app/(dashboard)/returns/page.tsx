"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { api } from "@/lib/api";
import type { Return } from "@/types";

const columns = [
  { key: "createdAt", header: "Date", sortable: true, render: (r: Return) => <span className="font-mono text-xs text-text-secondary">{formatDate(r.createdAt)}</span> },
  { key: "saleId", header: "Sale ID", sortable: true, render: (r: Return) => <span className="font-mono text-xs text-text-secondary">{r.saleId}</span> },
  { key: "items", header: "Items", render: (r: Return) => <span className="text-text-secondary">{r.items.length} product(s)</span> },
  { key: "refundAmount", header: "Refund Amount", sortable: true, render: (r: Return) => <span className="font-mono font-medium text-danger">{formatCurrency(r.refundAmount)}</span> },
  { key: "reason", header: "Reason", sortable: true, render: (r: Return) => <span className="text-text-secondary">{r.reason}</span> },
];

export default function ReturnsPage() {
  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["returns"],
    queryFn: api.returns.list,
  });

  return (
    <div>
      <PageHeader
        title="Returns"
        subtitle="Process and track product returns"
        action={{
          label: "New Return",
          onClick: () => {},
          icon: <Plus className="h-4 w-4" />,
        }}
      />
      <DataTable
        columns={columns}
        data={returns}
        keyField="id"
        searchPlaceholder="Search returns..."
        loading={isLoading}
        emptyTitle="No returns recorded"
        emptyDescription="Process your first return to get started."
      />
    </div>
  );
}
