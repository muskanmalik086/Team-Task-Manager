import { useState } from "react";
import { Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Loader2, Briefcase, Users, BarChart3 } from "lucide-react";

const features = [
  { icon: Briefcase, title: "Project Management", desc: "Organize work into focused workspaces" },
  { icon: Users, title: "Team Collaboration", desc: "Assign tasks and manage your team" },
  { icon: BarChart3, title: "Progress Tracking", desc: "Monitor completion and spot bottlenecks" },
];

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (data) => login(data.token),
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.data?.error || "Invalid email or password",
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-sidebar border-r border-sidebar-border relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 rounded-full bg-violet-500/5 blur-3xl" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(hsl(0 0% 15% / 0.6) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <CheckSquare className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">Team Task Manager</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight">
              Everything your<br />
              <span className="text-primary">team needs</span><br />
              in one place.
            </h1>
            <p className="mt-4 text-sidebar-foreground/60 text-lg leading-relaxed">
              Manage projects, assign tasks, and track progress — all with role-based access control.
            </p>
          </div>

          <div className="space-y-4 stagger">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 animate-slide-in-up">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sidebar-foreground text-sm">{title}</div>
                  <div className="text-sidebar-foreground/50 text-sm">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm animate-slide-in-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Team Task Manager</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-input border-border/80 focus:border-primary/60 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-input border-border/80 focus:border-primary/60 transition-colors"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                : "Sign In"
              }
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
