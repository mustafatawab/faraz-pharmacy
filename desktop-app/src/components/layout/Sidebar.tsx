import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, Users, CreditCard,
  Factory, Building2, Undo2, Wallet, BarChart3, LogOut, Receipt, Settings,
  PanelLeftClose,
} from "lucide-react";
import logo from "@/asset/image/logo.png";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS / Sales", icon: ShoppingCart, highlight: true },
  { href: "/products", label: "Products", icon: Package },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/arrears", label: "Arrears", icon: CreditCard },
  { href: "/distributors", label: "Distributors", icon: Factory },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/returns", label: "Returns", icon: Undo2 },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const pathname = location.pathname;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn("h-full bg-surface border-r border-border flex flex-col shrink-0 transition-all duration-300", collapsed ? "w-[64px]" : "w-[240px]")}>
      <div className={cn("flex items-center h-16 border-b border-border relative", collapsed ? "justify-center px-0" : "px-4 gap-3")}>
        <div className={cn("shrink-0", collapsed ? "h-10 w-10" : "h-14 w-14")}>
          <img src={logo} alt="Faraz Pharmacy" className="h-full w-full object-cover" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">Faraz Pharmacy</p>
            <p className="text-xs text-text-secondary truncate">POS System</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-border bg-surface flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors shadow-sm z-10",
            collapsed && "rotate-180"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "relative flex items-center w-full rounded-lg transition-all duration-150",
                collapsed ? "justify-center h-11 w-11 mx-auto" : "gap-3 px-3 h-11",
                isActive
                  ? "bg-accent/10 text-accent font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              {isActive && !collapsed && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-accent"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {isActive && collapsed && (
                <motion.div
                  layoutId="sidebar-active-collapsed"
                  className="absolute inset-0 rounded-lg bg-accent/10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="text-sm truncate">{item.label}</span>}
              {item.highlight && !collapsed && (
                <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                  Hot
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={cn("border-t border-border", collapsed ? "p-2 flex justify-center" : "p-3 space-y-3")}>
        {collapsed ? (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-accent/10 text-accent">
              {user?.username?.slice(0, 2).toUpperCase() || "AD"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-accent/10 text-accent">
                  {user?.username?.slice(0, 2).toUpperCase() || "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{user?.username || "Admin"}</p>
                <p className="text-xs text-text-secondary truncate">Administrator</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start text-text-secondary hover:text-danger" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
