import { Router } from "express";
import { db, projectsTable, projectMembersTable, usersTable, tasksTable } from "@workspace/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { CreateProjectBody, UpdateProjectBody, AddProjectMemberBody } from "@workspace/api-zod";

const router = Router();

async function buildProjectSummary(projectId: number) {
  const tasks = await db.select({ status: tasksTable.status })
    .from(tasksTable).where(eq(tasksTable.projectId, projectId));
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;

  const members = await db.select({ count: sql<number>`count(*)` })
    .from(projectMembersTable).where(eq(projectMembersTable.projectId, projectId));
  const memberCount = Number(members[0]?.count ?? 0);

  return { totalTasks, completedTasks, memberCount };
}

router.get("/projects", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === "admin";

  let projectRows;
  if (isAdmin) {
    projectRows = await db.select({
      project: projectsTable,
      creatorName: usersTable.name,
    }).from(projectsTable)
      .innerJoin(usersTable, eq(projectsTable.createdById, usersTable.id))
      .orderBy(projectsTable.createdAt);
  } else {
    const memberships = await db.select({ projectId: projectMembersTable.projectId })
      .from(projectMembersTable).where(eq(projectMembersTable.userId, userId));
    const projectIds = memberships.map(m => m.projectId);
    if (projectIds.length === 0) {
      res.json([]);
      return;
    }
    projectRows = await db.select({
      project: projectsTable,
      creatorName: usersTable.name,
    }).from(projectsTable)
      .innerJoin(usersTable, eq(projectsTable.createdById, usersTable.id))
      .where(inArray(projectsTable.id, projectIds))
      .orderBy(projectsTable.createdAt);
  }

  const results = await Promise.all(projectRows.map(async ({ project, creatorName }) => {
    const summary = await buildProjectSummary(project.id);
    return {
      id: project.id,
      title: project.title,
      description: project.description ?? null,
      status: project.status,
      createdById: project.createdById,
      createdByName: creatorName,
      createdAt: project.createdAt.toISOString(),
      ...summary,
    };
  }));

  res.json(results);
});

router.post("/projects", requireAuth, requireAdmin, async (req, res) => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { title, description, status } = parsed.data;
  const [project] = await db.insert(projectsTable).values({
    title,
    description: description || null,
    status: (status as "active" | "completed" | "on_hold") || "active",
    createdById: req.user!.id,
  }).returning();

  const [creator] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);

  res.status(201).json({
    id: project.id,
    title: project.title,
    description: project.description ?? null,
    status: project.status,
    createdById: project.createdById,
    createdByName: creator.name,
    totalTasks: 0,
    completedTasks: 0,
    memberCount: 0,
    createdAt: project.createdAt.toISOString(),
  });
});

router.get("/projects/:id", requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id as string);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const [row] = await db.select({
    project: projectsTable,
    creatorName: usersTable.name,
  }).from(projectsTable)
    .innerJoin(usersTable, eq(projectsTable.createdById, usersTable.id))
    .where(eq(projectsTable.id, projectId))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // Access check for members
  if (req.user!.role !== "admin") {
    const membership = await db.select().from(projectMembersTable)
      .where(and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, req.user!.id)))
      .limit(1);
    if (membership.length === 0) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
  }

  const memberRows = await db.select({
    pm: projectMembersTable,
    user: usersTable,
  }).from(projectMembersTable)
    .innerJoin(usersTable, eq(projectMembersTable.userId, usersTable.id))
    .where(eq(projectMembersTable.projectId, projectId));

  const members = memberRows.map(({ pm, user }) => ({
    id: pm.id,
    userId: pm.userId,
    projectId: pm.projectId,
    name: user.name,
    email: user.email,
    role: user.role,
    joinedAt: pm.joinedAt.toISOString(),
  }));

  const taskRows = await db.select({
    task: tasksTable,
    assignedUser: usersTable,
    projectTitle: projectsTable.title,
  }).from(tasksTable)
    .leftJoin(usersTable, eq(tasksTable.assignedToId, usersTable.id))
    .innerJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
    .where(eq(tasksTable.projectId, projectId))
    .orderBy(tasksTable.createdAt);

  const now = new Date();
  const tasks = taskRows.map(({ task, assignedUser, projectTitle }) => ({
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
  }));

  const summary = await buildProjectSummary(projectId);

  res.json({
    id: row.project.id,
    title: row.project.title,
    description: row.project.description ?? null,
    status: row.project.status,
    createdById: row.project.createdById,
    createdByName: row.creatorName,
    createdAt: row.project.createdAt.toISOString(),
    members,
    tasks,
    ...summary,
  });
});

router.put("/projects/:id", requireAuth, requireAdmin, async (req, res) => {
  const projectId = parseInt(req.params.id as string);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const updates: Partial<{ title: string; description: string | null; status: "active" | "completed" | "on_hold" }> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description || null;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status as "active" | "completed" | "on_hold";

  const [updated] = await db.update(projectsTable).set(updates)
    .where(eq(projectsTable.id, projectId)).returning();

  if (!updated) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [creator] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.createdById)).limit(1);
  const summary = await buildProjectSummary(projectId);

  res.json({
    id: updated.id,
    title: updated.title,
    description: updated.description ?? null,
    status: updated.status,
    createdById: updated.createdById,
    createdByName: creator.name,
    createdAt: updated.createdAt.toISOString(),
    ...summary,
  });
});

router.delete("/projects/:id", requireAuth, requireAdmin, async (req, res) => {
  const projectId = parseInt(req.params.id as string);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }
  await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
  res.status(204).send();
});

router.post("/projects/:id/members", requireAuth, requireAdmin, async (req, res) => {
  const projectId = parseInt(req.params.id as string);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const parsed = AddProjectMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { userId } = parsed.data;

  const existing = await db.select().from(projectMembersTable)
    .where(and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "User is already a member of this project" });
    return;
  }

  const [pm] = await db.insert(projectMembersTable).values({ projectId, userId }).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  res.status(201).json({
    id: pm.id,
    userId: pm.userId,
    projectId: pm.projectId,
    name: user.name,
    email: user.email,
    role: user.role,
    joinedAt: pm.joinedAt.toISOString(),
  });
});

router.delete("/projects/:id/members/:userId", requireAuth, requireAdmin, async (req, res) => {
  const projectId = parseInt(req.params.id as string);
  const userId = parseInt(req.params.userId as string);
  if (isNaN(projectId) || isNaN(userId)) {
    res.status(400).json({ error: "Invalid IDs" });
    return;
  }
  await db.delete(projectMembersTable)
    .where(and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, userId)));
  res.status(204).send();
});

export default router;
