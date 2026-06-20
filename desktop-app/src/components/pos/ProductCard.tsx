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
      whileHover={outOfStock ? undefined : { scale: 1.02 }}
      whileTap={outOfStock ? undefined : { scale: 0.98 }}
      onClick={() => !outOfStock && onAdd(product)}
      disabled={outOfStock}
      className={`w-full text-left rounded-xl border bg-surface p-4 transition-all ${
        outOfStock
          ? "border-danger/50 opacity-60 cursor-not-allowed"
          : "border-border hover:border-accent/30 hover:shadow-md cursor-pointer"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text-primary text-sm truncate">{product.name}</h3>
          <p className="text-xs text-text-secondary mt-0.5 truncate">{product.company}</p>
        </div>
        <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <Package className="h-4 w-4 text-accent" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-base font-bold text-text-primary">{formatCurrency(product.sale_price)}</span>
        <Badge variant={outOfStock ? "danger" : lowStock ? "danger" : "outline"} className="text-[10px] px-1.5 py-0">
          {outOfStock ? "Out of stock" : `${product.stock_qty} in stock`}
        </Badge>
      </div>
    </motion.button>
  );
}
