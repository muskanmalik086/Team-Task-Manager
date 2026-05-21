import { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import {
  useCreateTask, useGetTask, useUpdateTask, useDeleteTask,
  useListProjects, useListUsers,
  getListTasksQueryKey, getGetProjectQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function TaskForm() {
  const params = useParams();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const defaultProjectId = searchParams.get("projectId") || "";

  const id = params.id ? parseInt(params.id) : undefined;
  const isEdit = !!id;
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAdmin, user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"todo" | "in_progress" | "completed">("todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [assignedToId, setAssignedToId] = useState<string>("unassigned");
  const [dueDate, setDueDate] = useState<string>("");

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const { data: task, isLoading: isLoadingTask } = useGetTask(id as number, { query: { enabled: isEdit } });
  const { data: projects, isLoading: isLoadingProjects } = useListProjects();
  const { data: users } = useListUsers({ query: { enabled: isAdmin } });

  const initialized = useRef(false);

  useEffect(() => {
    if (!isAdmin && !isEdit) setLocation("/unauthorized");
  }, [isAdmin, isEdit, setLocation]);

  useEffect(() => {
    if (task && !initialized.current) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status as any);
      setPriority(task.priority as any);
      setProjectId(task.projectId.toString());
      setAssignedToId(task.assignedToId ? task.assignedToId.toString() : "unassigned");
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
      initialized.current = true;
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData: any = { title, description, status, priority };
    if (assignedToId !== "unassigned") taskData.assignedToId = parseInt(assignedToId);
    if (dueDate) taskData.dueDate = new Date(dueDate).toISOString();

    if (isEdit) {
      updateMutation.mutate({ id: id as number, data: taskData }, {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(data.projectId) });
          toast({ title: "Task updated" });
          setLocation("/tasks");
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.data?.error || "Failed to update" }),
      });
    } else {
      taskData.projectId = parseInt(projectId);
      createMutation.mutate({ data: taskData }, {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(data.projectId) });
          toast({ title: "Task created" });
          setLocation(defaultProjectId ? `/projects/${defaultProjectId}` : "/tasks");
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.data?.error || "Failed to create" }),
      });
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: id as number }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        if (task) queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(task.projectId) });
        toast({ title: "Task deleted" });
        setLocation("/tasks");
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.data?.error || "Failed to delete" }),
    });
  };

  if ((isEdit && isLoadingTask) || isLoadingProjects) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-7 w-7 animate-spin text-primary/60" /></div>;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const canEditDetails = isAdmin;
  const isAssignee = task?.assignedToId === user?.id;
  const canEditStatus = isAdmin || isAssignee;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={defaultProjectId ? `/projects/${defaultProjectId}` : "/tasks"}>
            <Button variant="ghost" size="icon" className="h-8 w-8 border border-border/50 hover:border-border">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? "Edit Task" : "New Task"}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{isEdit ? "Update task details" : "Create a new work item"}</p>
          </div>
        </div>
        {isEdit && isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete task?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Card className="border-border/50 shadow-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium">Task Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design landing page"
                required
                disabled={!canEditDetails}
                className="h-11 bg-input/50 border-border/80 focus:border-primary/60 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be done..."
                className="min-h-[100px] bg-input/50 border-border/80 focus:border-primary/60 resize-none disabled:opacity-60"
                disabled={!canEditDetails}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)} disabled={!canEditStatus}>
                  <SelectTrigger className="h-11 bg-input/50 border-border/80 disabled:opacity-60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)} disabled={!canEditDetails}>
                  <SelectTrigger className="h-11 bg-input/50 border-border/80 disabled:opacity-60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isEdit && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Project <span className="text-destructive">*</span></Label>
                  <Select value={projectId} onValueChange={setProjectId} disabled={!!defaultProjectId}>
                    <SelectTrigger className="h-11 bg-input/50 border-border/80 disabled:opacity-60">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {projects?.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isAdmin && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Assignee</Label>
                  <Select value={assignedToId} onValueChange={setAssignedToId}>
                    <SelectTrigger className="h-11 bg-input/50 border-border/80">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users?.map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-sm font-medium">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={!canEditDetails}
                  className="h-11 bg-input/50 border-border/80 focus:border-primary/60 disabled:opacity-60"
                />
              </div>
            </div>

            {(canEditDetails || canEditStatus) && (
              <div className="flex justify-end gap-2 pt-2 border-t border-border/40 mt-6">
                <Link href={defaultProjectId ? `/projects/${defaultProjectId}` : "/tasks"}>
                  <Button type="button" variant="ghost">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isPending || (!isEdit && !projectId)} className="shadow-lg shadow-primary/20">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? "Save Changes" : "Create Task"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
