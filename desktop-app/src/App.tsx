import { useRef, useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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

function AppShell() {
  const { isAuthenticated } = useAuth();
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const prevAuth = useRef(isAuthenticated);

  useEffect(() => {
    const cfg = window.appConfig;
    setConfigured(cfg?.mode === "server" || cfg?.mode === "client");
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

  if (window.appConfig.mode === "client" && !window.appConfig.serverUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-background p-4">
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Not Configured</h2>
          <p className="text-sm text-text-secondary">Server URL is missing. Please delete the config file and restart.</p>
        </div>
      </div>
    );
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
    </AuthProvider>
  );
}
