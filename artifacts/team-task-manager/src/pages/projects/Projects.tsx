import { useListProjects } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Briefcase, Users, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ProjectStatusBadge } from "@/components/ui/badges";

export function Projects() {
  const { data: projects, isLoading } = useListProjects();
  const { isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin ? "Manage your team's workspaces" : "Your assigned workspaces"}
          </p>
        </div>
        {isAdmin && (
          <Link href="/projects/new">
            <Button size="sm" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </Link>
        )}
      </div>

      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center mb-4 animate-float">
            <Briefcase className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No projects yet</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs">
            {isAdmin ? "Create your first project to start organizing your team's work." : "You haven't been assigned to any projects yet."}
          </p>
          {isAdmin && (
            <Link href="/projects/new">
              <Button variant="outline" className="mt-5 border-primary/30 text-primary hover:bg-primary/10">
                <Plus className="mr-2 h-4 w-4" /> Create First Project
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
          {projects.map((project, i) => {
            const progress = project.totalTasks === 0 ? 0 : Math.round((project.completedTasks / project.totalTasks) * 100);
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="group border-border/50 bg-card hover-glow animate-slide-in-up cursor-pointer h-full flex flex-col">
                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <ProjectStatusBadge status={project.status} />
                    </div>

                    {/* Title & desc */}
                    <div className="flex-1 mb-4">
                      <h3 className="font-semibold text-foreground leading-tight mb-1 group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{project.description}</p>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-foreground">{progress}%</span>
                      </div>
                      <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full progress-gradient transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {project.memberCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {project.completedTasks}/{project.totalTasks}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
