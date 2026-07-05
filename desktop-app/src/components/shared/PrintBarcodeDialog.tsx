import { useRef, useEffect, useState } from "react";
import { Barcode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import JsBarcode from "jsbarcode";

interface PrintBarcodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcode: string;
  productName: string;
  price?: number;
}

export default function PrintBarcodeDialog({ open, onOpenChange, barcode, productName: initialName, price: initialPrice }: PrintBarcodeDialogProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [copies, setCopies] = useState(1);
  const [labelName, setLabelName] = useState(initialName);
  const [labelPrice, setLabelPrice] = useState(initialPrice ?? 0);

  useEffect(() => {
    if (open) {
      setLabelName(initialName);
      setLabelPrice(initialPrice ?? 0);
    }
  }, [open, initialName, initialPrice]);

  useEffect(() => {
    if (open && svgRef.current && barcode) {
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
  }, [open, barcode, labelName, labelPrice]);

  function handlePrint() {
    const svg = svgRef.current;
    if (!svg) return;

    const cloned = svg.cloneNode(true) as SVGSVGElement;
    const serialized = new XMLSerializer().serializeToString(cloned);

    const labelsPerRow = 3;
    const rows = Math.ceil(copies / labelsPerRow);
    const labels: string[] = [];

    for (let i = 0; i < copies; i++) {
      labels.push(`
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:200px;padding:8px 4px;border:1px dashed #ccc;">
          ${serialized}
          ${labelName ? `<div style="font-size:10px;text-align:center;margin-top:2px;color:#333;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${labelName}</div>` : ""}
          ${labelPrice > 0 ? `<div style="font-size:11px;font-weight:600;text-align:center;color:#000;">Rs ${labelPrice}</div>` : ""}
        </div>
      `);
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            @page { margin: 6mm; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .label-grid { display: flex; flex-wrap: wrap; gap: 2px; justify-content: flex-start; }
          </style>
        </head>
        <body>
          <div class="label-grid">${labels.join("")}</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="h-4 w-4 text-accent" />
            Print Barcode
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5 space-y-4">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-surface-2">
            <svg ref={svgRef} />
            <p className="text-xs text-text-secondary font-mono tracking-wider">{barcode}</p>
            {labelName ? <p className="text-xs text-text-primary font-medium">{labelName}</p> : null}
            {labelPrice > 0 ? <p className="text-sm font-bold text-text-primary">Rs {labelPrice}</p> : null}
          </div>
          <div className="space-y-1">
            <Label>Product name</Label>
            <Input value={labelName} onChange={(e) => setLabelName(e.target.value)} placeholder="(optional)" />
          </div>
          <div className="space-y-1">
            <Label>Price</Label>
            <Input type="number" min={0} value={labelPrice} onChange={(e) => setLabelPrice(Math.max(0, Number(e.target.value) || 0))} />
          </div>
          <div className="space-y-1">
            <Label>Number of copies</Label>
            <Input type="number" min={1} max={100} value={copies} onChange={(e) => setCopies(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} />
          </div>
          <Button className="w-full" onClick={handlePrint}>
            Print {copies} label{copies > 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}