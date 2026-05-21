import { Router } from "express";
import { db, tasksTable, projectsTable, usersTable, projectMembersTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { CreateTaskBody, UpdateTaskBody } from "@workspace/api-zod";

const router = Router();

function formatTask(task: typeof tasksTable.$inferSelect, projectTitle: string, assignedUser: { name: string } | null) {
  const now = new Date();
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? null,
    isOverdue: task.dueDate != null && task.status !== "completed" && new Date(task.dueDate) < now,
    projectId: task.projectId,
    projectTitle,
    assignedToId: task.assignedToId ?? null,
    assignedToName: assignedUser?.name ?? null,
    createdById: task.createdById,
    createdAt: task.createdAt.toISOString(),
  };
}

router.get("/tasks", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === "admin";

  const { projectId, status, priority } = req.query as { projectId?: string; status?: string; priority?: string };

  const rows = await db.select({
    task: tasksTable,
    projectTitle: projectsTable.title,
    assignedUser: usersTable,
  }).from(tasksTable)
    .innerJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
    .leftJoin(usersTable, eq(tasksTable.assignedToId, usersTable.id))
    .orderBy(tasksTable.createdAt);

  let filtered = rows;

  if (!isAdmin) {
    filtered = filtered.filter(r => r.task.assignedToId === userId);
  }

  if (projectId) {
    const pid = parseInt(projectId);
    filtered = filtered.filter(r => r.task.projectId === pid);
  }
  if (status) {
    filtered = filtered.filter(r => r.task.status === status);
  }
  if (priority) {
    filtered = filtered.filter(r => r.task.priority === priority);
  }

  res.json(filtered.map(({ task, projectTitle, assignedUser }) =>
    formatTask(task, projectTitle, assignedUser)
  ));
});

router.post("/tasks", requireAuth, requireAdmin, async (req, res) => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { title, description, status, priority, dueDate, projectId, assignedToId } = parsed.data;

  const [task] = await db.insert(tasksTable).values({
    title,
    description: description || null,
    status: (status as "todo" | "in_progress" | "completed") || "todo",
    priority: (priority as "low" | "medium" | "high") || "medium",
    dueDate: dueDate || null,
    projectId,
    assignedToId: assignedToId || null,
    createdById: req.user!.id,
  }).returning();

  const [projectRow] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, projectId)).limit(1);
  let assignedUser = null;
  if (assignedToId) {
    const [u] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, assignedToId)).limit(1);
    assignedUser = u ?? null;
  }

  res.status(201).json(formatTask(task, projectRow?.title ?? "", assignedUser));
});

router.get("/tasks/:id", requireAuth, async (req, res) => {
  const taskId = parseInt(req.params.id as string);
  if (isNaN(taskId)) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const [row] = await db.select({
    task: tasksTable,
    projectTitle: projectsTable.title,
    assignedUser: usersTable,
  }).from(tasksTable)
    .innerJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
    .leftJoin(usersTable, eq(tasksTable.assignedToId, usersTable.id))
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  // Members can only see their own tasks
  if (req.user!.role !== "admin" && row.task.assignedToId !== req.user!.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  res.json(formatTask(row.task, row.projectTitle, row.assignedUser));
});

router.put("/tasks/:id", requireAuth, async (req, res) => {
  const taskId = parseInt(req.params.id as string);
  if (isNaN(taskId)) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const [existing] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const isAdmin = req.user!.role === "admin";
  const isAssigned = existing.assignedToId === req.user!.id;

  // Members can only update status of their own tasks
  if (!isAdmin && !isAssigned) {
    res.status(403).json({ error: "You can only update tasks assigned to you" });
    return;
  }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const body = parsed.data;

  // Members can only change status
  const updates: Partial<typeof tasksTable.$inferInsert> = {};
  if (body.status !== undefined) updates.status = body.status as "todo" | "in_progress" | "completed";

  if (isAdmin) {
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description || null;
    if (body.priority !== undefined) updates.priority = body.priority as "low" | "medium" | "high";
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate || null;
    if (body.assignedToId !== undefined) updates.assignedToId = body.assignedToId;
  }

  const [updated] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, taskId)).returning();

  const [projectRow] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, updated.projectId)).limit(1);
  let assignedUser = null;
  if (updated.assignedToId) {
    const [u] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.assignedToId)).limit(1);
    assignedUser = u ?? null;
  }

  res.json(formatTask(updated, projectRow?.title ?? "", assignedUser));
});

router.delete("/tasks/:id", requireAuth, requireAdmin, async (req, res) => {
  const taskId = parseInt(req.params.id as string);
  if (isNaN(taskId)) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }
  await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
  res.status(204).send();
});

export default router;
