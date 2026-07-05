import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  const lowStock = product.stock_qty <= 5;
  const outOfStock = product.stock_qty === 0;

  return (
    <motion.button
      whileHover={outOfStock ? undefined : { y: -1 }}
      whileTap={outOfStock ? undefined : { scale: 0.99 }}
      onClick={() => !outOfStock && onAdd(product)}
      disabled={outOfStock}
      className={`w-full text-left rounded-lg border bg-surface p-3.5 transition-all ${
        outOfStock
          ? "border-danger/30 opacity-50 cursor-not-allowed"
          : "border-border hover:border-accent/30 hover:shadow-sm cursor-pointer"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text-primary text-xs truncate">{product.name}</h3>
          <p className="text-[10px] text-text-secondary mt-px truncate">{product.company}</p>
        </div>
        <div className="h-7 w-7 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
          <Package className="h-3.5 w-3.5 text-accent" />
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-sm font-bold text-text-primary tabular-nums">{formatCurrency(product.sale_price)}</span>
        <Badge variant={outOfStock ? "danger" : lowStock ? "danger" : "neutral"} className="text-[9px] px-1.5 py-px">
          {outOfStock ? "Out" : `${product.stock_qty}`}
        </Badge>
      </div>
    </motion.button>
  );
}
