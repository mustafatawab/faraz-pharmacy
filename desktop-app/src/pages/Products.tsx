import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Archive, RotateCcw, Pencil, Download, Upload, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, generateBarcode } from "@/lib/utils";
import { api } from "@/lib/api";
import { downloadCSV, downloadPDF } from "@/lib/export";
import type { Product, ProductPriceInput } from "@/types";
import { PRODUCT_CATEGORIES } from "@/types";

interface CsvRow {
  rowNum: number; barcode: string; name: string; category: string; location: string;
  purchasePrice: string; salePrice: string; expiry: string; error?: string;
}

const HEADER_LOOKUP: Record<string, string> = {
  "barcode": "barcode", "bar code": "barcode", "code": "barcode", "baar code": "barcode", "baarcode": "barcode",
  "name": "name", "product name": "name", "medicine": "name", "medicine name": "name", "item": "name", "item name": "name",
  "purchased price": "purchasePrice", "purchasedprice": "purchasePrice", "purchase price": "purchasePrice",
  "purchaseprice": "purchasePrice", "price": "purchasePrice", "purchase": "purchasePrice",
  "sale price": "salePrice", "saleprice": "salePrice", "selling price": "salePrice", "retail price": "salePrice", "retail": "salePrice",
  "category": "category", "location": "location",
  "expiry date": "expiry", "expiry time": "expiry", "expiry": "expiry",
};

interface PriceTierForm {
  label: string; purchasePrice: string; salePrice: string;
}

interface ProductForm {
  barcode: string; name: string; category: string; location: string;
  purchasePrice: string; salePrice: string; expiry: string;
  prices: PriceTierForm[];
}

const emptyPriceTier = (): PriceTierForm => ({
  label: "", purchasePrice: "", salePrice: "",
});

const emptyForm = (): ProductForm => ({
  barcode: generateBarcode(), name: "", category: "", location: "",
  purchasePrice: "", salePrice: "", expiry: "",
  prices: [],
});

export default function Products() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [barcodeExists, setBarcodeExists] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<CsvRow[]>([]);
  const [importImporting, setImportImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", showArchived],
    queryFn: () => showArchived ? api.products.listAll() : api.products.list(),
  });

  useEffect(() => {
    if (open && barcodeInputRef.current) {
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [open]);

  async function checkBarcode(barcode: string) {
    if (!barcode.trim()) { setBarcodeExists(null); return; }
    try {
      const existing = await api.products.getByBarcode(barcode.trim());
      if (existing && existing.id !== editingId) {
        setBarcodeExists(`Barcode already in use by "${existing.name}"`);
      } else {
        setBarcodeExists(null);
      }
    } catch {
      setBarcodeExists(null);
    }
  }

  const filtered = products.filter((p: Product) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search) || p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  function buildPricesPayload(): ProductPriceInput[] | undefined {
    const validPrices = form.prices.filter((p) => p.purchasePrice);
    if (validPrices.length === 0) return undefined;
    return validPrices.map((p) => ({
      label: p.label || undefined,
      purchasePrice: Number(p.purchasePrice),
      salePrice: Number(p.salePrice) || 0,
    }));
  }

  const createMutation = useMutation({
    mutationFn: () => api.products.create({
      barcode: form.barcode, name: form.name, category: form.category,
      location: form.location, purchasePrice: Number(form.purchasePrice),
      salePrice: Number(form.salePrice) || 0,
      expiry: form.expiry || undefined,
      prices: buildPricesPayload(),
    }),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setAddedId(product.id);
      setOpen(false);
      toast.success("Product created");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => api.products.update(editingId!, {
      barcode: form.barcode, name: form.name, category: form.category,
      location: form.location, purchasePrice: Number(form.purchasePrice),
      salePrice: Number(form.salePrice) || 0,
      expiry: form.expiry || undefined,
      prices: buildPricesPayload(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setEditingId(null);
      toast.success("Product updated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.products.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product archived");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.products.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product restored");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setBarcodeExists(null);
    setOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    const p = (product as any).prices as { label: string; purchasePrice: number; salePrice: number }[] | undefined;
    setForm({
      barcode: product.barcode, name: product.name, category: product.category,
      location: product.location, purchasePrice: String(product.purchase_price),
      salePrice: String(product.sale_price),
      expiry: product.expiry || "",
      prices: p
        ? p.map((pt) => ({ label: pt.label, purchasePrice: String(pt.purchasePrice), salePrice: String(pt.salePrice) }))
        : [],
    });
    setBarcodeExists(null);
    setOpen(true);
  }

  function addPriceTier() {
    setForm((prev) => ({ ...prev, prices: [...prev.prices, emptyPriceTier()] }));
  }

  function removePriceTier(index: number) {
    setForm((prev) => ({ ...prev, prices: prev.prices.filter((_, i) => i !== index) }));
  }

  function updatePriceTier(index: number, field: keyof PriceTierForm, value: string) {
    setForm((prev) => ({
      ...prev,
      prices: prev.prices.map((pt, i) => (i === index ? { ...pt, [field]: value } : pt)),
    }));
  }

  function normalizeHeader(h: string) {
    return h.trim().replace(/^\uFEFF/, "").toLowerCase().replace(/\s+/g, " ");
  }

  function matchHeader(header: string): string | null {
    return HEADER_LOOKUP[normalizeHeader(header)] || null;
  }

  function parseCsvContent(text: string): { errors: string[]; rows: CsvRow[] } {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return { errors: ["CSV must have a header row and at least one data row"], rows: [] };

    const rawHeaders = parseCsvLine(lines[0]);
    const headerMap = new Map<number, string>();
    const unmatchedHeaders: string[] = [];

    for (let i = 0; i < rawHeaders.length; i++) {
      const matched = matchHeader(rawHeaders[i]);
      if (matched) {
        headerMap.set(i, matched);
      } else {
        unmatchedHeaders.push(normalizeHeader(rawHeaders[i]));
      }
    }

    if (!hasHeader(headerMap, "barcode")) return { errors: ["Missing required column: barcode (or bar code, code)"], rows: [] };
    if (!hasHeader(headerMap, "name")) return { errors: ["Missing required column: name (or product name, medicine, item)"], rows: [] };
    if (!hasHeader(headerMap, "purchasePrice")) return { errors: ["Missing required column: purchase price (or price, purchase)"], rows: [] };

    const errors: string[] = [];
    if (unmatchedHeaders.length > 0) {
      errors.push(`Unrecognized columns ignored: ${unmatchedHeaders.join(", ")}`);
    }

    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const row: CsvRow = {
        rowNum: i + 1,
        barcode: cols[findIndex(headerMap, "barcode")]?.trim() || "",
        name: cols[findIndex(headerMap, "name")]?.trim() || "",
        purchasePrice: cols[findIndex(headerMap, "purchasePrice")]?.trim() || "",
        salePrice: hasHeader(headerMap, "salePrice") ? cols[findIndex(headerMap, "salePrice")]?.trim() || "" : "",
        category: hasHeader(headerMap, "category") ? cols[findIndex(headerMap, "category")]?.trim() || "" : "",
        location: hasHeader(headerMap, "location") ? cols[findIndex(headerMap, "location")]?.trim() || "" : "",
        expiry: hasHeader(headerMap, "expiry") ? cols[findIndex(headerMap, "expiry")]?.trim() || "" : "",
      };
      const rowErrors: string[] = [];
      if (!row.barcode) rowErrors.push("Missing barcode");
      if (!row.name) rowErrors.push("Missing name");
      if (!row.purchasePrice) rowErrors.push("Missing purchase price");
      else if (isNaN(Number(row.purchasePrice)) || Number(row.purchasePrice) < 0) rowErrors.push("Invalid purchase price");
      if (rowErrors.length > 0) row.error = rowErrors.join("; ");
      rows.push(row);
    }
    return { errors, rows };
  }

  function findIndex(map: Map<number, string>, key: string): number {
    for (const [idx, val] of map) {
      if (val === key) return idx;
    }
    return -1;
  }

  function hasHeader(map: Map<number, string>, key: string): boolean {
    return findIndex(map, key) !== -1;
  }

  function processFile(file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string).replace(/^\uFEFF/, "");
      const result = parseCsvContent(text);
      if (result.errors.length > 0 && result.rows.length === 0) {
        toast.error(result.errors.join(". "));
        return;
      }
      setImportRows(result.rows);
      setImportOpen(true);
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please drop a .csv file");
      return;
    }
    processFile(file);
  }

  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ",") { result.push(current); current = ""; }
        else { current += ch; }
      }
    }
    result.push(current);
    return result;
  }

  function downloadSampleCsv() {
    const sample = `Barcode,Product Name,Purchase Price,Sale Price,Category,Location,Expiry
123456,Panadol 500mg,80,100,Tablets,Shelf A1,2027-12-31
123457,Brufen 400mg,120,150,Capsules,Shelf B2,2028-06-15
123458,Augmentin 1g,250,300,Tablets,Shelf A3,2027-09-01`;
    const blob = new Blob(["\uFEFF" + sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_import.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    setImportImporting(true);
    let success = 0;
    let failed = 0;
    const failDetails: string[] = [];
    for (const row of importRows) {
      if (row.error) {
        failed++;
        failDetails.push(`Row ${row.rowNum}: ${row.error}`);
        continue;
      }
      try {
        await api.products.create({
          barcode: row.barcode,
          name: row.name,
          category: row.category || undefined,
          location: row.location || undefined,
          purchasePrice: Number(row.purchasePrice),
          salePrice: Number(row.salePrice) || 0,
          expiry: row.expiry || undefined,
        });
        success++;
      } catch (err) {
        failed++;
        failDetails.push(`Row ${row.rowNum}: ${err instanceof Error ? err.message : "API error"}`);
      }
    }
    setImportImporting(false);
    setImportOpen(false);
    setImportRows([]);
    queryClient.invalidateQueries({ queryKey: ["products"] });
    if (failed === 0) {
      toast.success(`${success} products imported successfully`);
    } else {
      toast.error(`${success} imported, ${failed} failed\n${failDetails.slice(0, 5).join("\n")}${failDetails.length > 5 ? `\n...and ${failDetails.length - 5} more` : ""}`);
    }
  }

  const columns = [
    { key: "barcode", header: "Barcode", cell: (p: Product) => <span className="font-mono text-[11px] text-text-secondary">{p.barcode}</span> },
    { key: "name", header: "Name", cell: (p: Product) => (
      <span className={`text-xs ${p.active ? "font-medium text-text-primary" : "text-text-secondary line-through"}`}>{p.name}</span>
    ) },
    { key: "category", header: "Category", cell: (p: Product) => (
      <span className="text-[10px] text-text-secondary bg-surface-2 px-1.5 py-0.5 rounded">{p.category || "\u2014"}</span>
    ) },
    { key: "location", header: "Location", cell: (p: Product) => <span className="text-[11px] font-mono text-text-secondary">{p.location || "\u2014"}</span> },
    { key: "salePrice", header: "Sale Price", cell: (p: Product) => <span className="font-mono text-xs font-semibold">{formatCurrency(p.sale_price)}</span> },
    { key: "stockQty", header: "Stock", cell: (p: Product) => (
      <span className={`font-mono text-xs font-semibold ${p.stock_qty <= 5 ? "text-danger" : p.active ? "text-text-primary" : "text-text-secondary"}`}>{p.stock_qty}</span>
    ) },
    { key: "status", header: "Status", cell: (p: Product) => {
      if (!p.active) return <StatusBadge status="inactive" />;
      const s = p.stock_qty <= 0 ? "inactive" : p.stock_qty <= 5 ? "low" : "active";
      return <StatusBadge status={s} />;
    } },
    {
      key: "actions", header: "", cell: (p: Product) => (
        <div className="flex items-center gap-0.5 justify-end">
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
        <div className="mb-4 p-3 rounded-lg border border-success/20 bg-success/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <p className="text-xs text-text-primary font-medium">Product added successfully</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setAddedId(null); openAdd(); }}>Add Another</Button>
            <Button size="sm" onClick={() => setAddedId(null)}>Done</Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Button variant="outline" size="sm" className={showArchived ? "border-accent text-accent" : ""} onClick={() => setShowArchived(!showArchived)}>
            <Archive className="h-3.5 w-3.5 mr-1" />
            Archived
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadCSV(`products_${new Date().toISOString().split("T")[0]}.csv`, ["Barcode","Name","Company","Category","Location","Sale Price","Purchase Price","Stock","Expiry","Status"], filtered.map((p: Product) => [p.barcode, p.name, p.company, p.category, p.location, p.sale_price, p.purchase_price, p.stock_qty, p.expiry||"", p.active?"Active":"Archived"]))}>
            <Download className="h-3.5 w-3.5 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadPDF(`products_${new Date().toISOString().split("T")[0]}.pdf`, "Products List", ["Barcode","Name","Company","Category","Location","Sale Price","Purchase Price","Stock","Expiry","Status"], filtered.map((p: Product) => [p.barcode, p.name, p.company, p.category, p.location, p.sale_price, p.purchase_price, p.stock_qty, p.expiry||"", p.active?"Active":"Archived"]))}>
            <Download className="h-3.5 w-3.5 mr-1" /> PDF
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          <Button variant="primary" size="sm" onClick={() => { setImportOpen(true); setImportRows([]); }}>
            <Upload className="h-3.5 w-3.5 mr-1" /> Import CSV
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <DataTable columns={columns} data={filtered} loading={isLoading} keyExtractor={(p: Product) => p.id} />
      </div>

      <Dialog open={importOpen} onOpenChange={(v) => { if (!v) { setImportRows([]); } setImportOpen(v); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
          </DialogHeader>
          {importRows.length === 0 ? (
            <div className="px-5 pb-5">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:border-accent/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-text-secondary" />
                <div>
                  <p className="text-xs font-medium text-text-primary">Drag & drop your CSV file here</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">or click to browse files</p>
                </div>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); downloadSampleCsv(); }}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Download Sample
                </Button>
                <p className="text-[10px] text-text-secondary/60">Supports: barcode, name, purchase price, sale price, category, location, expiry</p>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">
                  {importRows.length} product(s) found
                </p>
                <Button variant="ghost" size="sm" onClick={() => { setImportRows([]); }}>
                  Choose different file
                </Button>
              </div>
              {importRows.some((r) => r.error) && (
                <div className="p-2.5 rounded-lg bg-danger/5 border border-danger/20 text-[11px] text-danger">
                  {importRows.filter((r) => r.error).length} row(s) have errors and will be skipped
                </div>
              )}
              <div className="max-h-60 overflow-y-auto rounded-lg border border-border text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-2">
                      <th className="text-left p-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider">#</th>
                      <th className="text-left p-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider">Barcode</th>
                      <th className="text-left p-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider">Name</th>
                      <th className="text-left p-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider">Purchase</th>
                      <th className="text-left p-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider">Sale</th>
                      <th className="text-left p-2 font-medium text-text-secondary text-[10px] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 50).map((row, i) => (
                      <tr key={i} className={`border-t border-border ${row.error ? "bg-danger/5" : ""}`}>
                        <td className="p-2 text-text-secondary">{row.rowNum}</td>
                        <td className="p-2 font-mono text-text-primary">{row.barcode}</td>
                        <td className="p-2 text-text-primary font-medium">{row.name}</td>
                        <td className="p-2 text-text-secondary">{row.purchasePrice}</td>
                        <td className="p-2 text-text-secondary">{row.salePrice || "\u2014"}</td>
                        <td className="p-2">
                          {row.error ? (
                            <span className="text-danger text-[10px]" title={row.error}>Error</span>
                          ) : (
                            <span className="text-success text-[10px]">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importRows.length > 50 && (
                  <p className="text-center text-text-secondary p-2 text-[10px]">...and {importRows.length - 50} more</p>
                )}
              </div>
              <Button className="w-full" disabled={importImporting || importRows.length === 0} onClick={handleImport}>
                {importImporting
                  ? `Importing ${importRows.length} products...`
                  : `Import ${importRows.filter((r) => !r.error).length} Valid Product${importRows.filter((r) => !r.error).length !== 1 ? "s" : ""}`
                }
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditingId(null); } setOpen(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="px-5 pb-5 space-y-3 max-h-[65vh] overflow-y-auto">
            <div className="space-y-1">
              <Label>Barcode</Label>
              <Input
                ref={barcodeInputRef}
                value={form.barcode}
                onChange={(e) => { setForm({ ...form, barcode: e.target.value }); checkBarcode(e.target.value); }}
                className="font-mono"
              />
              {barcodeExists && (
                <p className="text-[11px] text-danger mt-0.5">{barcodeExists}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
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
              <div className="space-y-1">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Shelf A1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Purchase Price</Label>
                <Input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Sale Price</Label>
                <Input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
              </div>
            </div>

            <div className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Additional Price Tiers</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPriceTier} className="h-7 gap-1">
                  <Plus className="h-3 w-3" /> Add Tier
                </Button>
              </div>
              {form.prices.length === 0 && (
                <p className="text-[11px] text-text-secondary">No additional prices.</p>
              )}
              {form.prices.map((pt, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-surface-2">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] text-text-secondary">Label</Label>
                      <Input
                        value={pt.label}
                        onChange={(e) => updatePriceTier(i, "label", e.target.value)}
                        placeholder="e.g. Wholesale"
                        className="h-7 text-[11px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-text-secondary">Purchase</Label>
                      <Input
                        type="number"
                        value={pt.purchasePrice}
                        onChange={(e) => updatePriceTier(i, "purchasePrice", e.target.value)}
                        className="h-7 text-[11px]"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-text-secondary">Sale</Label>
                      <Input
                        type="number"
                        value={pt.salePrice}
                        onChange={(e) => updatePriceTier(i, "salePrice", e.target.value)}
                        className="h-7 text-[11px]"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removePriceTier(i)}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-danger hover:bg-danger/5 transition-colors mt-4 shrink-0"
                    title="Remove tier"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <Label>Expiry (optional)</Label>
              <Input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} min={new Date().toISOString().split("T")[0]} />
            </div>
            <Button className="w-full mt-1" disabled={!form.name || !form.purchasePrice || createMutation.isPending || updateMutation.isPending}
              onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}>
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingId ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
