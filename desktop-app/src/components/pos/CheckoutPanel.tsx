import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import CartItem from "@/components/pos/CartItem";
import { formatCurrency } from "@/lib/utils";
import type { SaleItemInput, DiscountType } from "@/types";

interface CheckoutPanelProps {
  items: SaleItemInput[];
  discount: number;
  discountValue: number;
  discountType: DiscountType;
  subtotal: number;
  total: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onDiscountChange: (discount: number) => void;
  onToggleDiscountType: () => void;
  onClearCart: () => void;
  onCheckout: (amountPaid: number, discount: number) => Promise<void>;
  error?: string;
}

export default function CheckoutPanel({
  items, discount, discountValue, discountType, subtotal, total,
  onUpdateQuantity, onRemoveItem, onDiscountChange, onToggleDiscountType,
  onClearCart, onCheckout, error,
}: CheckoutPanelProps) {
  const [amountPaid, setAmountPaid] = useState("");
  const [processing, setProcessing] = useState(false);

  const numPaid = Number(amountPaid) || 0;
  const change = Math.max(0, numPaid - total);

  async function handleCheckout() {
    if (items.length === 0 || numPaid < total) return;
    setProcessing(true);
    try {
      await onCheckout(numPaid, discount);
      onClearCart();
      setAmountPaid("");
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
          <Separator />
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
            <Button
              className="w-full h-12 text-base gap-2"
              disabled={items.length === 0 || numPaid < total || processing}
              onClick={handleCheckout}
            >
              {processing ? "Processing..." : `Pay ${formatCurrency(total)}`}
            </Button>
            {numPaid > 0 && numPaid < total && (
              <p className="text-xs text-center text-danger">Insufficient payment</p>
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
