import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useCreateProject, useGetProject, useUpdateProject, getListProjectsQueryKey, getGetProjectQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

export function ProjectForm() {
  const params = useParams();
  const id = params.id ? parseInt(params.id) : undefined;
  const isEdit = !!id;
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAdmin } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "completed" | "on_hold">("active");

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const { data: project, isLoading } = useGetProject(id as number, { query: { enabled: isEdit } });
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAdmin) setLocation("/unauthorized");
  }, [isAdmin, setLocation]);

  useEffect(() => {
    if (project && !initialized.current) {
      setTitle(project.title);
      setDescription(project.description || "");
      setStatus(project.status as any);
      initialized.current = true;
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateMutation.mutate({ id: id as number, data: { title, description, status } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(id as number) });
          toast({ title: "Project updated" });
          setLocation(`/projects/${id}`);
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.data?.error || "Failed to update" }),
      });
    } else {
      createMutation.mutate({ data: { title, description, status } }, {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast({ title: "Project created" });
          setLocation(`/projects/${data.id}`);
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.data?.error || "Failed to create" }),
      });
    }
  };

  if (isEdit && isLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-7 w-7 animate-spin text-primary/60" /></div>;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-4">
        <Link href={isEdit ? `/projects/${id}` : "/projects"}>
          <Button variant="ghost" size="icon" className="h-8 w-8 border border-border/50 hover:border-border">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? "Edit Project" : "New Project"}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{isEdit ? "Update project details" : "Create a new workspace for your team"}</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium">Project Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Website Redesign"
                required
                className="h-11 bg-input/50 border-border/80 focus:border-primary/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about..."
                className="min-h-[120px] bg-input/50 border-border/80 focus:border-primary/60 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="h-11 bg-input/50 border-border/80">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40 mt-6">
              <Link href={isEdit ? `/projects/${id}` : "/projects"}>
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isPending} className="shadow-lg shadow-primary/20">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
