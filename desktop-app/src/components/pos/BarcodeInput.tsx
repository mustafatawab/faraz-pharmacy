import { Search, Barcode } from "lucide-react";
import { Input } from "@/components/ui/input";

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

export default function BarcodeInput({ value, onChange, onSubmit }: BarcodeInputProps) {
  return (
    <div className="relative">
      <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onSubmit(value.trim());
            onChange("");
          }
        }}
        placeholder="Search by name or scan barcode..."
        className="h-12 pl-11 pr-4 text-base rounded-xl bg-surface border-border"
      />
      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
    </div>
  );
}
