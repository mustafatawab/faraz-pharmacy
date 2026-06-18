import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import logo from "@/asset/image/logo.png";

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

  if (recoveryMode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <Lock className="h-10 w-10 mx-auto text-accent" />
            <h1 className="text-xl font-semibold">Recover Password</h1>
            <p className="text-sm text-text-secondary">Enter your recovery key and choose a new password</p>
          </div>
          {recoverySuccess ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-success font-medium">Password reset successfully! Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="recovery-phrase">Recovery Key</Label>
                <Input
                  id="recovery-phrase"
                  value={recoveryPhrase}
                  onChange={(e) => setRecoveryPhrase(e.target.value)}
                  placeholder="Paste your recovery key here"
                  className="font-mono text-sm"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              {recoveryError && <p className="text-sm text-danger text-center">{recoveryError}</p>}
              <Button type="submit" className="w-full h-11" disabled={recovering || !recoveryPhrase || !newPassword || !confirmPassword}>
                {recovering ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
          <div className="text-center">
            <button
              type="button"
              onClick={() => { setRecoveryMode(false); setRecoveryError(""); setRecoveryPhrase(""); setNewPassword(""); setConfirmPassword(""); setRecoverySuccess(false); }}
              className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <img src={logo} alt="Faraz Pharmacy" className="w-1/2 mx-auto" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
              placeholder="admin"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-danger text-center">{error}</p>}
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => { setRecoveryMode(true); setError(""); }}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-text-secondary mt-6">Developed by Mustafa Tawab</p>
      </div>
    </div>
  );
}
