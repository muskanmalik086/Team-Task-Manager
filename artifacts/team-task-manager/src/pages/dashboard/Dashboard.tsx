import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  Briefcase, CheckCircle2, Clock, ListTodo, Loader2,
  TrendingUp, AlertTriangle, Activity, ArrowRight
} from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/ui/badges";

const STAT_CARDS = [
  {
    key: "totalProjects",
    label: "Total Projects",
    icon: Briefcase,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    glow: "shadow-blue-500/10",
  },
  {
    key: "totalTasks",
    label: "Total Tasks",
    icon: ListTodo,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    glow: "shadow-violet-500/10",
  },
  {
    key: "completedTasks",
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    glow: "shadow-emerald-500/10",
  },
  {
    key: "overdueTasks",
    label: "Overdue",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    glow: "shadow-red-500/10",
  },
] as const;

export function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
      </div>
    );
  }

  const completionRate = dashboard.totalTasks === 0
    ? 0
    : Math.round((dashboard.completedTasks / dashboard.totalTasks) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your workspace overview</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 border border-border/50">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span>{dashboard.inProgressTasks} active tasks</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg, border, glow }) => (
          <Card
            key={key}
            className={`animate-slide-in-up border ${border} shadow-lg ${glow} hover-glow group`}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                <div className={`w-8 h-8 rounded-lg ${bg} ${border} border flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground animate-count-up">
                {(dashboard as any)[key]}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Progress */}
      <Card className="border-border/50 hover-glow animate-slide-in-up">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">Overall Completion</p>
              <p className="text-xs text-muted-foreground mt-0.5">{dashboard.completedTasks} of {dashboard.totalTasks} tasks done</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
              <TrendingUp className="h-4 w-4" />
              {completionRate}%
            </div>
          </div>
          <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full progress-gradient transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {[
              { label: "To Do", value: dashboard.todoTasks, color: "text-muted-foreground" },
              { label: "In Progress", value: dashboard.inProgressTasks, color: "text-blue-400" },
              { label: "Completed", value: dashboard.completedTasks, color: "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-secondary/40 py-2 px-1">
                <div className={`text-lg font-bold ${color}`}>{value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projects + Recent Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Projects */}
        <Card className="border-border/50 hover-glow animate-slide-in-up flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">Projects</CardTitle>
            <Link href="/projects" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {dashboard.projectSummaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No projects found</p>
              </div>
            ) : (
              dashboard.projectSummaries.slice(0, 5).map((project) => {
                const progress = project.totalTasks === 0 ? 0 : Math.round((project.completedTasks / project.totalTasks) * 100);
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="group rounded-lg border border-border/40 bg-secondary/20 p-3 hover:bg-secondary/40 hover:border-primary/25 cursor-pointer transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground truncate">{project.title}</span>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{progress}%</span>
                      </div>
                      <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full progress-gradient transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{project.memberCount} members</span>
                        <span>{project.completedTasks}/{project.totalTasks} tasks</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="border-border/50 hover-glow animate-slide-in-up flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">Recent Tasks</CardTitle>
            <Link href="/tasks" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            {dashboard.recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ListTodo className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No recent tasks</p>
              </div>
            ) : (
              dashboard.recentTasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/40 bg-secondary/20 p-3 hover:bg-secondary/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      {task.isOverdue && task.status !== "completed" && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-2 py-0.5">
                          <Clock className="h-2.5 w-2.5" /> Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.projectTitle}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
