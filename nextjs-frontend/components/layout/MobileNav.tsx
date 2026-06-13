"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { PillBottle } from "lucide-react";

const bottomNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/arrears", label: "Arrears", icon: CreditCard },
];

const drawerItems = [
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/distributors", label: "Distributors", icon: ShoppingCart },
  { href: "/companies", label: "Companies", icon: ShoppingCart },
  { href: "/returns", label: "Returns", icon: ShoppingCart },
  { href: "/expenses", label: "Expenses", icon: ShoppingCart },
  { href: "/reports", label: "Reports", icon: ShoppingCart },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border z-50 lg:hidden">
        <div className="flex items-center justify-around h-full px-2">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors",
                  isActive
                    ? "text-accent"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex flex-col items-center justify-center gap-0.5 h-auto py-1"
              >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium text-text-secondary">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
              <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                  <PillBottle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Faraz Pharmacy</p>
                  <p className="text-xs text-text-secondary">POS System</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {drawerItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                        isActive
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      {/* Spacer for bottom nav */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
