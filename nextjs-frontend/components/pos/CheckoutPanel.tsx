"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Lock, CheckCircle, TrendingDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "./CartItem";
import { formatCurrency } from "@/lib/formatters";
import { AnimatedNumber } from "./AnimatedNumber";
import type { SaleItem } from "@/types";

interface CheckoutPanelProps {
  items: SaleItem[];
  discount: number;
  subtotal: number;
  total: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onDiscountChange: (value: number) => void;
  onClearCart: () => void;
  onCheckout: (amountPaid: number, discount: number) => void;
}

export function CheckoutPanel({
  items,
  discount,
  subtotal,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onDiscountChange,
  onClearCart,
  onCheckout,
}: CheckoutPanelProps) {
  const [amountPaid, setAmountPaid] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const paid = parseFloat(amountPaid) || 0;
  const deficit = total - paid;
  const change = paid - total;
  const hasArrear = deficit > 0;
  const hasChange = change >= 0 && paid > 0;

  const handleCheckout = () => {
    onCheckout(paid, discount);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setAmountPaid("");
    }, 2000);
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full py-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mb-4"
        >
          <CheckCircle className="h-10 w-10 text-success" />
        </motion.div>
        <h3 className="text-xl font-semibold text-text-primary">Sale Complete!</h3>
        <p className="text-sm text-text-secondary mt-1">
          {formatCurrency(total)} — {formatCurrency(paid)} paid
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-text-secondary" />
          <h2 className="text-base font-semibold text-text-primary">Cart</h2>
          <span className="text-xs text-text-secondary bg-surface-2 px-2 py-0.5 rounded-full font-mono">
            {items.reduce((s, i) => s + i.quantity, 0)}
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-danger hover:text-danger/80 font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-surface-2 flex items-center justify-center mb-3">
                <ShoppingCart className="h-6 w-6 text-text-secondary" />
              </div>
              <p className="text-sm text-text-secondary">Cart is empty</p>
              <p className="text-xs text-text-secondary mt-1">Scan a product to start</p>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Totals */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Subtotal</span>
          <span className="font-mono font-medium text-text-primary">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-sm text-text-secondary">
            <TrendingDown className="h-3.5 w-3.5" />
            Discount
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-text-secondary">Rs.</span>
            <Input
              type="number"
              value={discount || ""}
              onChange={(e) => onDiscountChange(Math.max(0, parseFloat(e.target.value) || 0))}
              className="h-7 w-20 text-right font-mono text-sm"
              placeholder="0"
              min={0}
            />
          </div>
        </div>

        <Separator />

        <div className="flex justify-between text-base">
          <span className="font-semibold text-text-primary">Total</span>
          <span className="font-mono font-bold text-text-primary text-lg">
            {formatCurrency(total)}
          </span>
        </div>

        {/* Amount Paid */}
        <div className="space-y-2">
          <label className="text-sm text-text-secondary">Amount Paid</label>
          <Input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            placeholder="Enter amount"
            className="h-12 text-lg font-mono text-right"
            min={0}
          />
        </div>

        {/* Arrear / Change Indicator */}
        {paid > 0 && (
          <div className="flex items-center gap-2">
            {hasArrear ? (
              <div className="flex items-center gap-1.5 text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg w-full">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Arrear: <span className="font-mono font-semibold">{formatCurrency(deficit)}</span>
                </span>
              </div>
            ) : hasChange ? (
              <div className="flex items-center gap-1.5 text-sm text-success bg-success/10 px-3 py-2 rounded-lg w-full">
                <CheckCircle className="h-4 w-4" />
                <span>
                  Change: <span className="font-mono font-semibold">{formatCurrency(change)}</span>
                </span>
              </div>
            ) : null}
          </div>
        )}

        {/* Checkout Button */}
        <Button
          size="xl"
          className="w-full"
          disabled={items.length === 0 || paid <= 0}
          onClick={handleCheckout}
        >
          <Lock className="h-4 w-4 mr-2" />
          {items.length === 0
            ? "Cart Empty"
            : paid <= 0
            ? "Enter Amount Paid"
            : `Complete Sale — ${formatCurrency(total)}`}
        </Button>
      </div>
    </div>
  );
}
