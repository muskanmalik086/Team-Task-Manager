import { useState } from "react";
import { Link } from "wouter";
import { useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Loader2, Shield, User } from "lucide-react";

export function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const { login } = useAuth();
  const { toast } = useToast();
  const signupMutation = useSignup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({ data: { name, email, password, role } }, {
      onSuccess: (data) => login(data.token),
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: error.data?.error || "Could not create account",
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-in-up">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 animate-float">
            <CheckSquare className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
          <p className="text-muted-foreground mt-1 text-sm">Join Team Task Manager</p>
        </div>

        <div className="glass rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <Input
                id="name"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-input/50 border-border/80 focus:border-primary/60 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-input/50 border-border/80 focus:border-primary/60 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 bg-input/50 border-border/80 focus:border-primary/60 transition-colors"
              />
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Account Role</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["member", "admin"] as const).map((r) => {
                  const Icon = r === "admin" ? Shield : User;
                  const selected = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium border transition-all ${
                        selected
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-secondary/30 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="capitalize">{r}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2 bg-primary hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
                : "Create Account"
              }
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
