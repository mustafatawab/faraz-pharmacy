import { useRef, useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import FirstLaunch from "@/components/setup/FirstLaunch";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import POS from "@/pages/POS";
import Products from "@/pages/Products";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import Arrears from "@/pages/Arrears";
import Stock from "@/pages/Stock";
import Distributors from "@/pages/Distributors";
import Companies from "@/pages/Companies";
import Returns from "@/pages/Returns";
import Expenses from "@/pages/Expenses";
import Reports from "@/pages/Reports";
import Invoices from "@/pages/Invoices";
import Settings from "@/pages/Settings";

function AppShell() {
  const { isAuthenticated } = useAuth();
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const prevAuth = useRef(isAuthenticated);

  useEffect(() => {
    try {
      const cfg = window.appConfig;
      if (cfg) {
        setConfigured(cfg.mode === "server" || cfg.mode === "client");
      }
    } catch {
      // Running outside Electron (e.g. browser dev mode) — skip config check
    }
    if (localStorage.getItem("faraz_show_setup") === "true") {
      setShowSetup(true);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (prevAuth.current === true && isAuthenticated === false) {
      setShowSetup(true);
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  if (!ready) return null;

  if (!configured || showSetup) {
    return <FirstLaunch onComplete={() => { localStorage.removeItem("faraz_show_setup"); window.location.reload(); }} />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/arrears" element={<Arrears />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/distributors" element={<Distributors />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
