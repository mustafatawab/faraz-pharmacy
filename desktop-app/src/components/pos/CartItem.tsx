import { Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SaleItemInput } from "@/types";

interface CartItemProps {
  item: SaleItemInput;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{item.productName}</p>
        <p className="text-xs text-text-secondary">{formatCurrency(item.unitPrice)} each</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          className="h-7 w-7 rounded-md bg-surface-2 flex items-center justify-center hover:bg-border transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-8 text-center text-sm font-medium font-mono">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          className="h-7 w-7 rounded-md bg-surface-2 flex items-center justify-center hover:bg-border transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className="text-right min-w-[70px]">
        <p className="text-sm font-semibold font-mono">{formatCurrency(item.subtotal)}</p>
      </div>
      <button
        onClick={() => onRemove(item.productId)}
        className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-danger transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
