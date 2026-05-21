export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    todo: "badge-todo",
    in_progress: "badge-in-progress",
    completed: "badge-completed",
  };
  const labels: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    completed: "Completed",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${map[status] ?? "badge-todo"}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: "badge-high",
    medium: "badge-medium",
    low: "badge-low",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[priority] ?? "badge-low"}`}>
      {priority}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "badge-active",
    completed: "badge-completed",
    on_hold: "badge-on-hold",
  };
  const labels: Record<string, string> = {
    active: "Active",
    completed: "Completed",
    on_hold: "On Hold",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status] ?? "badge-active"}`}>
      {labels[status] ?? status}
    </span>
  );
}
