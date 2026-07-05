import { Trash2, Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SaleItemInput } from "@/types";

interface CartItemProps {
  item: SaleItemInput;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="group flex items-center gap-2.5 py-2 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-primary truncate">{item.productName}</p>
        <p className="text-[10px] text-text-secondary">{formatCurrency(item.unitPrice)} each</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="h-6 w-6 rounded flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-2 disabled:opacity-30 transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-7 text-center text-xs font-semibold font-mono tabular-nums">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          className="h-6 w-6 rounded flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className="text-right min-w-[60px]">
        <p className="text-xs font-semibold font-mono tabular-nums">{formatCurrency(item.subtotal)}</p>
      </div>
      <button
        onClick={() => onRemove(item.productId)}
        className="h-6 w-6 rounded flex items-center justify-center text-text-secondary/40 hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
