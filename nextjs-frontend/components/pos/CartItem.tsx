"use client";

import { motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import type { SaleItem } from "@/types";

interface CartItemProps {
  item: SaleItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      transition={{ duration: 0.15 }}
      className="group flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-surface-2 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {item.productName}
        </p>
        <p className="text-xs text-text-secondary font-mono">{formatCurrency(item.unitPrice)} each</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-surface-2 transition-colors"
        >
          <Minus className="h-3 w-3 text-text-secondary" />
        </button>
        <span className="w-8 text-center text-sm font-mono font-medium text-text-primary">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-surface-2 transition-colors"
        >
          <Plus className="h-3 w-3 text-text-secondary" />
        </button>
      </div>

      <div className="w-20 text-right">
        <p className="text-sm font-mono font-medium text-text-primary">
          {formatCurrency(item.subtotal)}
        </p>
      </div>

      <button
        onClick={() => onRemove(item.productId)}
        className="h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-danger/10 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5 text-danger" />
      </button>
    </motion.div>
  );
}
