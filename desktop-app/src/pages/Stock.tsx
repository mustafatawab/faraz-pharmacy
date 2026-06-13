import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, Pencil } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import type { StockPurchase, StockInput, Product, Distributor } from "@/types";

const emptyForm = (): StockInput & { productId: string } => ({
  productId: "", quantity: 0, purchasePrice: 0, expiry: undefined,
});

export default function Stock() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ productId: "", quantity: "", purchasePrice: "", expiry: "" });

  const { data: stockEntries = [], isLoading } = useQuery({ queryKey: ["stock"], queryFn: api.stock.list });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: api.products.list });
  const { data: distributors = [] } = useQuery({ queryKey: ["distributors"], queryFn: api.distributors.list });

  const totalValue = stockEntries.reduce((s: number, i: StockPurchase) => s + i.total_value, 0);

  const createMutation = useMutation({
    mutationFn: () => api.stock.create({
      productId: form.productId,
      quantity: Number(form.quantity),
      purchasePrice: Number(form.purchasePrice),
      expiry: form.expiry || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setForm({ productId: "", quantity: "", purchasePrice: "", expiry: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => api.stock.update(editingId!, {
      productId: form.productId,
      quantity: Number(form.quantity),
      purchasePrice: Number(form.purchasePrice),
      expiry: form.expiry || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setEditingId(null);
      setForm({ productId: "", quantity: "", purchasePrice: "", expiry: "" });
    },
  });

  function openAdd() {
    setEditingId(null);
    setForm({ productId: "", quantity: "", purchasePrice: "", expiry: "" });
    setOpen(true);
  }

  function openEdit(entry: StockPurchase) {
    setEditingId(entry.id);
    setForm({
      productId: entry.product_id,
      quantity: String(entry.quantity),
      purchasePrice: String(entry.purchase_price),
      expiry: entry.expiry || "",
    });
    setOpen(true);
  }

  const columns = [
    { key: "created_at", header: "Date", cell: (s: StockPurchase) => <span className="font-mono text-xs text-text-secondary">{formatDate(s.created_at)}</span> },
    { key: "product_name", header: "Product", cell: (s: StockPurchase) => <span className="font-medium text-text-primary">{s.product_name}</span> },
    { key: "quantity", header: "Qty", cell: (s: StockPurchase) => <span className="font-mono">{s.quantity}</span> },
    { key: "purchase_price", header: "Price", cell: (s: StockPurchase) => <span className="font-mono">{formatCurrency(s.purchase_price)}</span> },
    { key: "expiry", header: "Expiry", cell: (s: StockPurchase) => <span className="font-mono text-xs text-text-secondary">{s.expiry ? formatDate(s.expiry) : "—"}</span> },
    { key: "total_value", header: "Total Value", cell: (s: StockPurchase) => <span className="font-mono font-medium">{formatCurrency(s.total_value)}</span> },
    {
      key: "actions", header: "", cell: (s: StockPurchase) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => openEdit(s)} className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Stock / Purchases" description="Track inventory purchases and stock levels" action={{ label: "New Purchase", onClick: openAdd }} />
      <div className="mb-6">
        <StatCard title="Total Stock Value" value={formatCurrency(totalValue)} icon={<Package className="h-5 w-5" />} />
      </div>
      <div className="rounded-xl border border-border">
        <DataTable columns={columns} data={stockEntries} loading={isLoading} keyExtractor={(s: StockPurchase) => s.id} />
      </div>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditingId(null); } setOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Stock Purchase" : "Record Stock Purchase"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Product</Label>
              <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })} disabled={!!editingId}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p: Product) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.barcode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div>
                <Label>Purchase Price</Label>
                <Input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Expiry (optional)</Label>
              <Input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} />
            </div>
            <Button className="w-full" disabled={!form.productId || !form.quantity || !form.purchasePrice || createMutation.isPending || updateMutation.isPending}
              onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}>
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingId ? "Update Purchase" : "Record Purchase"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
