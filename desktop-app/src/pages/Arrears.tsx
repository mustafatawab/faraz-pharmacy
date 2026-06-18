import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Plus, Trash2, CheckCircle, Lock } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Arrear, Customer } from "@/types";

async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const res = await api.auth.verifyPassword(password);
    return res.valid;
  } catch {
    return false;
  }
}

export default function Arrears() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerId: "", totalBill: "", amountPaid: "" });
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; action: "pay" | "settle" | "delete"; targetId: string; payAmount?: number }>({ open: false, action: "pay", targetId: "" });
  const [adminPassword, setAdminPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { data: arrears = [], isLoading } = useQuery({
    queryKey: ["arrears", filter],
    queryFn: () => api.arrears.list(filter === "all" ? undefined : filter),
  });

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: api.customers.list });

  const recordPayment = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => api.arrears.recordPayment(id, amount),
    onSuccess: () => {
      toast.success("Payment recorded");
      queryClient.invalidateQueries({ queryKey: ["arrears"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setPayingId(null);
      setPaymentAmount("");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.arrears.create({
      customerId: form.customerId,
      totalBill: Number(form.totalBill),
      amountPaid: form.amountPaid ? Number(form.amountPaid) : 0,
    }),
    onSuccess: () => {
      toast.success("Arrear added");
      queryClient.invalidateQueries({ queryKey: ["arrears"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      setForm({ customerId: "", totalBill: "", amountPaid: "" });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.arrears.delete(id),
    onSuccess: () => {
      toast.success("Arrear deleted");
      queryClient.invalidateQueries({ queryKey: ["arrears"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const settleMutation = useMutation({
    mutationFn: (id: string) => api.arrears.settle(id),
    onSuccess: () => {
      toast.success("Arrear settled");
      queryClient.invalidateQueries({ queryKey: ["arrears"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  async function handleAdminAction(action: "pay" | "settle" | "delete") {
    setPasswordError("");
    const ok = await verifyAdminPassword(adminPassword);
    if (!ok) {
      setPasswordError("Incorrect admin password");
      return;
    }
    const { targetId, payAmount } = passwordDialog;
    if (action === "pay" && payAmount) {
      recordPayment.mutate({ id: targetId, amount: payAmount });
    } else if (action === "settle") {
      settleMutation.mutate(targetId);
    } else if (action === "delete") {
      deleteMutation.mutate(targetId);
    }
    setPasswordDialog({ open: false, action: "pay", targetId: "" });
    setAdminPassword("");
  }

  const totalOutstanding = arrears.filter((a: Arrear) => a.status === "pending").reduce((s: number, a: Arrear) => s + a.balance_due, 0);

  return (
    <div>
      <PageHeader title="Arrears" description="Track and manage outstanding payments" action={{ label: "Add Arrear", onClick: () => { setForm({ customerId: "", totalBill: "", amountPaid: "" }); setOpen(true); } }} />
      <div className="mb-6">
        <StatCard title="Total Outstanding" value={formatCurrency(totalOutstanding)} icon={<CreditCard className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="all" onValueChange={(v) => { setFilter(v); setPayingId(null); }}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="settled">Settled</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/50">
              <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Customer</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Date</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Total Bill</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Paid</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Balance Due</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-text-secondary uppercase">Status</th>
              <th className="text-center py-3 px-4 text-xs font-medium text-text-secondary uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan={7}><Skeleton className="h-10 w-full" /></td></tr>
              ))
            ) : arrears.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-sm text-text-secondary">No arrear records found.</td></tr>
            ) : (
              arrears.map((arrear: Arrear) => (
                <tr key={arrear.id} className="border-b border-border hover:bg-surface-2/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-text-primary">{arrear.customer_name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-text-secondary">{formatDateTime(arrear.created_at)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(arrear.total_bill)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(arrear.amount_paid)}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-warning">{formatCurrency(arrear.balance_due)}</td>
                  <td className="py-3 px-4 text-center"><StatusBadge status={arrear.status} /></td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      {arrear.status === "pending" && (
                        <>
                          {payingId === arrear.id ? (
                            <>
                              <Input type="number" placeholder="Amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="h-8 w-24 text-sm font-mono" autoFocus />
                              <Button size="sm" className="h-8" onClick={() => { setPasswordDialog({ open: true, action: "pay", targetId: arrear.id, payAmount: Number(paymentAmount) }); setAdminPassword(""); }} disabled={!paymentAmount}>Pay</Button>
                              <Button size="sm" variant="ghost" className="h-8" onClick={() => setPayingId(null)}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" className="h-8" onClick={() => setPayingId(arrear.id)}>Record Payment</Button>
                              <button onClick={() => { setPasswordDialog({ open: true, action: "settle", targetId: arrear.id }); setAdminPassword(""); }} className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-success hover:bg-success/5 transition-colors" title="Mark Settled">
                                <CheckCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                      <button onClick={() => { setPasswordDialog({ open: true, action: "delete", targetId: arrear.id }); setAdminPassword(""); }} className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-danger hover:bg-danger/5 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Arrear</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Customer</Label>
              <SearchableSelect
                options={customers.map((c: Customer) => ({ value: c.id, label: `${c.name} (${c.phone})` }))}
                value={form.customerId}
                onChange={(v) => setForm({ ...form, customerId: v })}
                placeholder="Select customer"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Total Bill</Label>
                <Input type="number" value={form.totalBill} onChange={(e) => setForm({ ...form, totalBill: e.target.value })} />
              </div>
              <div>
                <Label>Amount Paid (optional)</Label>
                <Input type="number" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
              </div>
            </div>
            <Button className="w-full" disabled={!form.customerId || !form.totalBill || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? "Adding..." : "Add Arrear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={passwordDialog.open} onOpenChange={(o) => setPasswordDialog({ ...passwordDialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Admin Password Required
            </DialogTitle>
            <DialogDescription>Enter your admin password to confirm this action.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
              />
            </div>
            {passwordError && <p className="text-sm text-danger">{passwordError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPasswordDialog({ open: false, action: "pay", targetId: "" })}>Cancel</Button>
              <Button onClick={() => handleAdminAction(passwordDialog.action)} disabled={!adminPassword}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
