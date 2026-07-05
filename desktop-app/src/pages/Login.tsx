import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, ArrowLeft, Pill, Sun, Moon } from "lucide-react";
import { api } from "@/lib/api";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("faraz_theme", next ? "dark" : "light"); } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError("");
    const err = await login(username, password);
    if (err) setError(err);
    setLoading(false);
  }

  async function handleRecoverySubmit(e: React.FormEvent) {
    e.preventDefault();
    setRecoveryError("");
    if (!recoveryPhrase || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setRecoveryError("Passwords do not match");
      return;
    }
    if (newPassword.length < 4) {
      setRecoveryError("Password must be at least 4 characters");
      return;
    }
    setRecovering(true);
    try {
      const res = await api.auth.recoverPassword(recoveryPhrase.trim(), newPassword);
      if (res.error) {
        setRecoveryError(res.error);
      } else {
        setRecoverySuccess(true);
        setTimeout(() => {
          setRecoveryMode(false);
          setRecoverySuccess(false);
          setRecoveryPhrase("");
          setNewPassword("");
          setConfirmPassword("");
        }, 3000);
      }
    } catch {
      setRecoveryError("Recovery failed");
    } finally {
      setRecovering(false);
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/2 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-accent/2 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      <button
        onClick={toggleDark}
        className="absolute top-5 right-5 h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all duration-200 z-10"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <AnimatePresence mode="wait">
        {recoveryMode ? (
          <motion.div
            key="recovery"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-sm relative"
          >
            <div className="bg-surface border border-border rounded-xl shadow-lg shadow-black/5 p-6">
              <div className="text-center space-y-1.5 mb-5">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto">
                  <Lock className="h-5 w-5 text-accent" />
                </div>
                <h1 className="text-base font-semibold text-text-primary">Recover Password</h1>
                <p className="text-xs text-text-secondary">Enter your recovery key to reset your password</p>
              </div>

              {recoverySuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-5"
                >
                  <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
                    <Pill className="h-5 w-5 text-success" />
                  </div>
                  <p className="text-sm text-success font-medium">Password reset successfully!</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Redirecting to login...</p>
                </motion.div>
              ) : (
                <form onSubmit={handleRecoverySubmit} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="recovery-phrase" className="text-xs">Recovery Key</Label>
                    <Input
                      id="recovery-phrase"
                      value={recoveryPhrase}
                      onChange={(e) => setRecoveryPhrase(e.target.value)}
                      placeholder="Paste your recovery key"
                      className="font-mono text-xs"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-password" className="text-xs">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirm-password" className="text-xs">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  {recoveryError && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-danger text-center">
                      {recoveryError}
                    </motion.p>
                  )}
                  <Button type="submit" className="w-full" size="sm" disabled={recovering || !recoveryPhrase || !newPassword || !confirmPassword}>
                    {recovering ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              )}

              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => { setRecoveryMode(false); setRecoveryError(""); setRecoveryPhrase(""); setNewPassword(""); setConfirmPassword(""); setRecoverySuccess(false); }}
                  className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to login
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-sm relative"
          >
            <div className="bg-surface border border-border rounded-xl shadow-lg shadow-black/5 p-6">
              <div className="text-center space-y-1.5 mb-5">
                <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center mx-auto">
                  <Pill className="h-5 w-5 text-accent" />
                </div>
                <h1 className="text-base font-semibold text-text-primary tracking-tight">Faraz Pharmacy</h1>
                <p className="text-xs text-text-secondary">Sign in to your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="username" className="text-xs font-medium text-text-primary">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-medium text-text-primary">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-danger bg-danger/5 border border-danger/10 rounded-lg px-3 py-2 text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button type="submit" className="w-full" size="sm" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Signing in...
                    </span>
                  ) : "Sign in"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setRecoveryMode(true); setError(""); }}
                    className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            </div>

            <p className="text-center text-[10px] text-text-secondary/50 mt-5">Faraz Pharmacy POS</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
