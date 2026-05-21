import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { Briefcase, CheckSquare, LayoutDashboard, LogOut, Loader2, ListTodo, Menu, X, Shield, User } from "lucide-react";
import { useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout, isAdmin } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center animate-glow">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <>{children}</>;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: (p: string) => p === "/dashboard" },
    { href: "/projects", label: "Projects", icon: Briefcase, match: (p: string) => p.startsWith("/projects") },
    { href: "/tasks", label: "My Tasks", icon: ListTodo, match: (p: string) => p.startsWith("/tasks") },
  ];

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? "?";

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
          <CheckSquare className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-bold text-sm text-sidebar-foreground leading-tight">Team Task</div>
          <div className="text-xs text-sidebar-foreground/40 leading-tight">Manager</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="mb-2 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">Navigation</p>
        </div>
        <ul className="space-y-0.5">
          {navLinks.map(({ href, label, icon: Icon, match }) => {
            const active = match(location);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`nav-link ${active ? "active" : ""}`}
                >
                  <Icon className={`h-4 w-4 nav-icon flex-shrink-0 transition-colors ${active ? "text-primary" : ""}`} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-sidebar-accent/50 group">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${isAdmin ? "bg-primary/20 text-primary ring-1 ring-primary/30" : "bg-secondary text-secondary-foreground"}`}>
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</div>
            <div className="flex items-center gap-1 mt-0.5">
              {isAdmin
                ? <span className="text-[10px] font-medium text-primary flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> Admin</span>
                : <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><User className="w-2.5 h-2.5" /> Member</span>
              }
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 flex-shrink-0 transition-colors"
            onClick={logout}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-30 bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-sidebar border-r border-sidebar-border md:hidden transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-3 border-b border-border/50 bg-background/80 backdrop-blur px-4 md:hidden sticky top-0 z-20">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-2 font-bold text-sm">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <CheckSquare className="h-3 w-3 text-primary-foreground" />
            </div>
            Team Tasks
          </div>
          <div className="ml-auto">
            <div className="h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page */}
        <div className="flex-1 p-4 md:p-8 w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
