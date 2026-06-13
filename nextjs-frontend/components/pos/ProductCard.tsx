"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onAdd(product)}
      className="text-left w-full rounded-xl border border-border bg-surface p-4 hover:shadow-md hover:border-accent/30 transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {product.name}
          </p>
          <p className="text-xs text-text-secondary mt-0.5 truncate">
            {product.company}
          </p>
          <p className="text-xs text-text-secondary font-mono mt-0.5">
            {product.barcode}
          </p>
        </div>
        <div className="h-7 w-7 rounded-lg border border-border flex items-center justify-center group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all shrink-0">
          <Plus className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-sm font-mono font-semibold text-accent">
          {formatCurrency(product.salePrice)}
        </span>
        <span className="text-xs text-text-secondary">
          Stock: <span className={`font-mono ${product.stockQty <= 5 ? "text-danger" : "text-text-primary"}`}>{product.stockQty}</span>
        </span>
      </div>
    </motion.button>
  );
}
