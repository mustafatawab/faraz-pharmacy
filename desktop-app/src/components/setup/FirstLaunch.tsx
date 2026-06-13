import { useState } from "react";
import { Monitor, Server, Wifi, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FirstLaunchProps {
  onComplete: () => void;
}

export default function FirstLaunch({ onComplete }: FirstLaunchProps) {
  const [step, setStep] = useState<"choose" | "server-ip" | "client">("choose");
  const [serverIp, setServerIp] = useState("192.168.1.");
  const [myIp, setMyIp] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(cfg: { mode: string; serverUrl?: string }) {
    setSaving(true);
    await window.saveConfig(cfg);
    setSaving(false);
    onComplete();
  }

  async function handleChooseServer() {
    try {
      const ip = await window.getServerIp();
      setMyIp(ip);
      setStep("server-ip");
    } catch {
      save({ mode: "server" });
    }
  }

  if (step === "server-ip") {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Wifi className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Server is Ready</h2>
          <p className="text-sm text-text-secondary mb-6">
            Other machines need this IP to connect. Enter it on each client machine during setup.
          </p>
          <div className="bg-surface-2 rounded-xl p-4 mb-6 border border-border">
            <p className="text-xs text-text-secondary mb-1">This machine's IP address</p>
            <p className="text-2xl font-mono font-bold text-accent">{myIp}</p>
            <p className="text-xs text-text-secondary mt-2">Port: <span className="font-mono">3456</span></p>
          </div>
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <div className="text-xs text-text-secondary">
                <p className="font-medium text-warning mb-1">How to find this IP:</p>
                <p><strong>Windows:</strong> Open Command Prompt, type <span className="font-mono bg-surface-2 px-1 rounded">ipconfig</span>, look for <em>IPv4 Address</em> under your ethernet adapter.</p>
                <p className="mt-1"><strong>Mac:</strong> Open Terminal, type <span className="font-mono bg-surface-2 px-1 rounded">ifconfig</span>, look for <span className="font-mono bg-surface-2 px-1 rounded">inet</span> under <span className="font-mono bg-surface-2 px-1 rounded">en0</span> or <span className="font-mono bg-surface-2 px-1 rounded">en1</span>.</p>
              </div>
            </div>
          </div>
          <Button className="w-full" onClick={() => save({ mode: "server" })}>
            {saving ? "Saving..." : "Continue to App"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Monitor className="h-7 w-7 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Faraz Pharmacy</h1>
          <p className="text-sm text-text-secondary mt-1">First-time setup — choose how this machine runs</p>
        </div>

        {step === "choose" ? (
          <div className="space-y-3">
            <button
              onClick={handleChooseServer}
              className="w-full text-left p-5 rounded-xl border-2 border-border hover:border-accent/40 hover:bg-accent/5 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                  <Server className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Server Machine</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Stores the database and shares it over your local network.
                    Other machines will connect to this one.
                  </p>
                  <p className="text-xs text-text-secondary mt-2">
                    ⚡ This machine must stay on while others use the system
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setStep("client")}
              className="w-full text-left p-5 rounded-xl border-2 border-border hover:border-accent/40 hover:bg-accent/5 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                  <Monitor className="h-5 w-5 text-text-secondary group-hover:text-accent transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Client Machine</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Connects to the server machine over ethernet.
                    All data is stored on the server.
                  </p>
                  <p className="text-xs text-text-secondary mt-2">
                    ⚡ Requires: server machine to be on and connected
                  </p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Server IP Address</Label>
              <Input
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value)}
                placeholder="e.g. 192.168.1.100"
                className="mt-1 font-mono"
                autoFocus
              />
              <div className="bg-surface-2 border border-border rounded-xl p-3 mt-3">
                <p className="text-xs text-text-secondary">
                  <strong>How to find this:</strong> On the server machine, open Command Prompt and type{' '}
                  <span className="font-mono bg-border px-1 rounded">ipconfig</span>.
                  Look for <em>IPv4 Address</em> under your ethernet adapter (e.g., <span className="font-mono">192.168.1.100</span>).
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("choose")}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!serverIp}
                onClick={() => save({ mode: "client", serverUrl: `http://${serverIp}:3456` })}
              >
                {saving ? "Saving..." : "Connect"}
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-text-secondary text-center mt-8">
          This setting can be changed later by deleting the config file.
        </p>
      </div>
    </div>
  );
}
