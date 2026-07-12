import { useEffect, useState, useRef } from "react";
import { Barcode, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import JsBarcode from "jsbarcode";
import { generateBarcode } from "@/lib/utils";
import { api } from "@/lib/api";
import type { USBPrinterInfo } from "@/types/electron";

interface PrintBarcodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcode?: string;
}

export default function PrintBarcodeDialog({ open, onOpenChange, barcode: propBarcode }: PrintBarcodeDialogProps) {
  const [barcode, setBarcode] = useState("");
  const [copies, setCopies] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [isNewBarcode, setIsNewBarcode] = useState(false);
  const [usbPrinters, setUsbPrinters] = useState<USBPrinterInfo[]>([]);
  const barcodeId = useRef(0);

  useEffect(() => {
    if (!open) return;
    setBarcode("");
    setCopies(1);
    setIsNewBarcode(false);
    if (propBarcode) {
      setBarcode(propBarcode);
      return;
    }
    let cancelled = false;
    (async () => {
      setGenerating(true);
      try {
        const [products, existingBarcodes] = await Promise.all([
          api.products.list(),
          api.barcodes.list(),
        ]);
        const existing = new Set([
          ...products.map(p => p.barcode),
          ...existingBarcodes.map(b => b.code),
        ]);
        let code = generateBarcode();
        while (existing.has(code)) {
          code = generateBarcode();
        }
        if (!cancelled) {
          setBarcode(code);
          setIsNewBarcode(true);
        }
      } catch {
        if (!cancelled) {
          setBarcode(generateBarcode());
          setIsNewBarcode(true);
        }
      }
      if (!cancelled) setGenerating(false);
    })();
    return () => { cancelled = true; };
  }, [open, propBarcode]);

  useEffect(() => {
    if (open) {
      window.getUSBPrinters().then(setUsbPrinters).catch(() => setUsbPrinters([]));
    }
  }, [open]);

  useEffect(() => {
    if (!barcode || !open) return;
    barcodeId.current++;
    const id = barcodeId.current;
    const svg = document.getElementById("barcode-svg") as unknown as SVGElement;
    if (!svg) return;
    requestAnimationFrame(() => {
      if (id !== barcodeId.current) return;
      try {
        JsBarcode(svg, barcode, {
          format: "EAN13",
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
      } catch {
        // invalid barcode
      }
    });
  }, [barcode, open]);

  async function handlePrint() {
    try {
      if (isNewBarcode) {
        await api.barcodes.create(barcode);
      }
      const result = await window.printBarcodeLabel(barcode, copies);
      if (!result.success) {
        alert("Barcode print failed: " + (result.error || "Unknown error"));
      } else {
        onOpenChange(false);
      }
    } catch (e) {
      alert("Barcode print failed: " + (e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="h-4 w-4 text-accent" />
            Print Barcode
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5 space-y-4">
          {generating ? (
            <div className="flex items-center justify-center h-24 text-sm text-text-secondary">
              Generating unique barcode...
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-surface-2">
                <div className="flex items-center justify-center w-full min-h-[80px]">
                  <svg id="barcode-svg" />
                </div>
                <p className="text-xs text-text-secondary font-mono tracking-wider">{barcode}</p>
              </div>
              <div className="space-y-1">
                <Label>Number of copies</Label>
                <Input type="number" min={1} max={100} value={copies} onChange={(e) => setCopies(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} />
              </div>
              <Button className="w-full" onClick={handlePrint}>
                Print {copies} label{copies > 1 ? "s" : ""}
              </Button>
              {usbPrinters.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-text-secondary flex items-center gap-1">
                    <Printer className="h-3 w-3" />
                    Detected printers
                  </p>
                  <div className="space-y-1">
                    {usbPrinters.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border bg-surface-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        <span className="text-text-primary truncate">{p.productName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
