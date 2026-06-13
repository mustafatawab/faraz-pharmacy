"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pos": "POS / Sales",
  "/products": "Products",
  "/stock": "Stock",
  "/customers": "Customers",
  "/arrears": "Arrears",
  "/distributors": "Distributors",
  "/companies": "Companies",
  "/returns": "Returns",
  "/expenses": "Expenses",
  "/reports": "Reports",
};

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const pathParts = pathname.split("/").filter(Boolean);
  const title = pageTitles[pathname] || pathParts[pathParts.length - 1] || "Dashboard";

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm">
            {pathParts.map((part, i) => (
              <span key={part} className="flex items-center gap-2">
                {i > 0 && <span className="text-text-secondary">/</span>}
                <span className={i === pathParts.length - 1 ? "text-text-primary font-medium" : "text-text-secondary"}>
                  {pageTitles["/" + part] || part.charAt(0).toUpperCase() + part.slice(1)}
                </span>
              </span>
            ))}
            {pathParts.length === 0 && (
              <span className="text-text-primary font-medium">Dashboard</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm tabular-nums text-text-secondary font-mono">
            {time}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
