"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  timeThreshold?: number;
}

export function useBarcodeScanner({ onScan, minLength = 3, timeThreshold = 100 }: UseBarcodeScannerOptions) {
  const bufferRef = useRef("");
  const lastTimeRef = useRef(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && bufferRef.current.length >= minLength) {
        onScan(bufferRef.current);
        bufferRef.current = "";
        e.preventDefault();
        return;
      }

      if (e.key.length === 1) {
        const now = Date.now();
        if (now - lastTimeRef.current > timeThreshold * 3) {
          bufferRef.current = "";
        }
        bufferRef.current += e.key;
        lastTimeRef.current = now;
      }
    },
    [onScan, minLength, timeThreshold]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
