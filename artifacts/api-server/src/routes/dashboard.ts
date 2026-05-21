import { Router } from "express";
import { db, tasksTable, projectsTable, usersTable, projectMembersTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

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

router.get("/dashboard", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === "admin";
  const now = new Date();

  // Get tasks (all for admin, assigned for member)
  const allTaskRows = await db.select({
    task: tasksTable,
    projectTitle: projectsTable.title,
    assignedUser: usersTable,
  }).from(tasksTable)
    .innerJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
    .leftJoin(usersTable, eq(tasksTable.assignedToId, usersTable.id))
    .orderBy(tasksTable.createdAt);

  const taskRows = isAdmin ? allTaskRows : allTaskRows.filter(r => r.task.assignedToId === userId);

  const tasks = taskRows.map(({ task, projectTitle, assignedUser }) => formatTask(task, projectTitle, assignedUser));
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
  const todoTasks = tasks.filter(t => t.status === "todo").length;
  const overdueTasks = tasks.filter(t => t.isOverdue).length;

  const recentTasks = tasks.slice(-5).reverse();

  type ProjectRow = { project: typeof projectsTable.$inferSelect; creatorName: string };

  // Get projects
  let projectRows: ProjectRow[];
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
      projectRows = [];
    } else {
      projectRows = await db.select({
        project: projectsTable,
        creatorName: usersTable.name,
      }).from(projectsTable)
        .innerJoin(usersTable, eq(projectsTable.createdById, usersTable.id))
        .where(inArray(projectsTable.id, projectIds));
    }
  }

  const projectSummaries = await Promise.all(projectRows.map(async ({ project, creatorName }) => {
    const pTasks = await db.select({ status: tasksTable.status })
      .from(tasksTable).where(eq(tasksTable.projectId, project.id));
    const totalTasks = pTasks.length;
    const completedTasks = pTasks.filter(t => t.status === "completed").length;
    const members = await db.select().from(projectMembersTable).where(eq(projectMembersTable.projectId, project.id));
    return {
      id: project.id,
      title: project.title,
      description: project.description ?? null,
      status: project.status,
      createdById: project.createdById,
      createdByName: creatorName,
      totalTasks,
      completedTasks,
      memberCount: members.length,
      createdAt: project.createdAt.toISOString(),
    };
  }));

  res.json({
    totalProjects: projectSummaries.length,
    totalTasks: tasks.length,
    completedTasks,
    inProgressTasks,
    todoTasks,
    overdueTasks,
    recentTasks,
    projectSummaries,
  });
});

export default router;
