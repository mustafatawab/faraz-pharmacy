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
}

export default function PrintBarcodeDialog({ open, onOpenChange }: PrintBarcodeDialogProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [barcode, setBarcode] = useState("");
  const [copies, setCopies] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [usbPrinters, setUsbPrinters] = useState<USBPrinterInfo[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setGenerating(true);
      try {
        const products = await api.products.list();
        const existing = new Set(products.map(p => p.barcode));
        let code = generateBarcode();
        while (existing.has(code)) {
          code = generateBarcode();
        }
        setBarcode(code);
      } catch {
        setBarcode(generateBarcode());
      }
      setGenerating(false);
    })();
  }, [open]);

  useEffect(() => {
    if (open) {
      window.getUSBPrinters().then(setUsbPrinters).catch(() => setUsbPrinters([]));
    }
  }, [open]);

  useEffect(() => {
    if (barcode && open && svgRef.current) {
      try {
        JsBarcode(svgRef.current, barcode, {
          format: "CODE128",
          width: 1.8,
          height: 50,
          displayValue: true,
          fontSize: 14,
          margin: 8,
        });
      } catch {
        // invalid barcode
      }
    }
  }, [barcode, open]);

  async function handlePrint() {
    try {
      const result = await window.printBarcodeLabel(barcode, "", 0, copies);
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
                <svg ref={svgRef} />
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
