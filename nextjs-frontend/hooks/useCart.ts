"use client";

import { useState, useCallback } from "react";
import type { SaleItem } from "@/types";

export function useCart() {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);

  const addItem = useCallback((product: { id: string; name: string; barcode: string; salePrice: number }) => {
    setItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          quantity: 1,
          unitPrice: product.salePrice,
          subtotal: product.salePrice,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.productId !== productId));
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity, subtotal: quantity * item.unitPrice }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setCustomerId(null);
    setCustomerName(null);
  }, []);

  return {
    items,
    discount,
    setDiscount,
    customerId,
    setCustomerId,
    customerName,
    setCustomerName,
    subtotal,
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
}
