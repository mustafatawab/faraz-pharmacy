import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Archive, RotateCcw, Pencil } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate, generateBarcode } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Product } from "@/types";
import { PRODUCT_CATEGORIES } from "@/types";

interface ProductForm {
  barcode: string; name: string; category: string; location: string;
  salePrice: string; purchasePrice: string; stockQty: string; expiry: string;
}

const emptyForm = (): ProductForm => ({
  barcode: generateBarcode(), name: "", category: "", location: "",
  salePrice: "", purchasePrice: "", stockQty: "0", expiry: "",
});

export default function Products() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", showArchived],
    queryFn: () => showArchived ? api.products.listAll() : api.products.list(),
  });

  const filtered = products.filter((p: Product) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search) || p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: () => api.products.create({
      barcode: form.barcode, name: form.name, category: form.category,
      location: form.location, salePrice: Number(form.salePrice),
      purchasePrice: Number(form.purchasePrice), stockQty: Number(form.stockQty),
      expiry: form.expiry || undefined,
    }),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setAddedId(product.id);
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => api.products.update(editingId!, {
      barcode: form.barcode, name: form.name, category: form.category,
      location: form.location, salePrice: Number(form.salePrice),
      purchasePrice: Number(form.purchasePrice), stockQty: Number(form.stockQty),
      expiry: form.expiry || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setEditingId(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.products.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.products.restore(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      barcode: product.barcode, name: product.name, category: product.category,
      location: product.location, salePrice: String(product.sale_price),
      purchasePrice: String(product.purchase_price), stockQty: String(product.stock_qty),
      expiry: product.expiry || "",
    });
    setOpen(true);
  }

  const columns = [
    { key: "barcode", header: "Barcode", cell: (p: Product) => <span className="font-mono text-xs text-text-secondary">{p.barcode}</span> },
    { key: "name", header: "Name", cell: (p: Product) => (
      <span className={`font-medium ${p.active ? "text-text-primary" : "text-text-secondary line-through"}`}>{p.name}</span>
    ) },
    { key: "category", header: "Category", cell: (p: Product) => <span className="text-xs text-text-secondary bg-surface-2 px-2 py-0.5 rounded-full">{p.category || "—"}</span> },
    { key: "location", header: "Location", cell: (p: Product) => <span className="text-xs font-mono text-text-secondary">{p.location || "—"}</span> },
    { key: "salePrice", header: "Sale Price", cell: (p: Product) => <span className="font-mono font-medium">{formatCurrency(p.sale_price)}</span> },
    { key: "stockQty", header: "Stock", cell: (p: Product) => (
      <span className={`font-mono font-medium ${p.stock_qty <= 5 ? "text-danger" : p.active ? "text-text-primary" : "text-text-secondary"}`}>{p.stock_qty}</span>
    ) },
    { key: "status", header: "Status", cell: (p: Product) => {
      if (!p.active) return <StatusBadge status="inactive" />;
      const s = p.stock_qty <= 0 ? "inactive" : p.stock_qty <= 5 ? "low" : "active";
      return <StatusBadge status={s} />;
    } },
    {
      key: "actions", header: "", cell: (p: Product) => (
        <div className="flex items-center gap-1 justify-end">
          {p.active ? (
            <>
              <button onClick={() => openEdit(p)} className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors" title="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => archiveMutation.mutate(p.id)} className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-warning hover:bg-warning/5 transition-colors" title="Archive">
                <Archive className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button onClick={() => restoreMutation.mutate(p.id)} className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-success hover:bg-success/5 transition-colors" title="Restore">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your pharmacy inventory"
        action={{ label: "Add Product", onClick: openAdd }}
      />

      {addedId && (
        <div className="mb-4 p-4 rounded-xl border border-success/20 bg-success/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-success" />
            <p className="text-sm text-text-primary">Product added successfully</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setAddedId(null); openAdd(); }}>Add Another</Button>
            <Button size="sm" onClick={() => setAddedId(null)}>Done</Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <Input placeholder="Search by name, barcode, category, or location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" className={showArchived ? "border-accent text-accent" : ""} onClick={() => setShowArchived(!showArchived)}>
          <Archive className="h-4 w-4 mr-1.5" />
          Archived
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <DataTable columns={columns} data={filtered} loading={isLoading} keyExtractor={(p: Product) => p.id} />
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditingId(null); } setOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Barcode</Label>
              <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="font-mono" />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Shelf A1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sale Price</Label>
                <Input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
              </div>
              <div>
                <Label>Purchase Price</Label>
                <Input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Stock Qty</Label>
                <Input type="number" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
              </div>
              <div>
                <Label>Expiry</Label>
                <Input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} />
              </div>
            </div>
            <Button className="w-full mt-2" disabled={!form.name || !form.salePrice || createMutation.isPending || updateMutation.isPending}
              onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}>
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingId ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
