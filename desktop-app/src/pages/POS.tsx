import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import BarcodeInput from "@/components/pos/BarcodeInput";
import ProductCard from "@/components/pos/ProductCard";
import CheckoutPanel from "@/components/pos/CheckoutPanel";
import { useCart } from "@/hooks/useCart";
import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Product } from "@/types";

export default function POS() {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const debouncedSearch = useDebounce(search, 200);
  const cart = useCart();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["products", debouncedSearch],
    queryFn: () => api.products.search(debouncedSearch),
    enabled: debouncedSearch.length > 0,
  });

  const allProducts = useQuery({
    queryKey: ["products", "all"],
    queryFn: api.products.list,
    enabled: debouncedSearch.length === 0,
  });

  const displayProducts = useMemo(() => {
    if (debouncedSearch.length > 0) return products;
    return allProducts.data ?? [];
  }, [debouncedSearch, products, allProducts.data]);

  const handleBarcodeSubmit = async (value: string) => {
    const product = await api.products.getByBarcode(value);
    if (product) {
      cart.addItem(product as unknown as Product);
    } else {
      const found = displayProducts.find(
        (p: Product) => p.barcode === value || p.name.toLowerCase() === value.toLowerCase()
      );
      if (found) cart.addItem(found);
    }
  };

  const handleAddProduct = (product: Product) => cart.addItem(product);

  const [pendingPrintData, setPendingPrintData] = useState<unknown>(null);

  const handleCheckout = async (amountPaid: number, discount: number) => {
    setError("");
    try {
      const sale = await api.sales.create({
        customerId: cart.customerId,
        items: cart.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
        subtotal: cart.subtotal,
        discount,
        total: cart.total,
        amountPaid,
      });

      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });

      const printData = {
        ...sale,
        items: cart.items.map((item) => ({
          product_name: item.productName,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
      };
      setPendingPrintData(printData);
      setShowPrintDialog(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      throw e;
    }
  };

  async function handlePrintYes() {
    setShowPrintDialog(false);
    if (window.printReceipt && pendingPrintData) {
      const result = await window.printReceipt(pendingPrintData);
      if (!result.success) {
        console.warn("Receipt print failed:", result.error);
      }
    }
    setPendingPrintData(null);
  }

  function handlePrintNo() {
    setShowPrintDialog(false);
    setPendingPrintData(null);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col min-h-0">
        <BarcodeInput value={search} onChange={setSearch} onSubmit={handleBarcodeSubmit} />
        <div className="flex-1 overflow-y-auto mt-4">
          {displayProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-text-secondary">
              {search ? "No products found" : "Search or scan a product to begin"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {displayProducts.slice(0, 50).map((product: Product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ProductCard product={product} onAdd={handleAddProduct} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0">
        <div className="lg:sticky lg:top-20 bg-surface border border-border rounded-xl p-5 h-full max-h-[calc(100vh-10rem)] flex flex-col">
          <CheckoutPanel
            items={cart.items}
            discount={cart.discount}
            discountValue={cart.discountValue}
            discountType={cart.discountType}
            subtotal={cart.subtotal}
            total={cart.total}
            customerId={cart.customerId}
            onUpdateQuantity={cart.updateQuantity}
            onRemoveItem={cart.removeItem}
            onDiscountChange={cart.setDiscountValue}
            onToggleDiscountType={cart.toggleDiscountType}
            onClearCart={cart.clearCart}
            onCheckout={handleCheckout}
            onCustomerChange={cart.setCustomerId}
            error={error}
          />
        </div>
      </div>
      <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Print Receipt?</AlertDialogTitle>
            <AlertDialogDescription>Send receipt to the thermal printer?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handlePrintNo}>No</AlertDialogCancel>
            <AlertDialogAction onClick={handlePrintYes}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
