import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShoppingCart, Trash2, UserPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CartItem from "@/components/pos/CartItem";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import type { SaleItemInput, DiscountType, Customer } from "@/types";

interface CheckoutPanelProps {
  items: SaleItemInput[];
  discount: number;
  discountValue: number;
  discountType: DiscountType;
  subtotal: number;
  total: number;
  customerId?: string;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onDiscountChange: (discount: number) => void;
  onToggleDiscountType: () => void;
  onClearCart: () => void;
  onCheckout: (amountPaid: number, discount: number) => Promise<void>;
  onCustomerChange: (customerId?: string, customerName?: string) => void;
  error?: string;
}

export default function CheckoutPanel({
  items, discount, discountValue, discountType, subtotal, total, customerId,
  onUpdateQuantity, onRemoveItem, onDiscountChange, onToggleDiscountType,
  onClearCart, onCheckout, onCustomerChange, error,
}: CheckoutPanelProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [quickAddress, setQuickAddress] = useState("");

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: api.customers.list,
  });

  const queryClient = useQueryClient();
  const quickAddMutation = useMutation({
    mutationFn: () => api.customers.create({ name: quickName, phone: quickPhone, address: quickAddress }),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onCustomerChange(customer.id, customer.name);
      setQuickAddOpen(false);
      setQuickName("");
      setQuickPhone("");
      setQuickAddress("");
    },
  });
  const [amountPaid, setAmountPaid] = useState("");
  const [processing, setProcessing] = useState(false);
  const [addToArrears, setAddToArrears] = useState(false);

  const numPaid = Number(amountPaid) || 0;
  const change = Math.max(0, numPaid - total);
  const isPartial = numPaid > 0 && numPaid < total;
  const canPay = items.length > 0 && (numPaid >= total || (isPartial && !!customerId && addToArrears));

  async function handleCheckout() {
    if (!canPay) return;
    setProcessing(true);
    try {
      await onCheckout(numPaid, discount);
      onClearCart();
      setAmountPaid("");
      setAddToArrears(false);
    } catch {
      console.error("Checkout failed");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-accent" />
          Cart
        </h2>
        {items.length > 0 && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-text-secondary hover:text-danger" onClick={onClearCart}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 -mx-5 px-5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-sm text-text-secondary py-12">
            <ShoppingCart className="h-12 w-12 text-border mb-3" />
            <p>Cart is empty</p>
            <p className="text-xs mt-1">Scan or search products to add</p>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <CartItem key={item.productId} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemoveItem} />
            ))}
          </div>
        )}
      </ScrollArea>

      {items.length > 0 && (
        <div className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchableSelect
                options={customers.map((c: Customer) => ({ value: c.id, label: `${c.name}${c.phone ? ` (${c.phone})` : ""}` }))}
                value={customerId || ""}
                onChange={(v) => {
                  const selected = customers.find((c: Customer) => c.id === v);
                  onCustomerChange(v || undefined, selected?.name);
                }}
                placeholder="Customer (optional)"
                className="h-8 text-xs"
              />
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setQuickAddOpen(true)} title="Quick add customer">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <Separator />

          <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Quick Add Customer</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input value={quickName} onChange={(e) => setQuickName(e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={quickAddress} onChange={(e) => setQuickAddress(e.target.value)} />
                </div>
                <Button className="w-full" disabled={!quickName || quickAddMutation.isPending} onClick={() => quickAddMutation.mutate()}>
                  {quickAddMutation.isPending ? "Adding..." : "Add Customer & Select"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleDiscountType}
                className="h-7 px-2 rounded-md text-xs font-medium border border-border bg-surface-2 hover:bg-border transition-colors shrink-0"
              >
                {discountType === "pkr" ? "PKR" : "%"}
              </button>
              <Input
                type="number"
                placeholder={`Discount (${discountType === "pkr" ? "PKR" : "%"})`}
                value={discountValue || ""}
                onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
                className="h-8 text-sm font-mono"
              />
            </div>
            {discountValue > 0 && discountType === "percent" && (
              <p className="text-xs text-text-secondary text-right mt-1">
                = {formatCurrency(discount)}
              </p>
            )}
            {discountValue > 0 && discountType === "pkr" && subtotal > 0 && (
              <p className="text-xs text-text-secondary text-right mt-1">
                = {Math.round(discountValue * 100 / subtotal)}%
              </p>
            )}
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span className="font-mono">-{formatCurrency(discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-bold text-text-primary">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Amount paid"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="h-12 text-lg font-mono font-bold text-center"
            />
            {change > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm text-success font-medium"
              >
                Change: {formatCurrency(change)}
              </motion.div>
            )}
            {isPartial && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="add-to-arrears"
                  checked={addToArrears}
                  onCheckedChange={(val) => setAddToArrears(val === true)}
                />
                <Label htmlFor="add-to-arrears" className="text-xs cursor-pointer">
                  Add Remaining Amount in Arears
                </Label>
              </div>
            )}
            <Button
              className="w-full h-12 text-base gap-2"
              disabled={!canPay || processing}
              onClick={handleCheckout}
            >
              {processing ? "Processing..." : `Pay ${formatCurrency(total)}`}
            </Button>
            {isPartial && !customerId && (
              <p className="text-xs text-center text-danger">Select a customer for partial payment</p>
            )}
            {isPartial && !!customerId && !addToArrears && (
              <p className="text-xs text-center text-text-secondary">Check the box above to add remaining amount to arrears</p>
            )}
            {error && (
              <p className="text-xs text-center text-danger">{error}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
