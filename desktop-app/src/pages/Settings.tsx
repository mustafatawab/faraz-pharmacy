import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database, HardDrive, Trash2, RefreshCw, CheckCircle2, XCircle,
  Cloud, CloudOff, Loader2, Link2, Link2Off, Lock,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDateTime, formatFileSize } from "@/lib/utils";
import { api } from "@/lib/api";
import type { BackupEntry, GDriveConfig } from "@/types/electron";

async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const res = await api.auth.verifyPassword(password);
    return res.valid;
  } catch {
    return false;
  }
}

const defaultGDriveConfig: GDriveConfig = {
  clientId: "",
  clientSecret: "",
  redirectUri: "",
  refreshToken: "",
  autoUpload: false,
  connected: false,
};

export default function Settings() {
  const queryClient = useQueryClient();
  const [backupStatus, setBackupStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [gdriveForm, setGdriveForm] = useState<GDriveConfig>(defaultGDriveConfig);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { data: backups = [], isLoading: backupsLoading } = useQuery({
    queryKey: ["settings", "backups"],
    queryFn: api.settings.backupList,
  });

  const { data: gdriveConfig, isLoading: gdriveLoading } = useQuery({
    queryKey: ["settings", "gdrive"],
    queryFn: api.settings.gdriveGetConfig,
  });

  useEffect(() => {
    if (gdriveConfig) setGdriveForm(gdriveConfig);
  }, [gdriveConfig]);

  const backupMutation = useMutation({
    mutationFn: api.settings.backupCreate,
    onSuccess: (result) => {
      if (result.success) {
        setBackupStatus({ type: "success", message: `Backup created: ${result.name}` });
        queryClient.invalidateQueries({ queryKey: ["settings", "backups"] });
      } else {
        setBackupStatus({ type: "error", message: result.error || "Backup failed" });
      }
      setTimeout(() => setBackupStatus(null), 5000);
    },
    onError: (err: Error) => {
      setBackupStatus({ type: "error", message: err.message });
      setTimeout(() => setBackupStatus(null), 5000);
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: (name: string) => api.settings.backupDelete(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "backups"] }),
  });

  const saveGdriveMutation = useMutation({
    mutationFn: (cfg: GDriveConfig) => api.settings.gdriveSaveConfig(cfg),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "gdrive"] }),
  });

  async function handleBackupWithPassword() {
    setPasswordError("");
    const ok = await verifyAdminPassword(adminPassword);
    if (!ok) {
      setPasswordError("Incorrect admin password");
      return;
    }
    setPasswordDialog(false);
    setAdminPassword("");
    backupMutation.mutate();
  }

  function handleConnect() {
    const cfg = { ...gdriveForm, connected: true };
    saveGdriveMutation.mutate(cfg);
  }

  function handleDisconnect() {
    const cfg = { ...defaultGDriveConfig };
    setGdriveForm(cfg);
    saveGdriveMutation.mutate(cfg);
  }

  function handleSaveGdrive() {
    saveGdriveMutation.mutate(gdriveForm);
  }

  const totalBackupSize = backups.reduce((sum: number, b: BackupEntry) => sum + b.size, 0);

  return (
    <div>
      <PageHeader title="Settings" description="Manage database backups and Google Drive integration" />

      <Tabs defaultValue="backup">
        <TabsList className="mb-6">
          <TabsTrigger value="backup" className="gap-2">
            <Database className="h-4 w-4" />
            Database Backup
          </TabsTrigger>
          <TabsTrigger value="gdrive" className="gap-2">
            <HardDrive className="h-4 w-4" />
            Google Drive Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backup">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-accent" />
                  Create Backup
                </CardTitle>
                <CardDescription>
                  Create a backup of the entire database. Files are saved to the backups directory. Admin password required.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => { setAdminPassword(""); setPasswordError(""); setPasswordDialog(true); }}
                    disabled={backupMutation.isPending}
                    className="gap-2"
                  >
                    {backupMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {backupMutation.isPending ? "Creating..." : "Create Backup Now"}
                  </Button>
                  {backupStatus && (
                    <div className={`flex items-center gap-2 text-sm ${backupStatus.type === "success" ? "text-success" : "text-danger"}`}>
                      {backupStatus.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {backupStatus.message}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-accent" />
                  Backup History
                </CardTitle>
                <CardDescription>
                  {backups.length > 0
                    ? `${backups.length} backup${backups.length > 1 ? "s" : ""} — Total: ${formatFileSize(totalBackupSize)}`
                    : "No backups found"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {backupsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
                  </div>
                ) : backups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-text-secondary">
                    <Database className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">No backups yet. Create your first backup above.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backups.map((backup: BackupEntry) => (
                      <div key={backup.name} className="flex items-center justify-between rounded-lg border border-border bg-surface-2/50 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Database className="h-4 w-4 shrink-0 text-text-secondary" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{backup.name}</p>
                            <p className="text-xs text-text-secondary">
                              {formatDateTime(backup.createdAt)} — {formatFileSize(backup.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => { if (confirm("Delete this backup?")) deleteBackupMutation.mutate(backup.name); }}
                          className="h-8 w-8 rounded-md flex items-center justify-center text-text-secondary hover:text-danger hover:bg-danger/5 transition-colors shrink-0"
                          title="Delete backup"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gdrive">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HardDrive className="h-5 w-5 text-accent" />
                Google Drive Integration
              </CardTitle>
              <CardDescription>
                Configure Google Drive API credentials to enable automatic backup uploads to your Google Drive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {gdriveLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      {gdriveForm.connected ? (
                        <Cloud className="h-8 w-8 text-accent" />
                      ) : (
                        <CloudOff className="h-8 w-8 text-text-secondary" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {gdriveForm.connected ? "Connected" : "Not Connected"}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {gdriveForm.connected
                            ? "Your Google Drive is linked. Backups can be uploaded automatically."
                            : "Link your Google Drive account to enable cloud backups."}
                        </p>
                      </div>
                    </div>
                    {gdriveForm.connected ? (
                      <Button variant="destructive" size="sm" onClick={handleDisconnect} className="gap-2">
                        <Link2Off className="h-4 w-4" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleConnect} className="gap-2" disabled={!gdriveForm.clientId || !gdriveForm.clientSecret}>
                        <Link2 className="h-4 w-4" />
                        Connect
                      </Button>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label>Client ID</Label>
                      <Input
                        value={gdriveForm.clientId}
                        onChange={(e) => setGdriveForm({ ...gdriveForm, clientId: e.target.value })}
                        placeholder="Enter your Google Drive Client ID"
                      />
                    </div>
                    <div>
                      <Label>Client Secret</Label>
                      <Input
                        type="password"
                        value={gdriveForm.clientSecret}
                        onChange={(e) => setGdriveForm({ ...gdriveForm, clientSecret: e.target.value })}
                        placeholder="Enter your Google Drive Client Secret"
                      />
                    </div>
                    <div>
                      <Label>Redirect URI</Label>
                      <Input
                        value={gdriveForm.redirectUri}
                        onChange={(e) => setGdriveForm({ ...gdriveForm, redirectUri: e.target.value })}
                        placeholder="http://localhost:3456/auth/callback"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Auto-upload backups</p>
                      <p className="text-xs text-text-secondary">
                        Automatically upload new backups to Google Drive
                      </p>
                    </div>
                    <button
                      onClick={() => setGdriveForm({ ...gdriveForm, autoUpload: !gdriveForm.autoUpload })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gdriveForm.autoUpload ? "bg-accent" : "bg-border"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gdriveForm.autoUpload ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  <Button
                    onClick={handleSaveGdrive}
                    disabled={saveGdriveMutation.isPending}
                    className="w-full"
                  >
                    {saveGdriveMutation.isPending ? "Saving..." : "Save Google Drive Settings"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={passwordDialog} onOpenChange={(o) => { if (!o) { setPasswordDialog(false); setAdminPassword(""); setPasswordError(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Admin Password Required
            </DialogTitle>
            <DialogDescription>Enter your admin password to create a database backup.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleBackupWithPassword(); }}
              />
            </div>
            {passwordError && <p className="text-sm text-danger">{passwordError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setPasswordDialog(false); setAdminPassword(""); setPasswordError(""); }}>Cancel</Button>
              <Button onClick={handleBackupWithPassword} disabled={!adminPassword}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
