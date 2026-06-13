"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  CreditCard,
  Factory,
  Building2,
  Undo2,
  Wallet,
  BarChart3,
  LogOut,
  ChevronLeft,
  PillBottle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS / Sales", icon: ShoppingCart, highlight: true },
  { href: "/products", label: "Products", icon: Package },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/arrears", label: "Arrears", icon: CreditCard },
  { href: "/distributors", label: "Distributors", icon: Factory },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/returns", label: "Returns", icon: Undo2 },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-surface border-r border-border flex flex-col transition-all duration-200 z-40",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-border",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <PillBottle className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">Faraz Pharmacy</p>
            <p className="text-xs text-text-secondary truncate">POS System</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center rounded-lg transition-all duration-150 group",
                collapsed ? "justify-center h-11 w-11 mx-auto" : "gap-3 px-3 h-11",
                isActive
                  ? "bg-accent/10 text-accent font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-2",
                item.highlight && !isActive && "text-accent/70 hover:text-accent"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-accent"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
              {!collapsed && (
                <span className="text-sm truncate">{item.label}</span>
              )}
              {item.highlight && !collapsed && (
                <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                  Hot
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={cn(
        "border-t border-border p-3",
        collapsed ? "flex flex-col items-center gap-3" : "space-y-3"
      )}>
        <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-accent/10 text-accent">AD</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">Admin</p>
              <p className="text-xs text-text-secondary truncate">admin@farazpharmacy.com</p>
            </div>
          )}
        </div>
        <div className={cn("flex gap-1", collapsed && "flex-col")}>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className={cn("text-text-secondary hover:text-danger", collapsed ? "h-9 w-9" : "flex-1 justify-start")}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-text-secondary"
            onClick={onToggle}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
