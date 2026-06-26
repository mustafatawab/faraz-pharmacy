import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, Phone, MapPin, Pencil, Trash2, Download, Lock, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { downloadCSV, downloadPDF } from "@/lib/export";
import type { Customer } from "@/types";

export default function Customers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [forceDeleteOpen, setForceDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleteInfo, setDeleteInfo] = useState<{ salesCount: number; arrearsCount: number } | null>(null);
  const [adminPassword, setAdminPassword] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: api.customers.list,
  });

  const createMutation = useMutation({
    mutationFn: () => api.customers.create({ name, phone, address }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      setName("");
      setPhone("");
      setAddress("");
      toast.success("Customer created");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => api.customers.update(editingId!, { name, phone, address }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      setEditingId(null);
      setName("");
      setPhone("");
      setAddress("");
      toast.success("Customer updated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.customers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const forceDeleteMutation = useMutation({
    mutationFn: async () => {
      const pwResult = await api.auth.verifyPassword(adminPassword);
      if (!pwResult.valid) throw new Error("Incorrect admin password");
      return api.customers.delete(deleteTarget!.id, { force: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setForceDeleteOpen(false);
      setDeleteTarget(null);
      setDeleteInfo(null);
      setAdminPassword("");
      toast.success("Customer deleted");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleDeleteClick(c: Customer) {
    if ((c.total_purchases ?? 0) > 0 || (c.outstanding_arrear ?? 0) > 0) {
      setDeleteTarget(c);
      setDeleteInfo({ salesCount: c.total_purchases ?? 0, arrearsCount: c.outstanding_arrear ?? 0 });
      setAdminPassword("");
      setForceDeleteOpen(true);
    } else {
      if (confirm("Delete this customer?")) deleteMutation.mutate(c.id);
    }
  }

  const filtered = customers.filter((c: Customer) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  function openAdd() {
    setEditingId(null);
    setName("");
    setPhone("");
    setAddress("");
    setOpen(true);
  }

  function openEdit(c: Customer) {
    setEditingId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    setOpen(true);
  }

  const columns = [
    { key: "name", header: "Name", cell: (c: Customer) => <span className="font-medium text-text-primary">{c.name}</span> },
    { key: "phone", header: "Phone", cell: (c: Customer) => <span className="font-mono text-xs text-text-secondary">{c.phone}</span> },
    { key: "address", header: "Address", cell: (c: Customer) => <span className="text-xs text-text-secondary truncate max-w-[180px] inline-block">{c.address || "\u2014"}</span> },
    { key: "total_purchases", header: "Purchases", cell: (c: Customer) => <span className="font-mono font-medium">{c.total_purchases ?? 0}</span> },
    { key: "outstanding_arrear", header: "Arrear", cell: (c: Customer) => {
      const arrear = c.outstanding_arrear ?? 0;
      return (
        <span className={`font-mono font-medium ${arrear > 0 ? "text-warning" : "text-text-secondary"}`}>
          {arrear > 0 ? formatCurrency(arrear) : "—"}
        </span>
      );
    } },
    { key: "last_purchase", header: "Last Purchase", cell: (c: Customer) => (
      <span className="text-xs text-text-secondary">{c.last_purchase ? formatDate(c.last_purchase) : "—"}</span>
    ) },
    {
      key: "actions", header: "", cell: (c: Customer) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => openEdit(c)} className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => handleDeleteClick(c)} className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-danger hover:bg-danger/5 transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Customers" description="Manage your customer relationships" action={{ label: "Add Customer", onClick: openAdd }} />
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <Input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadCSV(`customers_${new Date().toISOString().split("T")[0]}.csv`, ["Name","Phone","Address","Purchases","Arrear","Last Purchase"], filtered.map((c: Customer) => [c.name, c.phone, c.address, c.total_purchases||0, c.outstanding_arrear||0, c.last_purchase||""]))}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadPDF(`customers_${new Date().toISOString().split("T")[0]}.pdf`, "Customers List", ["Name","Phone","Address","Purchases","Arrear","Last Purchase"], filtered.map((c: Customer) => [c.name, c.phone, c.address, c.total_purchases||0, c.outstanding_arrear||0, c.last_purchase||""]))}>
          <Download className="h-4 w-4 mr-1" /> PDF
        </Button>
      </div>
      <div className="rounded-xl border border-border">
        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          keyExtractor={(c: Customer) => c.id}
          onRowClick={(c: Customer) => navigate(`/customers/${c.id}`)}
        />
      </div>
      <Dialog open={forceDeleteOpen} onOpenChange={(v) => { if (!v) { setForceDeleteOpen(false); setDeleteTarget(null); setDeleteInfo(null); setAdminPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Force Delete Customer
            </DialogTitle>
            <DialogDescription>
              This customer has existing records. Deleting will permanently remove their data.
            </DialogDescription>
          </DialogHeader>
          {deleteInfo && (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-text-primary">{deleteTarget?.name}</p>
              <ul className="space-y-1 text-text-secondary">
                {deleteInfo.salesCount > 0 && <li>• {deleteInfo.salesCount} invoice(s) — customer reference will be removed</li>}
                {deleteInfo.arrearsCount > 0 && <li>• {deleteInfo.arrearsCount} arrear(s) — will be permanently deleted</li>}
              </ul>
              <div className="pt-2 space-y-2">
                <Label className="flex items-center gap-2"><Lock className="h-4 w-4" /> Enter admin password to confirm</Label>
                <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Admin password" />
              </div>
              <Button className="w-full mt-2" variant="destructive" disabled={!adminPassword || forceDeleteMutation.isPending}
                onClick={() => forceDeleteMutation.mutate()}>
                {forceDeleteMutation.isPending ? "Deleting..." : "Force Delete"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditingId(null); } setOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <Button className="w-full" disabled={!name || createMutation.isPending || updateMutation.isPending}
              onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}>
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingId ? "Update Customer" : "Add Customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
