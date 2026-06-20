import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Package, Pencil, Building2, Factory, FileText } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import type { StockPurchase, Product, Company, Distributor } from "@/types";

export default function Stock() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    productId: "", distributorId: "", companyId: "",
    invoiceNumber: "", purchasePrice: "", salePrice: "", quantity: "", expiry: "",
  });

  const { data: stockEntries = [], isLoading } = useQuery({ queryKey: ["stock"], queryFn: api.stock.list });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: api.products.list });
  const { data: distributors = [] } = useQuery({ queryKey: ["distributors"], queryFn: api.distributors.list });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: api.companies.list });

  const qty = Number(form.quantity) || 0;
  const price = Number(form.purchasePrice) || 0;
  const autoTotal = qty * price;

  const totalValue = stockEntries.reduce((s: number, i: StockPurchase) => s + i.total_value, 0);

  const createMutation = useMutation({
    mutationFn: () => api.stock.create({
      productId: form.productId,
      distributorId: form.distributorId || undefined,
      companyId: form.companyId || undefined,
      invoiceNumber: form.invoiceNumber,
      purchasePrice: Number(form.purchasePrice) || undefined,
      salePrice: Number(form.salePrice) || undefined,
      quantity: Number(form.quantity),
      expiry: form.expiry || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setForm({ productId: "", distributorId: "", companyId: "", invoiceNumber: "", purchasePrice: "", salePrice: "", quantity: "", expiry: "" });
      toast.success("Stock purchase recorded");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => api.stock.update(editingId!, {
      productId: form.productId,
      distributorId: form.distributorId || undefined,
      companyId: form.companyId || undefined,
      invoiceNumber: form.invoiceNumber,
      purchasePrice: Number(form.purchasePrice) || undefined,
      salePrice: Number(form.salePrice) || undefined,
      quantity: Number(form.quantity),
      expiry: form.expiry || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setEditingId(null);
      setForm({ productId: "", distributorId: "", companyId: "", invoiceNumber: "", purchasePrice: "", salePrice: "", quantity: "", expiry: "" });
      toast.success("Stock purchase updated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function openAdd() {
    setEditingId(null);
    setForm({ productId: "", distributorId: "", companyId: "", invoiceNumber: "", purchasePrice: "", salePrice: "", quantity: "", expiry: "" });
    setOpen(true);
  }

  function openEdit(entry: StockPurchase) {
    setEditingId(entry.id);
    setForm({
      productId: entry.product_id,
      distributorId: entry.distributor_id || "",
      companyId: entry.company_id || "",
      invoiceNumber: entry.invoice_number || "",
      purchasePrice: String(entry.purchase_price),
      salePrice: String(entry.sale_price || ""),
      quantity: String(entry.quantity),
      expiry: entry.expiry || "",
    });
    setOpen(true);
  }

  function handleProductChange(productId: string) {
    const product = products.find((p: Product) => p.id === productId);
    setForm({
      ...form,
      productId,
      salePrice: product ? String(product.sale_price) : "",
    });
  }

  const columns = [
    { key: "created_at", header: "Date", cell: (s: StockPurchase) => <span className="font-mono text-xs text-text-secondary">{formatDate(s.created_at)}</span> },
    { key: "product_name", header: "Product", cell: (s: StockPurchase) => <span className="font-medium text-text-primary">{s.product_name}</span> },
    { key: "company_name", header: "Company", cell: (s: StockPurchase) => <span className="text-xs text-text-secondary">{s.company_name || "\u2014"}</span> },
    { key: "distributor_name", header: "Distributor", cell: (s: StockPurchase) => <span className="text-xs text-text-secondary">{s.distributor_name || "\u2014"}</span> },
    { key: "invoice_number", header: "Invoice", cell: (s: StockPurchase) => <span className="font-mono text-xs text-text-secondary">{s.invoice_number || "\u2014"}</span> },
    { key: "quantity", header: "Qty", cell: (s: StockPurchase) => <span className="font-mono">{s.quantity}</span> },
    { key: "purchase_price", header: "Cost", cell: (s: StockPurchase) => <span className="font-mono">{formatCurrency(s.purchase_price)}</span> },
    { key: "sale_price", header: "Sale Price", cell: (s: StockPurchase) => <span className="font-mono text-accent">{formatCurrency(s.sale_price)}</span> },
    { key: "total_value", header: "Total", cell: (s: StockPurchase) => <span className="font-mono font-medium">{formatCurrency(s.total_value)}</span> },
    { key: "expiry", header: "Expiry", cell: (s: StockPurchase) => <span className="font-mono text-xs text-text-secondary">{s.expiry ? formatDate(s.expiry) : "\u2014"}</span> },
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
      <div className="rounded-xl border border-border overflow-x-auto">
        <DataTable columns={columns} data={stockEntries} loading={isLoading} keyExtractor={(s: StockPurchase) => s.id} />
      </div>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditingId(null); } setOpen(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Stock Purchase" : "Record Stock Purchase"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Product</Label>
                <SearchableSelect
                  options={products.map((p: Product) => ({ value: p.id, label: `${p.name} (${p.barcode})` }))}
                  value={form.productId}
                  onChange={handleProductChange}
                  placeholder="Select product"
                  disabled={!!editingId}
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Company</Label>
                <SearchableSelect
                  options={companies.map((c: Company) => ({ value: c.id, label: c.name }))}
                  value={form.companyId}
                  onChange={(v) => setForm({ ...form, companyId: v })}
                  placeholder="Select company"
                />
              </div>
              <div>
                <Label>Distributor</Label>
                <SearchableSelect
                  options={distributors.map((d: Distributor) => ({ value: d.id, label: d.name }))}
                  value={form.distributorId}
                  onChange={(v) => setForm({ ...form, distributorId: v })}
                  placeholder="Select distributor"
                />
              </div>
            </div>
            <div>
              <Label>Invoice Number</Label>
              <Input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="e.g. INV-001" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div>
                <Label>Sale Price (per unit)</Label>
                <Input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Purchase Price (per unit)</Label>
                <Input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
              </div>
            </div>
            {form.quantity && form.purchasePrice && (
              <div className="text-sm text-text-secondary flex items-center gap-2">
                <span>Total Amount:</span>
                <span className="font-mono font-medium text-accent">{formatCurrency(autoTotal)}</span>
              </div>
            )}
            <div>
              <Label>Expiry (optional)</Label>
              <Input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} min={new Date().toISOString().split("T")[0]} />
            </div>
            <Button className="w-full" disabled={!form.productId || !form.quantity || createMutation.isPending || updateMutation.isPending}
              onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}>
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingId ? "Update Purchase" : "Record Purchase"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
