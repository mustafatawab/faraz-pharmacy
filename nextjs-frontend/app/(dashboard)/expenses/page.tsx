"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { api } from "@/lib/api";
import type { Expense } from "@/types";

const categories = ["All", "Utilities", "Salaries", "Supplies", "Rent"];

export default function ExpensesPage() {
  const [category, setCategory] = useState("All");
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: api.expenses.list,
  });

  const filtered = category === "All" ? expenses : expenses.filter((e: Expense) => e.category === category);
  const totalThisMonth = expenses
    .filter((e: Expense) => e.date?.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s: number, e: Expense) => s + e.amount, 0);

  const columns = [
    { key: "date", header: "Date", sortable: true, render: (e: Expense) => <span className="font-mono text-xs text-text-secondary">{formatDate(e.date)}</span> },
    { key: "title", header: "Title", sortable: true, render: (e: Expense) => <span className="font-medium text-text-primary">{e.title}</span> },
    { key: "category", header: "Category", sortable: true, render: (e: Expense) => (
      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-secondary font-medium">{e.category}</span>
    ) },
    { key: "amount", header: "Amount", sortable: true, render: (e: Expense) => <span className="font-mono font-medium">{formatCurrency(e.amount)}</span> },
    { key: "notes", header: "Notes", render: (e: Expense) => <span className="text-text-secondary text-xs">{e.notes || "—"}</span> },
  ];

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Track and manage operational expenses" />
      <StatCard title="Total This Month" value={totalThisMonth} icon={<Wallet className="h-5 w-5" />} color="red" prefix="Rs. " />

      <div className="mt-6">
        <div className="flex gap-2 mb-4 flex-wrap">
          {categories.map((cat) => (
            <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => setCategory(cat)}>{cat}</Button>
          ))}
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          keyField="id"
          searchable={false}
          loading={isLoading}
          emptyTitle="No expenses found"
        />
      </div>
    </div>
  );
}
