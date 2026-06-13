"use client";

import { Search, Barcode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useRef } from "react";

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

export function BarcodeInput({ value, onChange, onSubmit }: BarcodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim()) {
      onSubmit(value.trim());
      onChange("");
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <Barcode className="h-4 w-4 text-text-secondary" />
      </div>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Scan barcode or search product..."
        className="pl-10 h-12 text-base font-mono tracking-wider"
        autoFocus
      />
      {value && (
        <button
          onClick={() => onSubmit(value.trim())}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
