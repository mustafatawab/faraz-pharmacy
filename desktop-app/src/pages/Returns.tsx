import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, Printer, AlertCircle, Download } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { api } from "@/lib/api";
import { downloadCSV, downloadPDF } from "@/lib/export";
import type { ReturnEntry, Sale, SaleItem } from "@/types";

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function Returns() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [printerConfig, setPrinterConfig] = useState<{ paperSize: string; deviceName: string | null }>({ paperSize: "thermal", deviceName: null });
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedSaleId, setSelectedSaleId] = useState("");
  const [reason, setReason] = useState("");
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (window.electronAPI?.printers) {
      window.electronAPI.printers.getConfig().then(setPrinterConfig);
    }
  }, []);

  const { data: returns = [], isLoading } = useQuery({ queryKey: ["returns"], queryFn: api.returns.list });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales-by-date", selectedDate],
    queryFn: () => api.sales.listByDate(selectedDate),
    enabled: open,
  });

  const { data: selectedSale, isLoading: loadingSale } = useQuery({
    queryKey: ["sale", selectedSaleId],
    queryFn: () => api.sales.getById(selectedSaleId),
    enabled: !!selectedSaleId,
  });

  const filtered = returns.filter((r: ReturnEntry) =>
    !search || r.sale_id.includes(search) || r.reason.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSale?.items) throw new Error("Sale items not loaded");
      const saleItems = selectedSale.items;
      const items = Object.entries(returnQtys)
        .filter(([_, qty]) => qty > 0)
        .map(([productId, quantity]) => {
          const item = saleItems.find((i: SaleItem) => i.product_id === productId);
          return { productId, productName: item?.product_name || "", quantity, refundAmount: (item?.unit_price || 0) * quantity };
        });
      return api.returns.create({
        saleId: selectedSaleId,
        refundAmount: items.reduce((s, i) => s + i.refundAmount, 0),
        reason,
        items,
      });
    },
    onSuccess: async (returnData) => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["sales-by-date"] });

      if (window.printReturnReceipt && selectedSale) {
        const printPayload = {
          ...returnData,
          items: Object.entries(returnQtys)
            .filter(([_, qty]) => qty > 0)
            .map(([productId, quantity]) => {
              const item = selectedSale.items?.find((i: SaleItem) => i.product_id === productId);
              return { product_name: item?.product_name || "", quantity, refund_amount: (item?.unit_price || 0) * quantity };
            }),
          reason,
        };
        const printResult = await window.printReturnReceipt(printPayload, selectedSale, printerConfig);
        if (!printResult.success) {
          setError(printResult.error || "Print failed");
        }
      }

      setOpen(false);
      setSelectedSaleId("");
      setReason("");
      setReturnQtys({});
      setError("");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to process return");
    },
  });

  const columns = [
    { key: "created_at", header: "Date", cell: (r: ReturnEntry) => <span className="font-mono text-xs text-text-secondary">{formatDateTime(r.created_at)}</span> },
    { key: "sale_id", header: "Sale ID", cell: (r: ReturnEntry) => <span className="font-mono text-xs text-text-secondary">{r.sale_id.slice(0, 8)}</span> },
    { key: "refund_amount", header: "Refund Amount", cell: (r: ReturnEntry) => <span className="font-mono font-medium text-danger">{formatCurrency(r.refund_amount)}</span> },
    { key: "reason", header: "Reason", cell: (r: ReturnEntry) => <span className="text-text-secondary">{r.reason}</span> },
  ];

  return (
    <div>
      <PageHeader title="Returns" description="Process and track product returns" action={{ label: "New Return", onClick: () => setOpen(true) }} />
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <Input placeholder="Search returns..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadCSV(`returns_${new Date().toISOString().split("T")[0]}.csv`, ["Date","Sale ID","Refund Amount","Reason"], filtered.map((r: ReturnEntry) => [r.created_at, r.sale_id, r.refund_amount, r.reason]))}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadPDF(`returns_${new Date().toISOString().split("T")[0]}.pdf`, "Returns List", ["Date","Sale ID","Refund Amount","Reason"], filtered.map((r: ReturnEntry) => [r.created_at, r.sale_id, r.refund_amount, r.reason]))}>
          <Download className="h-4 w-4 mr-1" /> PDF
        </Button>
      </div>
      <div className="rounded-xl border border-border">
        <DataTable columns={columns} data={filtered} loading={isLoading} keyExtractor={(r: ReturnEntry) => r.id} />
      </div>

      <Dialog open={open} onOpenChange={(v) => {
        if (!v) {
          setSelectedSaleId("");
          setReason("");
          setReturnQtys({});
          setError("");
        }
        setOpen(v);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Return</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Date</Label>
              <Input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedSaleId(""); setReturnQtys({}); }} />
            </div>

            <div>
              <Label>Sale Invoice</Label>
              <Select value={selectedSaleId} onValueChange={(v) => { setSelectedSaleId(v); setReturnQtys({}); setError(""); }}>
                <SelectTrigger><SelectValue placeholder={sales.length === 0 ? "No sales for this date" : "Select invoice"} /></SelectTrigger>
                <SelectContent>
                  {sales.map((s: Sale) => {
                    const isReturned = (s.return_count ?? 0) > 0;
                    return (
                      <SelectItem key={s.id} value={s.id} disabled={isReturned}>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs">{s.id.slice(0, 8)}</span>
                          <span>{formatCurrency(s.total)}</span>
                          <span className="text-text-secondary text-xs">({s.customer_name || "Walk-in"})</span>
                          {isReturned && <span className="text-xs text-danger ml-1">[Returned]</span>}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedSale && (selectedSale.return_count ?? 0) > 0 && (
                <p className="text-xs text-danger mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> This sale has already been returned
                </p>
              )}
            </div>

            {loadingSale && (
              <div className="flex items-center justify-center py-8">
                <Skeleton className="h-20 w-full" />
              </div>
            )}

            {selectedSale && selectedSale.items && selectedSale.items.length > 0 && (selectedSale.return_count ?? 0) === 0 && (
              <div>
                <Label className="mb-2 block">Items to Return</Label>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-border rounded-lg p-3">
                  {selectedSale.items.map((item: SaleItem) => {
                    const qty = returnQtys[item.product_id] || 0;
                    const showDelete = qty > 0;
                    return (
                      <div key={item.product_id} className="flex items-center gap-2">
                        <span className="flex-1 text-sm truncate">{item.product_name}</span>
                        <span className="text-xs text-text-secondary font-mono">{formatCurrency(item.unit_price)} ×</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setReturnQtys(prev => ({ ...prev, [item.product_id]: Math.max(0, (prev[item.product_id] || 0) - 1) }))}
                            className="h-7 w-7 rounded-md bg-surface-2 flex items-center justify-center hover:bg-border"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-mono">{qty}</span>
                          <button
                            onClick={() => setReturnQtys(prev => ({ ...prev, [item.product_id]: Math.min(item.quantity, (prev[item.product_id] || 0) + 1) }))}
                            className="h-7 w-7 rounded-md bg-surface-2 flex items-center justify-center hover:bg-border"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          {showDelete && (
                            <button
                              onClick={() => {
                                const next = { ...returnQtys };
                                delete next[item.product_id];
                                setReturnQtys(next);
                              }}
                              className="h-7 w-7 rounded-md bg-danger/10 flex items-center justify-center hover:bg-danger/20 ml-1"
                            >
                              <Trash2 className="h-3 w-3 text-danger" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedSale && (!selectedSale.items || selectedSale.items.length === 0) && (
              <p className="text-sm text-text-secondary text-center py-4">No items found for this sale.</p>
            )}

            {selectedSale && (selectedSale.return_count ?? 0) === 0 && (
              <>
                <div>
                  <Label>Reason</Label>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Damaged, Expired, Wrong item" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Total Refund:</span>
                  <span className="font-mono font-bold text-danger">
                    {formatCurrency(Object.entries(returnQtys).reduce((s, [id, qty]) => {
                      const item = selectedSale?.items?.find((i: SaleItem) => i.product_id === id);
                      return s + (item?.unit_price || 0) * qty;
                    }, 0))}
                  </span>
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-danger flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}

            <Button
              className="w-full"
              disabled={!selectedSaleId || !reason || Object.values(returnQtys).every(q => q === 0) || (selectedSale?.return_count ?? 0) > 0}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Processing..." : "Process Return"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
