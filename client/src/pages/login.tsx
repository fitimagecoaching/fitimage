import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import athleticLogo from "@assets/logo-athletic.jpeg";
import anvilLogo from "@assets/logo-anvil.jpeg";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", { name, email, password, role: "client" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await login(email, password);
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,currentColor,currentColor_1px,transparent_1px,transparent_12px)] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logos */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <img src={athleticLogo} alt="FitImage" className="h-14 w-auto object-contain" />
          <div className="w-px h-10 bg-border" />
          <img src={anvilLogo} alt="Anvil Method" className="h-12 w-12 object-contain rounded" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">FitImage Coaching</h1>
          <p className="text-muted-foreground text-sm mt-1">The Anvil Method™ Platform</p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-md border overflow-hidden mb-6">
          <button
            onClick={() => setTab("login")}
            data-testid="tab-login"
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${tab === "login" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab("register")}
            data-testid="tab-register"
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${tab === "register" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
          >
            Create Account
          </button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    data-testid="input-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    data-testid="input-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button data-testid="button-login" type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Coach login: coach@fitimage.com / fitimage2024
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input
                    id="reg-name"
                    data-testid="input-name"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    data-testid="input-reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    data-testid="input-reg-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button data-testid="button-register" type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Three Pillars */}
        <div className="flex justify-center gap-6 mt-8">
          {["Assess", "Program", "Accountability"].map((pillar) => (
            <div key={pillar} className="text-center">
              <div className="text-xs font-bold text-primary uppercase tracking-widest">{pillar}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
