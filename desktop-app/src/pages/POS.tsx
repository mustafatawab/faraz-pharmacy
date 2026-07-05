import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, FileText } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Product, PrinterConfig, ProductPrice } from "@/types";

const PAPER_SIZES = [
  { value: "thermal", label: "Thermal (80mm)", icon: Printer },
  { value: "a5", label: "A5", icon: FileText },
  { value: "a4", label: "A4", icon: FileText },
] as const;

export default function POS() {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const debouncedSearch = useDebounce(search, 200);
  const cart = useCart();
  const queryClient = useQueryClient();

  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({ paperSize: "thermal", deviceName: null });
  const [printers, setPrinters] = useState<{ name: string; displayName: string; isDefault: boolean }[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("default");

  const [pricePickerOpen, setPricePickerOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const pendingPrices = pendingProduct
    ? ((pendingProduct as any).prices as ProductPrice[] | undefined)
    : undefined;

  useEffect(() => {
    if (window.electronAPI?.printers) {
      window.electronAPI.printers.getConfig().then((cfg) => {
        setPrinterConfig(cfg);
        if (cfg.deviceName) setSelectedPrinter(cfg.deviceName);
      });
      window.electronAPI.printers.list().then(setPrinters);
    }
  }, []);

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

  function addProductToCart(product: Product, salePrice: number) {
    if (product.stock_qty === 0) {
      setError(`${product.name} is out of stock`);
      return;
    }
    cart.addItem({ ...product, sale_price: salePrice });
  }

  function promptPriceTier(product: Product) {
    const tiers = (product as any).prices as ProductPrice[] | undefined;
    if (tiers && tiers.length > 0) {
      setPendingProduct(product);
      setPricePickerOpen(true);
    } else {
      addProductToCart(product, product.sale_price);
    }
  }

  function handleTierSelect(tierSalePrice: number) {
    if (!pendingProduct) return;
    addProductToCart(pendingProduct, tierSalePrice);
    setPendingProduct(null);
    setPricePickerOpen(false);
  }

  const handleBarcodeSubmit = async (value: string) => {
    const product = await api.products.getByBarcode(value);
    if (product) {
      promptPriceTier(product);
    } else {
      const found = displayProducts.find(
        (p: Product) => p.barcode === value || p.name.toLowerCase() === value.toLowerCase()
      );
      if (found) {
        promptPriceTier(found);
      }
    }
  };

  const handleAddProduct = (product: Product) => {
    if (product.stock_qty === 0) {
      setError(`${product.name} is out of stock`);
      return;
    }
    promptPriceTier(product);
  };

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

      let customerTotalArrears = 0;
      if (cart.customerId) {
        const customer = await api.customers.getById(cart.customerId);
        customerTotalArrears = customer?.outstanding_arrear ?? 0;
      }

      const printData = {
        ...sale,
        customer_name: cart.customerName,
        customer_total_arrears: customerTotalArrears,
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
    const config: PrinterConfig = {
      paperSize: printerConfig.paperSize,
      deviceName: selectedPrinter === "default" ? null : selectedPrinter,
    };
    if (window.printReceipt && pendingPrintData) {
      const result = await window.printReceipt(pendingPrintData, config);
      if (!result.success) {
        setError(result.error || "Print failed");
      }
    }
    setPendingPrintData(null);
  }

  function handlePrintNo() {
    setShowPrintDialog(false);
    setPendingPrintData(null);
  }

  function handleSavePrinterPref() {
    const config: PrinterConfig = {
      paperSize: printerConfig.paperSize,
      deviceName: selectedPrinter === "default" ? null : selectedPrinter,
    };
    window.electronAPI?.printers?.saveConfig(config);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7rem)]">
      <div className="flex-1 flex flex-col min-h-0">
        <BarcodeInput value={search} onChange={setSearch} onSubmit={handleBarcodeSubmit} />
        <div className="flex-1 overflow-y-auto mt-3">
          {displayProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-text-secondary">
              {search ? "No products found" : "Search or scan a product to begin"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              <AnimatePresence mode="popLayout">
                {displayProducts.slice(0, 50).map((product: Product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                  >
                    <ProductCard product={product} onAdd={handleAddProduct} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <div className="w-full lg:w-[380px] xl:w-[400px] shrink-0">
        <div className="lg:sticky lg:top-16 bg-surface border border-border rounded-lg p-4 h-full max-h-[calc(100vh-7.5rem)] flex flex-col">
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
            onCustomerChange={cart.setCustomer}
            error={error}
          />
        </div>
      </div>

      <AlertDialog open={pricePickerOpen} onOpenChange={(v) => { if (!v) { setPendingProduct(null); setPricePickerOpen(false); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select Price Tier</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingProduct?.name ?? "Product"} has multiple price tiers. Choose one to add to cart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-3 px-5">
            <button
              onClick={() => pendingProduct && handleTierSelect(pendingProduct.sale_price ?? 0)}
              className="w-full text-left p-2.5 rounded-lg border border-border hover:border-accent/50 transition-colors flex items-center justify-between"
            >
              <span className="text-xs font-medium">Standard</span>
              <span className="font-mono font-bold text-accent text-xs">{formatCurrency(pendingProduct?.sale_price ?? 0)}</span>
            </button>
            {pendingPrices?.map((tier) => (
              <button
                key={tier.id}
                onClick={() => handleTierSelect(tier.salePrice)}
                className="w-full text-left p-2.5 rounded-lg border border-border hover:border-accent/50 transition-colors flex items-center justify-between"
              >
                <span className="text-xs font-medium">{tier.label || "Untitled"}</span>
                <span className="font-mono font-bold text-accent text-xs">{formatCurrency(tier.salePrice)}</span>
              </button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingProduct(null); }}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Print Receipt</AlertDialogTitle>
            <AlertDialogDescription>Select paper size and printer</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2 px-5">
            <div className="space-y-2">
              <Label className="text-xs">Paper Size</Label>
              <div className="grid grid-cols-3 gap-2">
                {PAPER_SIZES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setPrinterConfig({ ...printerConfig, paperSize: value as "thermal" | "a4" | "a5" })}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-colors ${
                      printerConfig.paperSize === value
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${printerConfig.paperSize === value ? "text-accent" : "text-text-secondary"}`} />
                    <span className={`text-[10px] font-medium ${printerConfig.paperSize === value ? "text-accent" : "text-text-secondary"}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Printer</Label>
              <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
                <SelectTrigger>
                  <SelectValue placeholder="Default printer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Printer</SelectItem>
                  {printers.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.displayName} {p.isDefault ? "(Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handlePrintNo} size="sm">Don't Print</AlertDialogCancel>
            <div className="flex gap-2">
              <AlertDialogAction onClick={() => { handleSavePrinterPref(); handlePrintYes(); }} size="sm">
                Print
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
