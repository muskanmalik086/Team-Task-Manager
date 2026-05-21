import { Switch, Route, Redirect } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

import { Login } from "@/pages/auth/Login";
import { Signup } from "@/pages/auth/Signup";
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { Projects } from "@/pages/projects/Projects";
import { ProjectDetail } from "@/pages/projects/ProjectDetail";
import { ProjectForm } from "@/pages/projects/ProjectForm";
import { Tasks } from "@/pages/tasks/Tasks";
import { TaskForm } from "@/pages/tasks/TaskForm";
import { Unauthorized } from "@/pages/Unauthorized";
import NotFound from "@/pages/not-found";

export function AppRoutes() {
  const { isAuthenticated, isLoading, isPendingAuth } = useAuth();

  if (isLoading || isPendingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/projects/new" component={ProjectForm} />
        <Route path="/projects/:id/edit" component={ProjectForm} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/projects" component={Projects} />
        <Route path="/tasks/new" component={TaskForm} />
        <Route path="/tasks/:id/edit" component={TaskForm} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/unauthorized" component={Unauthorized} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}
