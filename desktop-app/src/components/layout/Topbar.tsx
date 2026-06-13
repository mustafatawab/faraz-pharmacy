import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Server, WifiOff, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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

export default function Topbar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
      }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const pathParts = location.pathname.split("/").filter(Boolean);
  const isServer = window.appConfig?.mode === "server";
  const isClient = window.appConfig?.mode === "client";

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-2 text-sm">
          {pathParts.map((part, i) => (
            <span key={part} className="flex items-center gap-2">
              {i > 0 && <span className="text-text-secondary">/</span>}
              <span className={i === pathParts.length - 1 ? "text-text-primary font-medium" : "text-text-secondary"}>
                {pageTitles["/" + part] || part.charAt(0).toUpperCase() + part.slice(1)}
              </span>
            </span>
          ))}
          {pathParts.length === 0 && <span className="text-text-primary font-medium">Dashboard</span>}
        </div>
        <div className="flex items-center gap-3">
          {isServer && (
            <div className="flex items-center gap-1.5 text-xs text-success bg-success/5 px-2.5 py-1 rounded-full border border-success/20">
              <Server className="h-3 w-3" />
              Server
            </div>
          )}
          {isClient && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-surface-2 px-2.5 py-1 rounded-full border border-border">
              <WifiOff className="h-3 w-3" />
              Client
            </div>
          )}
          <span className="text-sm text-text-secondary">{user?.username}</span>
          <div className="text-sm tabular-nums text-text-secondary font-mono">{time}</div>
          <button
            onClick={logout}
            className="h-8 w-8 rounded-md flex items-center justify-center text-text-secondary hover:text-danger hover:bg-danger/5 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
