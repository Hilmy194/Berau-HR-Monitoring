import { requireAdmin } from "@/lib/session";
import { listTasks } from "@/lib/services/task.service";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskFormDialog } from "@/components/admin/task-form-dialog";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { TaskFilter } from "@/components/admin/task-filter";
import { TASK_STATUS_OPTIONS } from "@/lib/constants";
import { formatDate, getInitials } from "@/lib/utils";
import Link from "next/link";
import { Pencil, Clock, ListChecks, SearchX } from "lucide-react";

export const metadata = { title: "Task Management — HR Digital" };

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; employee?: string }>;
}) {
  await requireAdmin();

  const sp = await searchParams;
  const filters = {
    status: sp?.status,
    profileId: sp?.employee,
  };

  const [tasks, employees] = await Promise.all([
    listTasks(filters),
    prisma.profile.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const statusOptions = [...TASK_STATUS_OPTIONS];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Task Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create, assign, and update probation tasks across all employees.
          </p>
        </div>
        <TaskFormDialog
          mode="create"
          employees={employees.map((e) => ({ id: e.id, name: e.user.name, department: e.department }))}
        />
      </div>

      <TaskFilter
        employees={employees.map((e) => ({ id: e.id, name: e.user.name }))}
        statuses={statusOptions}
        current={{ status: filters.status, employee: filters.profileId }}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <SearchX className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">No tasks found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Link href={`/admin/employees/${task.profile.id}`} className="hover:text-primary">
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{task.description}</p>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                            {getInitials(task.profile.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.profile.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{formatDate(task.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={task.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TaskFormDialog
                          mode="edit"
                          task={{
                            id: task.id,
                            title: task.title,
                            description: task.description,
                            dueDate: task.dueDate?.toISOString(),
                            status: task.status,
                            notes: task.notes,
                          }}
                          trigger={
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground">
                              <Pencil className="h-4 w-4" />
                            </span>
                          }
                        />
                        <ConfirmDelete endpoint={`/api/admin/tasks/${task.id}`} label="task" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ListChecks className="h-3.5 w-3.5" />
        Showing {tasks.length} task{tasks.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
