import { useParams, Link, useLocation } from "wouter";
import {
  useGetProject, useDeleteProject, getListProjectsQueryKey,
  useListUsers, useAddProjectMember, useRemoveProjectMember, getGetProjectQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Edit, Plus, UserMinus, ArrowLeft, Clock, Users, CheckCircle2, ListTodo } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { queryClient } from "@/lib/queryClient";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, PriorityBadge, ProjectStatusBadge } from "@/components/ui/badges";

export function ProjectDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const { data: project, isLoading } = useGetProject(id);
  const { data: allUsers } = useListUsers({ query: { enabled: !!project } });
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const deleteMutation = useDeleteProject();
  const addMemberMutation = useAddProjectMember();
  const removeMemberMutation = useRemoveProjectMember();

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
      </div>
    );
  }

  const handleDelete = () => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast({ title: "Project deleted" });
        setLocation("/projects");
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.data?.error || "Failed to delete" }),
    });
  };

  const handleAddMember = () => {
    if (!selectedUserId) return;
    addMemberMutation.mutate({ id, data: { userId: parseInt(selectedUserId) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(id) });
        toast({ title: "Member added successfully" });
        setIsAddMemberOpen(false);
        setSelectedUserId("");
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.data?.error || "Failed to add member" }),
    });
  };

  const handleRemoveMember = (userId: number) => {
    removeMemberMutation.mutate({ projectId: id, userId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(id) });
        toast({ title: "Member removed" });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.data?.error || "Failed to remove member" }),
    });
  };

  const availableUsers = allUsers?.filter(u => !project.members.some(m => m.userId === u.id)) || [];
  const progress = project.totalTasks === 0 ? 0 : Math.round((project.completedTasks / project.totalTasks) * 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon" className="h-8 w-8 border border-border/50 hover:border-border mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight truncate">{project.title}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="text-sm text-muted-foreground">Created by {project.createdByName}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={`/projects/${id}/edit`}>
              <Button variant="outline" size="sm" className="border-border/60">
                <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete project?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete "{project.title}" and all its tasks. This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Project"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Description + Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {project.description && (
          <Card className="sm:col-span-2 border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>
        )}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
            <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full progress-gradient transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-1 text-center text-xs">
              <div className="rounded bg-secondary/50 py-1.5">
                <div className="font-bold text-muted-foreground">{project.tasks.filter(t => t.status === "todo").length}</div>
                <div className="text-muted-foreground/60">Todo</div>
              </div>
              <div className="rounded bg-secondary/50 py-1.5">
                <div className="font-bold text-blue-400">{project.tasks.filter(t => t.status === "in_progress").length}</div>
                <div className="text-muted-foreground/60">Active</div>
              </div>
              <div className="rounded bg-secondary/50 py-1.5">
                <div className="font-bold text-emerald-400">{project.completedTasks}</div>
                <div className="text-muted-foreground/60">Done</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks + Team */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              Tasks
              <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">{project.tasks.length}</span>
            </h2>
            {isAdmin && (
              <Link href={`/tasks/new?projectId=${id}`}>
                <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Task
                </Button>
              </Link>
            )}
          </div>

          {project.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/50 rounded-xl">
              <ListTodo className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No tasks yet</p>
              {isAdmin && (
                <Link href={`/tasks/new?projectId=${id}`}>
                  <Button variant="link" className="mt-2 text-primary h-auto p-0">Create the first task</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {project.tasks.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}/edit`}>
                  <div className="group flex items-center gap-4 rounded-xl border border-border/40 bg-card/50 p-4 hover:bg-card hover:border-primary/25 hover:-translate-y-0.5 cursor-pointer transition-all duration-150">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{task.title}</span>
                        {task.isOverdue && task.status !== "completed" && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-400/10 border border-red-400/20 rounded-full px-2 py-0.5">
                            <Clock className="h-2.5 w-2.5" /> Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{task.assignedToName ? `${task.assignedToName}` : "Unassigned"}</span>
                        {task.dueDate && <span>· Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Team */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Team
              <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">{project.members.length}</span>
            </h2>
            {isAdmin && (
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>Select a user to add to this project.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Select user..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {availableUsers.length === 0
                          ? <SelectItem value="__none" disabled>All users are already members</SelectItem>
                          : availableUsers.map(u => (
                            <SelectItem key={u.id} value={u.id.toString()}>
                              <span className="font-medium">{u.name}</span>
                              <span className="text-muted-foreground ml-2 text-xs">{u.email}</span>
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddMember} className="w-full" disabled={!selectedUserId || addMemberMutation.isPending}>
                      {addMemberMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add to Project
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card className="border-border/50 divide-y divide-border/40">
            <CardContent className="p-0">
              {project.members.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No members yet</div>
              ) : (
                project.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-4 hover:bg-secondary/20 transition-colors">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${member.role === "admin" ? "bg-primary/15 text-primary ring-1 ring-primary/25" : "bg-secondary text-secondary-foreground"}`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{member.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                    </div>
                    {isAdmin && member.role !== "admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={removeMemberMutation.isPending}
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
