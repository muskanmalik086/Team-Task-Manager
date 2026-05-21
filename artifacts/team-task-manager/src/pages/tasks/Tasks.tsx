import { useListTasks, useUpdateTask, getListTasksQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ListTodo, Loader2, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PriorityBadge } from "@/components/ui/badges";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/useToast";

const COLUMNS = [
  { key: "todo" as const, label: "To Do", color: "border-t-slate-500", headerBorder: "border-b-2 border-b-slate-500", dot: "bg-slate-500", empty: "No tasks to do" },
  { key: "in_progress" as const, label: "In Progress", color: "border-t-blue-400", headerBorder: "border-b-2 border-b-blue-400", dot: "bg-blue-400", empty: "Nothing in progress" },
  { key: "completed" as const, label: "Completed", color: "border-t-emerald-400", headerBorder: "border-b-2 border-b-emerald-400", dot: "bg-emerald-400", empty: "Nothing completed yet" },
];

const STATUS_NEXT: Record<string, "todo" | "in_progress" | "completed"> = {
  todo: "in_progress",
  in_progress: "completed",
  completed: "todo",
};

export function Tasks() {
  const { data: tasks, isLoading } = useListTasks();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const updateMutation = useUpdateTask();

  const handleStatusToggle = (e: React.MouseEvent, task: { id: number; status: string }) => {
    e.preventDefault();
    e.stopPropagation();
    const next = STATUS_NEXT[task.status];
    updateMutation.mutate({ id: task.id, data: { status: next } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }),
      onError: (err: any) => toast({ variant: "destructive", title: "Failed to update status", description: err.data?.error }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
      </div>
    );
  }

  const tasksByStatus = {
    todo: tasks?.filter(t => t.status === "todo") || [],
    in_progress: tasks?.filter(t => t.status === "in_progress") || [],
    completed: tasks?.filter(t => t.status === "completed") || [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isAdmin ? "All Tasks" : "My Tasks"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {tasks?.length ?? 0} tasks total
          </p>
        </div>
        {isAdmin && (
          <Link href="/tasks/new">
            <Button size="sm" className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          </Link>
        )}
      </div>

      {!tasks || tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center mb-4 animate-float">
            <ListTodo className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold">No tasks assigned</h3>
          <p className="text-muted-foreground text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5 items-start">
          {COLUMNS.map(({ key, label, color, headerBorder, dot, empty }) => {
            const list = tasksByStatus[key];
            return (
              <div key={key} className="space-y-3">
                <div className={`flex items-center justify-between pb-3 ${headerBorder}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                    <h2 className="font-semibold text-sm text-foreground">{label}</h2>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-secondary/60 rounded-full px-2 py-0.5">
                    {list.length}
                  </span>
                </div>

                {list.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/40 py-8 text-center">
                    <p className="text-xs text-muted-foreground/50">{empty}</p>
                  </div>
                ) : (
                  <div className="space-y-2 stagger">
                    {list.map((task) => (
                      <Link key={task.id} href={`/tasks/${task.id}/edit`}>
                        <div className="group relative rounded-xl border border-border/40 bg-card/60 p-4 hover:bg-card hover:border-primary/25 hover:-translate-y-0.5 cursor-pointer transition-all duration-150 animate-slide-in-up">
                          {/* Status dot indicator */}
                          <div className={`absolute top-0 left-4 right-4 h-0.5 rounded-b-full ${dot} opacity-40 group-hover:opacity-80 transition-opacity`} />

                          <div className="space-y-2.5 pt-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">{task.title}</p>
                              <PriorityBadge priority={task.priority} />
                            </div>

                            <p className="text-xs text-muted-foreground truncate">{task.projectTitle}</p>

                            <div className="flex items-center justify-between pt-1">
                              <div className="text-xs text-muted-foreground">
                                {task.dueDate ? (
                                  <span className={`flex items-center gap-1 ${task.isOverdue && task.status !== "completed" ? "text-red-400 font-medium" : ""}`}>
                                    <Clock className="h-3 w-3" />
                                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                  </span>
                                ) : (
                                  <span className="opacity-40">No due date</span>
                                )}
                              </div>
                              {task.assignedToName && (
                                <div
                                  className="h-6 w-6 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center ring-1 ring-primary/20 hover:ring-primary/40 transition-all"
                                  title={task.assignedToName}
                                  onClick={(e) => handleStatusToggle(e, task)}
                                >
                                  {task.assignedToName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
