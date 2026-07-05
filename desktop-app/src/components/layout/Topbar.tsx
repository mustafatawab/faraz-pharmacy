import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Server, Monitor, Sun, Moon, Search, Bell } from "lucide-react";

const pageLabels: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Business overview" },
  "/pos": { title: "Point of Sale", subtitle: "Create and manage sales" },
  "/products": { title: "Products", subtitle: "Inventory management" },
  "/stock": { title: "Stock", subtitle: "Purchase management" },
  "/customers": { title: "Customers", subtitle: "Customer records" },
  "/invoices": { title: "Invoices", subtitle: "Sales invoices" },
  "/arrears": { title: "Arrears", subtitle: "Outstanding payments" },
  "/distributors": { title: "Distributors", subtitle: "Supplier management" },
  "/companies": { title: "Companies", subtitle: "Company records" },
  "/returns": { title: "Returns", subtitle: "Return management" },
  "/expenses": { title: "Expenses", subtitle: "Expense tracking" },
  "/reports": { title: "Reports", subtitle: "Business insights" },
  "/settings": { title: "Settings", subtitle: "System configuration" },
};

export default function Topbar() {
  const location = useLocation();
  const [time, setTime] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("faraz_theme", next ? "dark" : "light"); } catch {}
  }

  const page = pageLabels[location.pathname] || { title: "Dashboard", subtitle: "Business overview" };
  const isServer = window.appConfig?.mode === "server";

  return (
    <header className="h-12 border-b border-border bg-surface/70 backdrop-blur-lg sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-5">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
        >
          <h1 className="text-sm font-semibold text-text-primary tracking-tight">{page.title}</h1>
          <p className="text-[10px] text-text-secondary leading-none mt-px">{page.subtitle}</p>
        </motion.div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 h-6 rounded-md bg-muted text-[10px] text-text-secondary font-medium">
            {isServer ? (
              <Server className="h-3 w-3 text-accent" />
            ) : (
              <Monitor className="h-3 w-3 text-muted-foreground" />
            )}
            <span>{isServer ? "Server" : "Client"}</span>
          </div>

          <span className="text-[11px] text-text-secondary tabular-nums font-medium">{time}</span>

          <button className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-muted transition-all duration-150">
            <Bell className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={toggleDark}
            className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-muted transition-all duration-150"
          >
            {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
